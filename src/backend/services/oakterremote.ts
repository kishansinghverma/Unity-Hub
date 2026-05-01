import "dotenv/config";
import { source } from "../common/constants";
import { Logger, Throwable } from "../common/models";
import { ExecutionResponse } from "../common/types";
import { requestParams } from "../common/constants";
import { getJsonResponse } from "../common/utils";

class OakterRemoteService {
    private logger: Logger;
    private remoteBaseUrl = process.env.OAKTER_REMOTE_BASE_URL;
    private username = process.env.OAKTER_USERNAME;
    private sessionId = process.env.OAKTER_SESSION_ID;
    private oakRemoteId = process.env.OAKTER_OAK_REMOTE_ID;

    constructor() {
        this.logger = new Logger(source.oakterremote);
    }

    private getHeader = () => ({
        Brand: "OAKTER",
        Version: "5.3",
        App_Version: "8.9",
        OS: "iOS",
        OS_Version: "26.400000",
        Username: this.username,
        SessionId: this.sessionId,
    });

    public issueCommand = async (commandId: string | number, remoteId: string | number): Promise<ExecutionResponse> => {
        const payload = {
            Header: this.getHeader(),
            RemoteId: remoteId,
            CommandId: commandId,
            OakRemoteId: this.oakRemoteId
        };

        const fetchParams = { ...requestParams.post, body: JSON.stringify(payload) };
        return fetch(`${this.remoteBaseUrl}/api/ir/send`, fetchParams).then(getJsonResponse);
    };

    public isConnected = (): Promise<ExecutionResponse> => {
        return Promise.resolve({
            content: {
                connected: true,
                message: "isConnected scaffold invoked"
            },
            statusCode: 200
        });
    };

    public getDevices = (): Promise<ExecutionResponse> => {
        return Promise.resolve({
            content: {
                devices: [],
                message: "getDevices scaffold invoked"
            },
            statusCode: 200
        });
    };

    public initialize = () => {
        this.logger.success("Oakter Remote Service Ready!");
    };
}

export const oakterRemoteService = new OakterRemoteService();
