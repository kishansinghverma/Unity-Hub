import { ExecutionResponse } from "../common/types";
import { oakterRemoteService } from "../services/oakterremote";

class OakterRemote {
    public isConnected = (): Promise<ExecutionResponse> => {
        return oakterRemoteService.isConnected();
    };

    public getDevices = (): Promise<ExecutionResponse> => {
        return oakterRemoteService.getDevices();
    };

    public issueCommand = (commandId: string | number, remoteId: string | number): Promise<ExecutionResponse> => {
        return oakterRemoteService.issueCommand(commandId, remoteId);
    };
}

export const oakterRemote = new OakterRemote();
