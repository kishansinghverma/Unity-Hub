import "dotenv/config";
import fs from "fs";
import path from "path";
import { source } from "../common/constants";
import { Logger } from "../common/models";
import { requestParams } from "../common/constants";
import { getJsonResponse, validateResponse } from "../common/utils";
import { ExecutionResponse } from "../common/types";

class OakterRemoteService {
    private logger: Logger;
    private remoteBaseUrl = process.env.OAKTER_REMOTE_BASE_URL;
    private renewSessionUrl = process.env.OAKTER_RENEW_SESSION_URL;
    private username = process.env.OAKTER_USERNAME;
    private sessionId = process.env.OAKTER_SESSION_ID;
    private oakRemoteId = process.env.OAKTER_REMOTE_ID;
    private oakRemoteAuthToken = process.env.OAKTER_AUTH_TOKEN;
    private deviceCatalogPath = path.join(__dirname, "../static/oak-devices.json");

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

    public issueCommand = (commandId: string, remoteId: string | number) => {
        const payload = {
            Header: this.getHeader(),
            RemoteId: remoteId,
            CommandId: commandId,
            OakRemoteId: this.oakRemoteId
        };

        const fetchParams = { ...requestParams.post, body: JSON.stringify(payload) };
        return fetch(`${this.remoteBaseUrl}/api/ir/send`, fetchParams).then(getJsonResponse);
    };

    public isConnected = () => {
        const payload = {
            ...this.getHeader(),
            User: { Token: this.oakRemoteAuthToken },
        };

        const fetchParams = {
            ...requestParams.post,
            body: JSON.stringify(payload)
        };

        return fetch(`${this.renewSessionUrl}`, fetchParams)
            .then(validateResponse)
            .then(response => response.json())
            .then(content => content.RenewSessionResult.ESPDevices[0].Connected);
    };

    private fetchCatalogFromRemote = () => {
        const payload = {
            Header: this.getHeader(),
            OakRemoteId: this.oakRemoteId,
        };

        const fetchParams = {
            ...requestParams.post,
            body: JSON.stringify(payload)
        };

        return fetch(`${this.remoteBaseUrl}/api/ir/remotes/v2`, fetchParams).then(getJsonResponse);
    };

    public getCatalog = async (): Promise<ExecutionResponse> => {
        if (fs.existsSync(this.deviceCatalogPath)) {
            const content = JSON.parse(await fs.promises.readFile(this.deviceCatalogPath, "utf8"));
            return { content, statusCode: 200 };
        }

        return this.syncCatalog();
    };

    public syncCatalog = async (): Promise<ExecutionResponse> => {
        const result = await this.fetchCatalogFromRemote();
        const directory = path.dirname(this.deviceCatalogPath);

        await fs.promises.mkdir(directory, { recursive: true });
        await fs.promises.writeFile(this.deviceCatalogPath, JSON.stringify(result.content, null, 2), "utf8");

        return result;
    };

    public initialize = () => {
        this.logger.success("Oakter Remote Service Ready!");
    };
}

export const oakterRemoteService = new OakterRemoteService();
