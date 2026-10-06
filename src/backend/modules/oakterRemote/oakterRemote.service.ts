import axios, { type AxiosInstance } from 'axios';
import { OakterRemote } from '../../core/constants.js';
import { ServerError, UpstreamApiError } from '../../core/errors/app-error.js';
import { Configuration } from '../../core/utils/configuration.js';
import type { OakterCatalogPayload, OakterCatalogResponse, OakterCommandPayload, OakterCommandRequest, OakterCommandResponse, OakterConnectionPayload, OakterConnectionResponse, OakterRequestHeader, OakterResponse } from './oakterRemote.types.js';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

export class OakterRemoteService {
  private readonly remoteBaseUrl = Configuration.GetSetting('OAKTER_REMOTE_BASE_URL');
  private readonly renewSessionUrl = Configuration.GetSetting('OAKTER_RENEW_SESSION_URL');
  private readonly username = Configuration.GetSetting('OAKTER_USERNAME');
  private readonly sessionId = Configuration.GetSetting('OAKTER_SESSION_ID');
  private readonly remoteId = Configuration.GetSetting('OAKTER_REMOTE_ID');
  private readonly authToken = Configuration.GetSetting('OAKTER_AUTH_TOKEN');
  private readonly catalogFile = OakterRemote.CatalogFile;
  private readonly http: AxiosInstance = axios.create({ timeout: OakterRemote.RequestTimeout, validateStatus: () => true });

  isConnected = async (): Promise<boolean> => {
    const response = await this.http.post<OakterResponse>(this.renewSessionUrl, this.connectionPayload());
    if (response.status >= 400) throw new UpstreamApiError(`Oakter request failed`, response.status);
    if (!this.isConnectionResponse(response.data)) throw new UpstreamApiError('Invalid Oakter connection response', 502);
    return response.data.RenewSessionResult.ESPDevices[0]?.Connected ?? false;
  };

  getCatalog = async (): Promise<OakterResponse> => {
    if (this.catalogExists()) {
      const content = JSON.parse(await readFile(this.catalogFile, 'utf8')) as OakterResponse;
      if (!this.isCatalogResponse(content)) return content;
      if (!content.Status) throw new ServerError(typeof content.Response === 'string' ? content.Response : 'Oakter catalog request failed');
      return content.Response;
    }
    
    return this.syncCatalog();
  };

  syncCatalog = async (): Promise<OakterResponse> => {
    const payload: OakterCatalogPayload = { Header: this.header(), OakRemoteId: this.remoteId };
    const response = await this.sendRequest(OakterRemote.Routes.deviceCatalog, payload);
    if (!this.isCatalogResponse(response)) throw new UpstreamApiError('Invalid Oakter catalog response', 502);
    if (!response.Status) throw new ServerError(typeof response.Response === 'string' ? response.Response : 'Oakter catalog request failed');
    const content = response.Response;
    await mkdir(dirname(this.catalogFile), { recursive: true });
    await writeFile(this.catalogFile, JSON.stringify(content, null, 2), 'utf8');
    return content;
  };

  issueCommand = async (request: OakterCommandRequest): Promise<string> => {
    const payload: OakterCommandPayload = { Header: this.header(), RemoteId: request.remoteId, CommandId: request.commandId, OakRemoteId: this.remoteId };
    const response = await this.sendRequest(OakterRemote.Routes.sendCommand, payload);
    if (!this.isCommandResponse(response)) throw new UpstreamApiError('Invalid Oakter command response', 502);
    if (!response.Status) throw new UpstreamApiError(response.Response, 502);
    return response.Response;
  };

  private header = (): OakterRequestHeader => ({ ...OakterRemote.Headers, Username: this.username, SessionId: this.sessionId });
  
  private connectionPayload = (): OakterConnectionPayload => ({ ...this.header(), User: { Token: this.authToken } });

  private sendRequest = async (path: string, data: object): Promise<OakterResponse> => {
    const response = await this.http.post<OakterResponse>(`${this.remoteBaseUrl}${path}`, data);
    if (response.status >= 400) throw new UpstreamApiError(`Oakter request failed (${response.status})`, response.status);
    return response.data;
  };

  private catalogExists = (): boolean => existsSync(this.catalogFile);

  private isConnectionResponse = (value: OakterResponse): value is OakterConnectionResponse => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

    const result = value.RenewSessionResult;
    if (typeof result !== 'object' || result === null || Array.isArray(result)) return false;

    const devices = result.ESPDevices;
    if (!Array.isArray(devices) || devices.length === 0) return false;
    
    const device = devices[0];
    return typeof device === 'object' && device !== null && !Array.isArray(device) && typeof device.Connected === 'boolean';
  };

  private isCommandResponse = (value: OakterResponse): value is OakterCommandResponse => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return typeof value.Response === 'string' && typeof value.Status === 'boolean';
  };

  private isCatalogResponse = (value: OakterResponse): value is OakterCatalogResponse => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return 'Response' in value && typeof value.Status === 'boolean';
  };
}
