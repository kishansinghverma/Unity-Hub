import {
    Credentials,
    EMandiAuthRequest,
    EMandiSession,
    EMandiSessionInfo,
    ExecutionResponse,
    LoginResponse,
    LoginToken,
    RequestConfig,
} from "../common/types";
import { Logger, Throwable } from "../common/models";
import { eMandiPortal, source } from "../common/constants";
import { ocrService } from "./ocr";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";
import fs from "fs";
import os from "os";
import path from "path";

const SESSION_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_LOGIN_ATTEMPTS = 3;
const BASE_URL = eMandiPortal.baseUrl;
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";

// >>> TEMP TESTING COOKIE PERSISTENCE — REMOVE THIS BLOCK BEFORE PRODUCTION <<<
const TEMP_COOKIE_CACHE_PATH = path.join(os.tmpdir(), "unity-hub-emandi-session.json");

export class EMandiClient {
    private readonly logger: Logger;
    private readonly cookieJar: CookieJar;
    private readonly fetch: typeof fetch;

    private session: EMandiSession | null = null;
    private credentials: Credentials | null = null;
    private autoRefresh: boolean = true;

    constructor() {
        this.logger = new Logger(source.emandi);
        const restoredJar = this.restoreTemporaryCookieJar();
        this.cookieJar = restoredJar ?? new CookieJar();
        this.fetch = fetchCookie(fetch, this.cookieJar);

        // TEMP TESTING COOKIE PERSISTENCE — REMOVE BEFORE PRODUCTION.
        if (restoredJar) {
            this.session = {
                email: "restored-session",
                role: "merchant",
                authenticatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
            };
        }
    }

    public async initializeSession(request: EMandiAuthRequest): Promise<ExecutionResponse> {
        this.clearLocalSession();
        await this.cookieJar.removeAllCookies();
        await this.authenticate(request);
        await this.warmTraderSession();
        await this.persistTemporaryCookieJar();

        const autoRefresh = request.autorefresh ?? true;
        this.autoRefresh = autoRefresh;
        this.credentials = autoRefresh ? { email: request.email, password: request.password } : null;
        this.logger.success("eMandi session initialized");

        return this.buildAuthResponse();
    }

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

    public async clearSession(): Promise<ExecutionResponse> {
        if (this.isSessionActive()) {
            try {
                await this.fetchWithTimeout(`${BASE_URL}${eMandiPortal.logout}`, { headers: { "User-Agent": USER_AGENT } });
            }
            catch (error: unknown) {
                this.logger.warning(`Logout request failed: ${this.errorMessage(error)}`);
            }
        }

        await this.cookieJar.removeAllCookies();
        this.removeTemporaryCookieJar();
        this.clearLocalSession();
        this.logger.success("eMandi session cleared");

        return {
            content: { authenticated: false, message: "Session cleared successfully" },
            statusCode: 200,
        };
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
            // TEMP TESTING ONLY: discard a stale persisted cookie cache.
            this.removeTemporaryCookieJar();

            if (allowRetry && this.autoRefresh && this.credentials) {
                this.logger.log("Session expired. Re-authenticating...");
                await this.authenticate(this.credentials);
                return this.sendRequest(config, false);
            }

            throw new Throwable("eMandi session has expired. Please authenticate first.", 401);
        }

        this.refreshSessionExpiry();

