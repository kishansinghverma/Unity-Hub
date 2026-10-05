import axios, { type AxiosInstance } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { Emandi } from '../../core/constants.js';
import { UnauthorizedError, UpstreamApiError } from '../../core/errors/app-error.js';
import type { ImagingService } from '../imaging/imaging.service.js';
import type { KeyVaultService } from '../keyvault/keyvault.service.js';
import type { EmandiCredentials, EmandiListResponse, EmandiQuery, EmandiSession, EmandiSessionInfo, LoginResponse, LoginToken } from './emandi.types.js';
import { Logger, ScopedLogger } from '../../core/logging/logger.js';
import { LogSource } from '../../core/logging/log-sources.js';

export class EmandiService {
  private readonly cookieJar = new CookieJar();
  private readonly http: AxiosInstance = wrapper(axios.create({ jar: this.cookieJar, withCredentials: true, timeout: Emandi.RequestTimeout }));
  private readonly keyVaultService: KeyVaultService;
  private readonly imagingService: ImagingService;
  private session: EmandiSession | null = null;
  private authenticationPromise: Promise<void> | null = null;
  private readonly logger: ScopedLogger;

  constructor({ keyVaultService, imagingService, logger }: { keyVaultService: KeyVaultService; imagingService: ImagingService, logger: Logger  }) {
    this.keyVaultService = keyVaultService;
    this.imagingService = imagingService;
    this.logger = logger.for(LogSource.Emandi);
  }

  initialize = async (credentials: EmandiCredentials): Promise<void> => {
    await this.clearSession();
    const existing = await this.keyVaultService.getSecret(Emandi.CredentialsKey);
    if (existing) await this.keyVaultService.updateSecret(Emandi.CredentialsKey, JSON.stringify(credentials));
    else await this.keyVaultService.setSecret(Emandi.CredentialsKey, JSON.stringify(credentials));
  };

  getSessionStatus = async (): Promise<EmandiSessionInfo> => {
    await this.clearSession();
    await this.ensureSession();
    const cookies = await this.cookieJar.getCookies(Emandi.BaseUrl);
    return { authenticated: this.isSessionActive(), isExpired: !this.isSessionActive() && !!this.session, cookieCount: cookies.length, ...this.session };
  };

  getRecords = async <Record>(url: string, query: EmandiQuery): Promise<EmandiListResponse<Record>> => {
    await this.ensureSession();
    const response = await this.sendRecordRequest(url, query);
    return this.parseResponse<Record>(response.data);
  };

  private authenticate = async (): Promise<void> => {
    const entry = await this.keyVaultService.getSecret(Emandi.CredentialsKey);
    if (!entry) throw new UnauthorizedError('EMandi credentials are not initialized');
    const credentials = JSON.parse(entry.secret) as EmandiCredentials;

    let lastMessage = 'EMandi authentication failed';
    for (let attempt = 1; attempt <= Emandi.MaxLoginAttempts; attempt++) {
      const tokens = await this.fetchLoginTokens();
      const captchaResponse = await this.http.get<ArrayBuffer>(this.absolute(tokens.captchaImageUrl), { responseType: 'arraybuffer' });
      const captcha = await this.imagingService.extractText(`data:image/png;base64,${Buffer.from(captchaResponse.data).toString('base64')}`);

      if (!/^\d{4}$/.test(captcha)) {
        lastMessage = 'Auto captcha resolution failed while login';
        continue;
      }

      const login = await this.submitLogin(credentials, tokens, captcha);
      if (login.succeeded) {
        this.session = { username: credentials.username, role: login.role ?? 'merchant', authenticatedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + Emandi.SessionTtl).toISOString() };
        await this.warmSession();
        return;
      }

      lastMessage = login.message ?? lastMessage;
      if (!lastMessage.toLowerCase().includes('captcha')) throw new UnauthorizedError(lastMessage);
    }

