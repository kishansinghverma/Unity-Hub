import {
    EmandiCredentials,
    EMandiSession,
    EMandiSessionInfo,
    ExecutionResponse,
    LoginResponse,
    LoginToken,
} from "../common/types";
import { Logger, String, Throwable } from "../common/models";
import { eMandiPortal, source } from "../common/constants";
import { visionService } from "./vision";
import { keyVault } from "../operations/keyvault";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";

const SESSION_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_LOGIN_ATTEMPTS = 3;
const BASE_URL = eMandiPortal.baseUrl;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const CREDENTIAL_KEYS = {
    username: "emandi.username",
    password: "emandi.password"
};

type EmandiRequestConfig = {
    url: string;
    method: "POST";
    headers: Record<string, string>;
    body: string;
};

export class EMandiService {
    private readonly logger: Logger;
    private readonly cookieJar: CookieJar;
    private readonly fetch: typeof fetch;

    private session: EMandiSession | null = null;
    private authenticationPromise: Promise<void> | null = null;

    constructor() {
        this.logger = new Logger(source.emandi);
        this.cookieJar = new CookieJar();
        this.fetch = fetchCookie(fetch, this.cookieJar);
    }

    public initialize = async (request: EmandiCredentials): Promise<ExecutionResponse> => {
        await this.saveCredential(CREDENTIAL_KEYS.username, request.username);
        await this.saveCredential(CREDENTIAL_KEYS.password, request.password);
        await this.purgeCurrentSession()

        return {
            content: { initialized: true, message: "eMandi credentials initialized" },
            statusCode: 200
        };
    };

    public getSessionStatus = async (): Promise<ExecutionResponse> => {
        const cookies = await this.cookieJar.getCookies(BASE_URL);
        const authenticated = this.isSessionActive();

        const info: EMandiSessionInfo = {
            authenticated,
            isExpired: !authenticated && !!this.session,
            cookieCount: cookies.length,
            ...this.session,
        };

        return { content: info, statusCode: 200 };
    };

    public sendRequest = async (config: EmandiRequestConfig, allowRetry = true): Promise<ExecutionResponse> => {
        await this.ensureSession();

        const url = this.getAbsoluteUrl(config.url);
        const requestOptions = this.buildRequestOptions(config);
        this.logger.log(`[${requestOptions.method}] ${url}`);

        const response = await this.fetchWithTimeout(url, requestOptions);

        if (this.isAuthenticationFailure(response)) {
            await this.purgeCurrentSession();

            if (allowRetry) {
                await this.ensureSession();
                return this.sendRequest(config, false);
            }

            throw new Throwable("EMandi session has expired, Please try again.", 401);
        }

        const data = await this.parseResponseBody(response);
        return { content: data, statusCode: response.status };
    };

    private authenticateFromVault = async (): Promise<void> => {
        const credentials = await this.getStoredCredentials();

        try {
            this.session = await this.authenticate(credentials);
            await this.warmTraderSession();
        }
        catch (error) {
            await this.purgeCurrentSession();
            throw error;
        }
    };

    private getAbsoluteUrl = (path: string) => new URL(path, BASE_URL).toString()

    private isSessionActive = (): boolean => !!this.session && Date.now() < new Date(this.session.expiresAt).getTime();

    private purgeCurrentSession = async (): Promise<void> => {
        this.session = null;
        await this.cookieJar.removeAllCookies();
    };

    private saveCredential = async (key: string, secret: string): Promise<void> => {
        const existing = await keyVault.getSecret(key);
        if (existing) await keyVault.updateSecret(key, secret);
        else await keyVault.setSecret(key, secret);
    };

    private getStoredCredentials = async (): Promise<EmandiCredentials> => {
        const [username, password] = await Promise.all([
            keyVault.getSecret(CREDENTIAL_KEYS.username),
            keyVault.getSecret(CREDENTIAL_KEYS.password)
        ]);

        if (!username || !password) {
            throw new Throwable("EMandi credentials are not initialized yet.", 401);
        }

        return { username: username.secret, password: password.secret };
    };

    private authenticate = async (credentials: EmandiCredentials): Promise<EMandiSession> => {
        let lastError: string | undefined = String.empty;

        for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
            try {
                const tokens = await this.fetchLoginTokens();
                const captchaDigits = await this.resolveCaptcha(tokens.captchaImageUrl);
                const result = await this.submitLogin(credentials, tokens, captchaDigits);

                if (result.succeeded) {
                    return {
                        username: credentials.username,
                        role: result.role || "merchant",
                        authenticatedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
                    };
                }

                lastError = result.message || "EMandi authentication failed.";
                if (!lastError.toLowerCase().includes("captcha")) throw new Throwable(lastError, 401);
            }
            catch (error) {
                if (error instanceof Throwable && error.statusCode === 401) throw error;
                lastError = this.errorMessage(error);
            }
        }