        const data = await this.parseResponseBody(response);
        return { content: data, statusCode: response.status };
    }

    private async authenticate(credentials: Credentials): Promise<void> {
        let lastError = "";

        for (let attempt = 1; attempt <= MAX_LOGIN_ATTEMPTS; attempt++) {
            try {
                const tokens = await this.fetchLoginTokens();
                const captchaDigits = await this.resolveCaptcha(tokens.captchaImageUrl);
                const result = await this.submitLogin(credentials, tokens, captchaDigits);

                if (result.succeeded) {
                    this.session = {
                        email: credentials.email,
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

        const ocrResult = await ocrService.resolveCaptcha(base64);
        const digits = ocrResult.content?.text || String(ocrResult.content?.code || "");

        if (!digits) {
            throw new Throwable("OCR returned empty captcha digits", 422);
        }

        return digits;
    }

    private async submitLogin(credentials: Credentials, tokens: LoginToken, captchaDigits: string): Promise<LoginResponse> {
        const form = new FormData();
        form.set("Email", credentials.email);
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

        if (this.autoRefresh && this.credentials) {
            this.logger.log("Session inactive. Auto-refreshing...");
            await this.authenticate(this.credentials);
            return;
        }

        throw new Throwable("No active eMandi session. Please authenticate first.", 401);
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

    // TEMP TESTING COOKIE PERSISTENCE — REMOVE BEFORE PRODUCTION.
    private restoreTemporaryCookieJar(): CookieJar | null {
        try {
            if (!fs.existsSync(TEMP_COOKIE_CACHE_PATH)) return null;
            const serialized = JSON.parse(fs.readFileSync(TEMP_COOKIE_CACHE_PATH, "utf8"));
            const jar = CookieJar.deserializeSync(serialized);
            return jar.serializeSync()?.cookies?.length ? jar : null;
        } catch (error: unknown) {
            this.logger.warning(`Ignoring invalid temporary eMandi cookie cache: ${this.errorMessage(error)}`);
            return null;
        }
    }

    // TEMP TESTING COOKIE PERSISTENCE — REMOVE BEFORE PRODUCTION.
    private async persistTemporaryCookieJar(): Promise<void> {
        try {
            const serialized = this.cookieJar.serializeSync();
            if (!serialized?.cookies?.length) return;
            fs.writeFileSync(TEMP_COOKIE_CACHE_PATH, JSON.stringify(serialized), { mode: 0o600 });
            fs.chmodSync(TEMP_COOKIE_CACHE_PATH, 0o600);
        } catch (error: unknown) {
            this.logger.warning(`Could not persist temporary eMandi cookie cache: ${this.errorMessage(error)}`);
        }
    }

    // TEMP TESTING COOKIE PERSISTENCE — REMOVE BEFORE PRODUCTION.
    private removeTemporaryCookieJar(): void {
        try {
            if (fs.existsSync(TEMP_COOKIE_CACHE_PATH)) fs.rmSync(TEMP_COOKIE_CACHE_PATH);
        } catch (error: unknown) {
            this.logger.warning(`Could not remove temporary eMandi cookie cache: ${this.errorMessage(error)}`);
        }
    }

    // <<< END TEMP TESTING COOKIE PERSISTENCE — REMOVE THIS BLOCK BEFORE PRODUCTION >>>

    private isSessionActive(): boolean {
        return !!this.session && Date.now() < new Date(this.session.expiresAt).getTime();
    }

    private isAuthenticationFailure(response: Response): boolean {
        if (response.status === 401 || response.status === 403) return true;

        const location = response.headers.get("location") || "";
        const isRedirect = [301, 302, 303, 307].includes(response.status);

        return isRedirect && /\/Account(?:\/index|\/LogOut)?/i.test(location);
    }

    private refreshSessionExpiry(): void {
        if (this.session) {
            this.session.expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
        }
    }

    private resolvePortalUrl(path: string): string {
        const url = new URL(path, BASE_URL);
        if (url.origin !== BASE_URL) throw new Throwable("Authenticated requests must target eMandi", 400);

        return url.toString();
    }

    private buildRequestOptions(config: RequestConfig): RequestInit {
        const headers: Record<string, string> = {
            "User-Agent": USER_AGENT,
            ...config.headers,
        };

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
        const contentType = response.headers.get("content-type") || "";
        return contentType.includes("application/json")
            ? response.json().catch(() => null)
            : response.text();
    }

    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        try {
            return await this.fetch(url, {
                ...options,
                signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            });
        } catch (error: unknown) {
            if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
                throw new Throwable("eMandi request timed out", 504);
            }
            throw error;
        }
    }

    private clearLocalSession(): void {
        this.session = null;
        this.credentials = null;
    }

    private errorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    private extract(html: string, pattern: RegExp): string | null {
        return html.match(pattern)?.[1] ?? null;
    }

    private buildAuthResponse(): ExecutionResponse {
        return {
            content: {
                authenticated: true,
                message: "Authenticated successfully with eMandi",
                ...this.session!,
            },
            statusCode: 200,
        };
    }
}

export const emandiClient = new EMandiClient();