    throw new UnauthorizedError(lastMessage);
  };

  private fetchLoginTokens = async (): Promise<LoginToken> => {
    const response = await this.http.get<string>(this.absolute(Emandi.Routes.LoginPage), { headers: this.headers(Emandi.Routes.LoginPage) });
    const html = response.data;
    const requestToken = this.extract(html, /name="__RequestVerificationToken"[^>]*value="([^"]+)"/i) ?? this.extract(html, /value="([^"]+)"[^>]*name="__RequestVerificationToken"/i);
    const captchaText = this.extract(html, /name="DNTCaptchaText"[^>]*value="([^"]+)"/i) ?? this.extract(html, /id="DNTCaptchaText"[^>]*value="([^"]+)"/i);
    const captchaToken = this.extract(html, /name="DNTCaptchaToken"[^>]*value="([^"]+)"/i) ?? this.extract(html, /id="DNTCaptchaToken"[^>]*value="([^"]+)"/i);
    const captchaImageUrl = this.extract(html, /id="dntCaptchaImg"[^>]*src="([^"]+)"/i);
    if (!requestToken || !captchaText || !captchaToken || !captchaImageUrl) throw new UpstreamApiError('Unable to parse EMandi login page', 502);
    return { requestToken, captchaText, captchaToken, captchaImageUrl };
  };

  private submitLogin = async (credentials: EmandiCredentials, tokens: LoginToken, captcha: string): Promise<LoginResponse> => {
    const body = new FormData();
    body.set('Email', credentials.username);
    body.set('Password', credentials.password);
    body.set('DNTCaptchaText', tokens.captchaText);
    body.set('DNTCaptchaInputText', captcha);
    body.set('DNTCaptchaToken', tokens.captchaToken);
    body.set('__RequestVerificationToken', tokens.requestToken);
    body.set('X-Requested-With', 'XMLHttpRequest');
    const response = await this.http.post<LoginResponse>(this.absolute(Emandi.Routes.Login), body, { headers: this.headers(Emandi.Routes.Login) });
    return response.data;
  };

  private warmSession = async (): Promise<void> => {
    const response = await this.http.get(this.absolute(Emandi.Routes.TradersIndex), { headers: this.headers(Emandi.Routes.Login) });
    if (response.status >= 400) throw new UpstreamApiError('EMandi session initialization failed', response.status);
  };

  private sendRecordRequest = async (url: string, query: EmandiQuery) => {
    const body = new URLSearchParams({ fromDate: query.fromDate, toDate: query.toDate, draw: '1', start: '0', length: String(query.limit), 'search[value]': query.recordId ?? '', 'order[0][column]': '1', 'order[0][dir]': 'desc' });
    const send = () => this.http.post(this.absolute(url), body.toString(), { headers: { ...this.headers(Emandi.Routes.GatepassList), 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, validateStatus: () => true });
    let response = await send();

    if (response.status === 401 || response.status === 403) {
      await this.clearSession();
      await this.ensureSession();
      response = await send();
    }

    if (response.status >= 400) throw new UpstreamApiError(`EMandi request failed (${response.status})`, response.status);
    return response;
  };

  private ensureSession = async (): Promise<void> => {
    if (this.isSessionActive()) {
      this.logger.info("Session already active, Using the same session.")
      return;
    }

    this.logger.warn("No active session found, Trying to create a new seesion.")
    this.authenticationPromise ??= this.authenticate().finally(() => { this.authenticationPromise = null; });
    await this.authenticationPromise;
  };

  private isSessionActive = (): boolean => !!this.session && Date.now() < new Date(this.session.expiresAt).getTime();
  private clearSession = async (): Promise<void> => { this.session = null; await this.cookieJar.removeAllCookies(); };
  private absolute = (url: string): string => new URL(url, Emandi.BaseUrl).toString();
  private headers = (referer: string): Record<string, string> => ({ 'User-Agent': Emandi.UserAgent, Accept: '*/*', Origin: Emandi.BaseUrl, Referer: this.absolute(referer), 'X-Requested-With': 'XMLHttpRequest' });
  private extract = (html: string, pattern: RegExp): string | null => html.match(pattern)?.[1] ?? null;
  private parseResponse = <Record>(data: unknown): EmandiListResponse<Record> => typeof data === 'object' && data !== null ? data as EmandiListResponse<Record> : { data: [] };
}
