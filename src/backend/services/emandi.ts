import {
    EmandiCredentials,
    EMandiSession,
    EMandiSessionInfo,
    ExecutionResponse,
    LoginResponse,
    LoginToken,
    RequestConfig,
} from "../common/types";
import { Logger, Throwable } from "../common/models";
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

    public async initialize(request: EmandiCredentials): Promise<ExecutionResponse> {
        await this.saveCredential(CREDENTIAL_KEYS.username, request.username);
        await this.saveCredential(CREDENTIAL_KEYS.password, request.password);
        await this.purgeCurrentSession()

        return {
            content: { initialized: true, message: "eMandi credentials initialized" },
            statusCode: 200
        };
    }

    private isSessionActive(): boolean {
        return !!this.session && Date.now() < new Date(this.session.expiresAt).getTime();
    }

    private purgeCurrentSession = async () => {
        this.session = null;
        await this.cookieJar.removeAllCookies();
    }
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
            throw new Throwable("eMandi credentials are not initialized yet.", 401);
        }

        return { username: username.secret, password: password.secret };
    };

    public async getSessionStatus(): Promise<ExecutionResponse> {
        const cookies = await this.cookieJar.getCookies(BASE_URL);
        const authenticated = this.isSessionActive();

        const info: EMandiSessionInfo = {
            authenticated,
            isExpired: !authenticated && !!this.session,
            cookieCount: cookies.length,
            ...this.session,
        };

        return { content: info, statusCode: 200 };
    }

    public async sendRequest(config: RequestConfig, allowRetry = true): Promise<ExecutionResponse> {
        await this.ensureSession();

        const url = this.resolvePortalUrl(config.url);
        const requestOptions = this.buildRequestOptions(config);
        this.logger.log(`[${requestOptions.method}] ${url}`);

        let response: Response;
        try {
            response = await this.fetchWithTimeout(url, requestOptions);
        } catch (error: unknown) {
            if (error instanceof Throwable) throw error;
            const message = this.errorMessage(error);
            this.logger.error(`Network error: ${message}`);
            throw new Throwable(`Network error connecting to eMandi: ${message}`, 502);
        }

        if (this.isAuthenticationFailure(response)) {
            this.session = null;

            if (allowRetry) {
                this.logger.log("Session expired. Re-authenticating...");
                await this.ensureSession();
                return this.sendRequest(config, false);
            }

            throw new Throwable("eMandi session has expired and could not be recreated.", 401);
        }

        const data = await this.parseResponseBody(response);
        return { content: data, statusCode: response.status };
    }



    private async authenticateFromVault(): Promise<void> {
        const credentials = await this.getStoredCredentials();

        try {
            await this.authenticate(credentials);
            await this.warmTraderSession();
        }
        catch (error) {
            this.purgeCurrentSession()
            throw error;
        }
    }

    private async authenticate(credentials: EmandiCredentials): Promise<void> {
        let lastError = "";

        for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
            try {
                const tokens = await this.fetchLoginTokens();
                const captchaDigits = await this.resolveCaptcha(tokens.captchaImageUrl);
                const result = await this.submitLogin(credentials, tokens, captchaDigits);

                if (result.succeeded) {
                    this.session = {
                        username: credentials.username,
                        role: result.role || "merchant",
                        authenticatedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
                    };
                    return;
                }

                if (result.message?.toLowerCase().includes("captcha")) {
                    this.logger.warning(`Attempt ${attempt}: Captcha rejected — ${result.message}`);
                    lastError = result.message;
                    continue;
                }

                throw new Throwable(result.message || "Authentication failed", 401);
            }
            catch (error: unknown) {
                if (error instanceof Throwable && error.statusCode === 401) throw error;
                lastError = this.errorMessage(error);
                this.logger.warning(`Attempt ${attempt} failed: ${lastError}`);
            }
        }

        throw new Throwable(`Authentication failed after ${MAX_LOGIN_ATTEMPTS} attempts. Last error: ${lastError || "Captcha resolution failed"}`, 422);
    }

    private async fetchLoginTokens(): Promise<LoginToken> {
        const url = `${BASE_URL}${eMandiPortal.loginPage}`;
        this.logger.log(`Fetching login page: ${url}`);

        const response = await this.fetchWithTimeout(url, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        });

        if (!response.ok) {
            throw new Throwable(`Failed to load login page (${response.status})`, response.status || 502);
        }

        const html = await response.text();

        const requestToken = this.extract(html, /name="__RequestVerificationToken"[^>]*value="([^"]+)"/i)
            || this.extract(html, /value="([^"]+)"[^>]*name="__RequestVerificationToken"/i);
        const captchaImageUrl = this.extract(html, /id="dntCaptchaImg"[^>]*src="([^"]+)"/i);
        const captchaText = this.extract(html, /name="DNTCaptchaText"[^>]*value="([^"]+)"/i)
            || this.extract(html, /id="DNTCaptchaText"[^>]*value="([^"]+)"/i);
        const captchaToken = this.extract(html, /name="DNTCaptchaToken"[^>]*value="([^"]+)"/i)
            || this.extract(html, /id="DNTCaptchaToken"[^>]*value="([^"]+)"/i);

        if (!requestToken || !captchaImageUrl || !captchaText || !captchaToken) {
            throw new Throwable("Failed to parse login page parameters", 502);
        }

        return { requestToken, captchaImageUrl, captchaText, captchaToken };
    }

    private async resolveCaptcha(imageUrl: string): Promise<string> {
        const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`;

        const response = await this.fetchWithTimeout(fullUrl, {
            headers: {
                "User-Agent": USER_AGENT,
                Referer: `${BASE_URL}${eMandiPortal.loginPage}`,
            },
        });

        if (!response.ok) {
            throw new Throwable(`Failed to fetch captcha image (${response.status})`, response.status || 502);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

        const ocrResult = await visionService.resolveCaptcha(base64);
        const digits = ocrResult.content?.text || String(ocrResult.content?.code || "");

        if (!digits) {
            throw new Throwable("OCR returned empty captcha digits", 422);
        }

        return digits;
    }

    private async submitLogin(credentials: EmandiCredentials, tokens: LoginToken, captchaDigits: string): Promise<LoginResponse> {
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
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "*/*",
                "User-Agent": USER_AGENT,
                Referer: `${BASE_URL}${eMandiPortal.loginPage}`,
                Origin: BASE_URL,
            },
            body: form,
        });

        if (!response.ok) {
            throw new Throwable(`Login request failed (${response.status})`, response.status || 502);
        }

        const result = await response.json().catch(() => null);
        if (!result) throw new Throwable("Unexpected non-JSON response from login endpoint", 502);
        return result as LoginResponse;
    }

    private async ensureSession(): Promise<void> {
        if (this.isSessionActive()) return;

        if (!this.authenticationPromise) {
            this.authenticationPromise = this.authenticateFromVault().finally(() => {
                this.authenticationPromise = null;
            });
        }

        await this.authenticationPromise;
    }

    private async warmTraderSession(): Promise<void> {
        const response = await this.fetchWithTimeout(`${BASE_URL}${eMandiPortal.tradersIndex}`, {
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "text/html,application/xhtml+xml",
                Origin: BASE_URL,
                Referer: `${BASE_URL}${eMandiPortal.loginPage}`,
            },
        });

        if (this.isAuthenticationFailure(response)) {
            throw new Throwable("eMandi session could not be initialized", 401);
        }
        if (!response.ok) {
            throw new Throwable(`Failed to initialize eMandi session (${response.status})`, response.status || 502);
        }

        await response.arrayBuffer();
    }



    private isAuthenticationFailure(response: Response): boolean {
        if (response.status === 401 || response.status === 403) return true;

        const location = response.headers.get("location") || "";
        const isRedirect = [301, 302, 303, 307].includes(response.status);

        return isRedirect && /\/Account(?:\/index|\/LogOut)?/i.test(location);
    }

    private resolvePortalUrl(path: string): string {
        const url = new URL(path, BASE_URL);
        if (url.origin !== BASE_URL) throw new Throwable("Authenticated requests must target eMandi", 400);

        return url.toString();
    }

    private buildRequestOptions(config: RequestConfig): RequestInit {
        const headers: Record<string, string> = { "User-Agent": USER_AGENT, ...config.headers };
        const isForm = headers["Content-Type"]?.includes("application/x-www-form-urlencoded");
        const body = config.body && typeof config.body === "object" && !(config.body instanceof FormData) && !(config.body instanceof URLSearchParams) && !Buffer.isBuffer(config.body)
            ? isForm ? new URLSearchParams(config.body as Record<string, string>).toString() : JSON.stringify(config.body)
            : config.body as BodyInit | null | undefined;

        return {
            method: config.method ?? "GET",
            headers: body && !headers["Content-Type"] ? { ...headers, "Content-Type": "application/json" } : headers,
            body: body ?? null,
            redirect: config.redirect ?? "manual",
        };
    }

    private async parseResponseBody(response: Response): Promise<any> {
        const contentType = response.headers.get("content-type");
        return contentType?.includes("application/json") ? response.json().catch(() => null) : response.text();
    }

    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
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
    }

    private errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    private extract(html: string, pattern: RegExp): string | null {
        return html.match(pattern)?.[1] ?? null;
    }
}

export const emandiService = new EMandiService();
