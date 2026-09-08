import { Logger, Throwable } from "../common/models";
import { eMandiPortal, source } from "../common/constants";
import { ExecutionResponse, EMandiAuthRequest, EMandiSession, EMandiSessionInfo, RequestConfig, Credentials, LoginToken } from "../common/types";
import { ocrService } from "./ocr";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";

export class EMandiClient {
    private readonly logger: Logger;
    private readonly cookieJar: CookieJar;
    private readonly fetch: typeof fetch;
    private readonly baseUrl: string;
    private readonly userAgent: string;
    private readonly sessionTtlMs: number;

    private session: EMandiSession | null = null;
    private credentials: Credentials | null = null;
    private autoRefresh: boolean = true;

    constructor() {
        this.logger = new Logger(source.emandi);
        this.cookieJar = new CookieJar();
        this.fetch = fetchCookie(fetch, this.cookieJar);
        this.baseUrl = eMandiPortal.baseUrl;
        this.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        this.sessionTtlMs = 30 * 60 * 1000;
    }

    public async initializeSession(request: EMandiAuthRequest): Promise<ExecutionResponse> {
        const credentials = this.resolveCredentials(request);
        this.autoRefresh = request.autorefresh ?? true;

        if (this.autoRefresh) {
            this.credentials = { ...credentials };
        }

        await this.authenticate(credentials);
        this.logger.success(`eMandi session initialized for ${credentials.email}`);

        return this.buildAuthResponse();
    }

    public async getSessionStatus(): Promise<ExecutionResponse> {
        const cookies = await this.cookieJar.getCookies(this.baseUrl);

        const info: EMandiSessionInfo = {
            authenticated: this.isSessionActive(),
            isExpired: !this.isSessionActive() && !!this.session,
            cookieCount: cookies.length,
            cookies: this.toCookieRecord(cookies),
            ...this.session,
        };

        return { content: info, statusCode: 200 };
    }

    public async clearSession(): Promise<ExecutionResponse> {
        if (this.isSessionActive()) {
            try {
                await this.fetch(`${this.baseUrl}${eMandiPortal.logout}`, {
                    headers: { "User-Agent": this.userAgent },
                });
            } catch (err: any) {
                this.logger.warning(`Logout request failed: ${err.message}`);
            }
        }

        await this.cookieJar.removeAllCookies();
        this.session = null;
        this.credentials = null;

        this.logger.success("eMandi session cleared");
        return {
            content: { authenticated: false, message: "Session cleared successfully" },
            statusCode: 200,
        };
    }

    public async sendRequest(config: RequestConfig): Promise<ExecutionResponse> {
        return this.executeRequest(config, true);
    }

    private async authenticate(credentials: Credentials, maxRetries: number = 3): Promise<void> {
        let lastError = "";

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const tokens = await this.fetchLoginTokens();
                const captchaDigits = await this.resolveCaptcha(tokens.captchaImageUrl);
                const result = await this.submitLogin(credentials, tokens, captchaDigits);

                if (result.succeeded) {
                    this.session = {
                        email: credentials.email,
                        role: result.role || "merchant",
                        authenticatedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + this.sessionTtlMs).toISOString(),
                    };
                    return;
                }

                if (result.message?.toLowerCase().includes("captcha")) {
                    this.logger.warning(`Attempt ${attempt}: Captcha rejected — ${result.message}`);
                    lastError = result.message;
                    continue;
                }

