import { ExecutionResponse, EMandiAuthRequest, RequestConfig } from "../common/types";
import { emandiClient } from "../services/emandiclient";
import { eMandiPortal } from "../common/constants";

class MandiProxy {
    public init = async (request: EMandiAuthRequest = {}): Promise<ExecutionResponse> => {
        const autorefresh = request.autorefresh !== undefined ? request.autorefresh : true;

        return emandiClient.initializeSession({
            email: request.email,
            password: request.password,
            autorefresh
        });
    };

    public getStatus = (): Promise<ExecutionResponse> => {
        return emandiClient.getSessionStatus();
    };

    public logout = (): Promise<ExecutionResponse> => {
        return emandiClient.clearSession();
    };

    public getGatepasses = (query: any = {}, method: string = "GET", headers: any = {}, body: any = null): Promise<ExecutionResponse> => {
        const defaultUrl = method === "POST" ? eMandiPortal.gatepassList : eMandiPortal.gatepasses;
        const targetUrl = (query.url || query.path || defaultUrl) as string;

        const payload: RequestConfig = {
            url: targetUrl,
            method: method,
            headers: headers["content-type"] ? { "Content-Type": headers["content-type"] as string } : undefined,
            body: ["POST", "PUT", "PATCH"].includes(method) && body && Object.keys(body).length > 0 ? body : null
        };

        return emandiClient.sendRequest(payload);
    };

    public sendRequest = (config: RequestConfig): Promise<ExecutionResponse> => {
        return emandiClient.sendRequest(config);
    };
}

export const mandiProxy = new MandiProxy();