        throw new Throwable(`EMandi authentication failed. ${lastError}`, 422);
    };

    private fetchLoginTokens = async (): Promise<LoginToken> => {
        const url = `${BASE_URL}${eMandiPortal.loginPage}`;

        const response = await this.fetchWithTimeout(url, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        if (!response.ok) throw new Throwable(`Unable to load login page (${response.status})`, response.status || 502);

        const html = await response.text();
        const requestToken = this.extract(html, /name="__RequestVerificationToken"[^>]*value="([^"]+)"/i) || this.extract(html, /value="([^"]+)"[^>]*name="__RequestVerificationToken"/i);
        const captchaText = this.extract(html, /name="DNTCaptchaText"[^>]*value="([^"]+)"/i) || this.extract(html, /id="DNTCaptchaText"[^>]*value="([^"]+)"/i);
        const captchaToken = this.extract(html, /name="DNTCaptchaToken"[^>]*value="([^"]+)"/i) || this.extract(html, /id="DNTCaptchaToken"[^>]*value="([^"]+)"/i);
        const captchaImageUrl = this.extract(html, /id="dntCaptchaImg"[^>]*src="([^"]+)"/i);

        if (!requestToken || !captchaImageUrl || !captchaText || !captchaToken) throw new Throwable("Unable to parse login page parameters", 502);

        return { requestToken, captchaImageUrl, captchaText, captchaToken };
    };

    private resolveCaptcha = async (imageUrl: string): Promise<string> => {
        const fullUrl = this.getAbsoluteUrl(imageUrl);

        const response = await this.fetchWithTimeout(fullUrl, {
            headers: {
                "User-Agent": USER_AGENT,
                Referer: `${BASE_URL}${eMandiPortal.loginPage}`,
            },
        });

        if (!response.ok) throw new Throwable(`Unable to fetch EMandi captcha (${response.status})`, response.status || 502);

        const buffer = Buffer.from(await response.arrayBuffer());
        const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

        const ocrResult = await visionService.resolveCaptcha(base64);
        const code = ocrResult.content?.code;
        const digits = typeof code === "string" ? code : String.empty;

        if (!/^\d{4}$/.test(digits)) throw new Throwable("Auto captcha resolution failed while login", 422);
        return digits;
    };

    private submitLogin = async (credentials: EmandiCredentials, tokens: LoginToken, captchaDigits: string): Promise<LoginResponse> => {
        const form = new FormData();
        form.set("Email", credentials.username);
        form.set("Password", credentials.password);
        form.set("DNTCaptchaText", tokens.captchaText);
        form.set("DNTCaptchaInputText", captchaDigits);
        form.set("DNTCaptchaToken", tokens.captchaToken);
        form.set("__RequestVerificationToken", tokens.requestToken);
        form.set("X-Requested-With", "XMLHttpRequest");

        const response = await this.fetchWithTimeout(`${BASE_URL}${eMandiPortal.loginAction}`, {
            method: "POST",
            body: form,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "*/*",
                "User-Agent": USER_AGENT,
                Referer: `${BASE_URL}${eMandiPortal.loginPage}`,
                Origin: BASE_URL,
            }
        });

        if (!response.ok) throw new Throwable(`EMandi login failed (${response.status})`, response.status || 502);

        const result = await response.json().catch(() => null);
        if (!result) throw new Throwable("Got unexpected EMandi login response", 502);
        return result as LoginResponse;
    };

    private ensureSession = async (): Promise<void> => {
        if (this.isSessionActive()) return;

        if (!this.authenticationPromise) {
            this.authenticationPromise = this.authenticateFromVault()
                .finally(() => { this.authenticationPromise = null; });
        }

        await this.authenticationPromise;
    };

    private warmTraderSession = async (): Promise<void> => {
        const response = await this.fetchWithTimeout(`${BASE_URL}${eMandiPortal.tradersIndex}`, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "text/html,application/xhtml+xml",
                Origin: BASE_URL,
                Referer: `${BASE_URL}${eMandiPortal.loginPage}`,
            },
        });

        if (this.isAuthenticationFailure(response)) {
            throw new Throwable("EMandi session could not be authentication", 401);
        }

        if (!response.ok) {
            throw new Throwable(`EMandi session initialization failed (${response.status})`, response.status || 502);
        }

        await response.arrayBuffer();
    };

    private isAuthenticationFailure = (response: Response): boolean => {
        if (response.status === 401 || response.status === 403) return true;

        const isRedirect = [301, 302, 303, 307].includes(response.status);
        const location = response.headers.get("location") ?? String.empty;

        return isRedirect && /\/Account(?:\/index|\/LogOut)?/i.test(location);
    };

    private buildRequestOptions = (config: EmandiRequestConfig): RequestInit => ({
        method: config.method,
        headers: { "User-Agent": USER_AGENT, ...config.headers },
        body: config.body,
        redirect: "manual",
    });

    private parseResponseBody = async (response: Response) => {
        const contentType = response.headers.get("content-type");
        return contentType?.includes("application/json") ? response.json().catch(() => null) : response.text();
    };

    private fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
        try {
            return await this.fetch(url, {
                ...options,
                signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
        }
        catch (error) {
            if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
                throw new Throwable("EMandi Request Timed OSut", 504);
            }
            throw error;
        }
    };

    private errorMessage = (error: unknown) => {
        return error instanceof Error ? error.message : error?.toString();
    };

    private extract = (html: string, pattern: RegExp) => {
        return html.match(pattern)?.[1] ?? null;
    };
}

export const emandiService = new EMandiService();
