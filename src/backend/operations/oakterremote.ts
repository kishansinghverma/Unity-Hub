import { ExecutionResponse } from "../common/types";
import { oakterRemoteService } from "../services/oakterremote";

class OakterRemote {
    public isConnected = async (): Promise<ExecutionResponse> => {
        const isConnected = await oakterRemoteService.isConnected();
        return { content: { isConnected }, statusCode: 200 };
    };

    public getDevices = (): Promise<ExecutionResponse> => {
        return oakterRemoteService.getCatalog();
    };

    public syncDevices = (): Promise<ExecutionResponse> => {
        return oakterRemoteService.syncCatalog();
    };

    public issueCommand = (commandId: string, remoteId: string | number): Promise<ExecutionResponse> => {
        return oakterRemoteService.issueCommand(commandId, remoteId);
    };
}

export const oakterRemote = new OakterRemote();
