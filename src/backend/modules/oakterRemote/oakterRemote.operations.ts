import type { OperationResponse } from '../../core/http/action-response.js';
import type { OakterRemoteService } from './oakterRemote.service.js';
import type { OakterCommandRequest, OakterResponse } from './oakterRemote.types.js';

export class OakterRemoteOperation {
  private readonly oakterRemoteService: OakterRemoteService;

  constructor({ oakterRemoteService }: { oakterRemoteService: OakterRemoteService }) {
    this.oakterRemoteService = oakterRemoteService;
  }

  status = async (): Promise<OperationResponse<{ isConnected: boolean }>> =>
    ({ content: { isConnected: await this.oakterRemoteService.isConnected() } });

  devices = async (): Promise<OperationResponse<OakterResponse>> =>
    ({ content: await this.oakterRemoteService.getCatalog() });

  sync = async (): Promise<OperationResponse<OakterResponse>> =>
    ({ content: await this.oakterRemoteService.syncCatalog() });

  command = async (request: OakterCommandRequest): Promise<OperationResponse<string>> =>
    ({ content: await this.oakterRemoteService.issueCommand(request) });
}