                throw new Throwable(result.message || "Authentication failed", 401);
            } catch (err: any) {
                if (err.statusCode === 401) throw err;
                lastError = err.message;
                this.logger.warning(`Attempt ${attempt} failed: ${err.message}`);
            }
        }

        throw new Throwable(`Authentication failed after ${maxRetries} attempts. Last error: ${lastError || "Captcha resolution failed"}`, 422);
    }

    private async fetchLoginTokens(): Promise<LoginToken> {
        const url = `${this.baseUrl}${eMandiPortal.loginPage}`;
        this.logger.log(`Fetching login page: ${url}`);

        const response = await this.fetch(url, {
            headers: {
                "User-Agent": this.userAgent,
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
        const fullUrl = imageUrl.startsWith("http") ? imageUrl : `${this.baseUrl}${imageUrl}`;

        const response = await this.fetch(fullUrl, {
            headers: {
                "User-Agent": this.userAgent,
                Referer: `${this.baseUrl}${eMandiPortal.loginPage}`,
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

        this.logger.log(`Captcha resolved: ${digits}`);
        return digits;
    }

    private async submitLogin(credentials: Credentials, tokens: LoginToken, captchaDigits: string): Promise<any> {
        const params = new URLSearchParams();
        params.append("Email", credentials.email);
        params.append("Password", credentials.password);
        params.append("DNTCaptchaText", tokens.captchaText);
        params.append("DNTCaptchaToken", tokens.captchaToken);
        params.append("DNTCaptchaInputText", captchaDigits);
        params.append("__RequestVerificationToken", tokens.requestToken);

        const response = await this.fetch(`${this.baseUrl}${eMandiPortal.loginAction}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json, text/javascript, */*; q=0.01",
                "User-Agent": this.userAgent,
                Referer: `${this.baseUrl}${eMandiPortal.loginPage}`,
                Origin: this.baseUrl,
            },
            body: params.toString(),
        });

        const result = await response.json().catch(() => null);
        if (!result) {
            throw new Throwable("Unexpected non-JSON response from login endpoint", 502);
        }
        return result;
    }

    private async executeRequest(config: RequestConfig, allowRetry: boolean): Promise<ExecutionResponse> {
        if (!config?.url) {
            throw new Throwable("Missing URL in RequestConfig", 400);
        }

        await this.ensureSession();

        const url = this.resolveUrl(config.url);
        const options = this.buildFetchOptions(config);

        this.logger.log(`[${options.method}] ${url}`);

        let response: Response;
        try {
            response = await this.fetch(url, options);
        } catch (err: any) {
            this.logger.error(`Network error: ${err.message}`);
            throw new Throwable(`Network error connecting to eMandi: ${err.message}`, 502);
        }

        if (this.isSessionExpired(response)) {
            this.session = null;

            if (allowRetry && this.autoRefresh && this.credentials) {
                this.logger.log("Session expired. Re-authenticating...");
                await this.authenticate(this.credentials);
                return this.executeRequest(config, false); // one retry only
            }

            throw new Throwable("eMandi session has expired. Please authenticate first.", 401);
        }

        this.extendSession();
        const data = await this.parseBody(response);

        return { content: data, statusCode: response.status };
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

    private isSessionActive(): boolean {
        return !!this.session && Date.now() < new Date(this.session.expiresAt).getTime();
    }

    private isSessionExpired(response: Response): boolean {
        if (response.status === 401 || response.status === 403) return true;

        const location = response.headers.get("location") || "";
        const isRedirect = [301, 302, 303, 307].includes(response.status);

        return isRedirect && /\/Account(?:\/index|\/LogOut)?/i.test(location);
    }

    private extendSession(): void {
        if (this.session) {
            this.session.expiresAt = new Date(Date.now() + this.sessionTtlMs).toISOString();
        }
    }

    private resolveCredentials(request: EMandiAuthRequest): Credentials {
        const email = request.email || process.env.EMANDI_EMAIL;
        const password = request.password || process.env.EMANDI_PASSWORD;

        if (!email || !password) {
            throw new Throwable("Email and password are required (either in request body or via EMANDI_EMAIL/EMANDI_PASSWORD env vars)", 400);
        }
        return { email, password };
    }

    private resolveUrl(url: string): string {
        if (url.startsWith("http")) return url;
        const separator = url.startsWith("/") ? "" : "/";
        return `${this.baseUrl}${separator}${url}`;
    }

    private buildFetchOptions(config: RequestConfig): RequestInit {
        const headers: Record<string, string> = {
            "User-Agent": this.userAgent,
            Referer: `${this.baseUrl}${eMandiPortal.dashboard}`,
            ...(config.headers || {}),
        };

        let body = config.body;
        if (body !== undefined && body !== null && typeof body === "object" && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !Buffer.isBuffer(body)) {
            const isUrlEncoded = (headers["Content-Type"] || "").includes("application/x-www-form-urlencoded");
            if (isUrlEncoded) {
                body = new URLSearchParams(body).toString();
            } else {
                if (!headers["Content-Type"]) {
                    headers["Content-Type"] = "application/json";
                }
                body = JSON.stringify(body);
            }
        }

        const options: RequestInit = {
            method: config.method || "GET",
            headers,
            redirect: "manual",
        };

        if (body !== undefined && body !== null) {
            options.body = body;
        }

        return options;
    }

    private async parseBody(response: Response): Promise<any> {
        const contentType = response.headers.get("content-type") || "";
        return contentType.includes("application/json")
            ? response.json().catch(() => null)
            : response.text();
    }

    private extract(html: string, pattern: RegExp): string | null {
        return html.match(pattern)?.[1] ?? null;
    }

    private toCookieRecord(cookies: any[]): Record<string, string> {
        return cookies.reduce((acc, c) => {
            acc[c.key] = c.value;
            return acc;
        }, {} as Record<string, string>);
    }

    private async buildAuthResponse(): Promise<ExecutionResponse> {
        const cookies = await this.cookieJar.getCookies(this.baseUrl);
        return {
            content: {
                authenticated: true,
                message: "Authenticated successfully with eMandi",
                cookieCount: cookies.length,
                cachedCookies: cookies.map((c) => c.key),
                ...this.session!,
            },
            statusCode: 200,
        };
    }
}

export const emandiClient = new EMandiClient();