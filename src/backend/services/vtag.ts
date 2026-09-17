import axios from "axios";
import { eMandiPortal } from "../common/constants";
import { ExecutionResponse, RequestConfig } from "../common/types";
import { GetTaggedVehicleRequest, TagVehicleRequest } from "../common/types/inbound/request/VehicleTagging";
import { GetVehicleRequest } from "../common/types/outbound/request/VehicleTagging";

class VehicleTaggingService {
    public getVehicle = (gatepassId: string): Promise<ExecutionResponse> =>
        this.sendJsonRequest({
            url: this.getVehicleTaggingUrl(eMandiPortal.vehicleTagging.getVehicle),
            method: "POST",
            body: {
                GatepassNumber: gatepassId,
                InstrumentType: 1
            }
        });

    public getTaggingData = (request: GetTaggedVehicleRequest): Promise<ExecutionResponse> => {
        return this.sendJsonRequest({
            url: this.getVehicleTaggingUrl(eMandiPortal.vehicleTagging.getTaggingData),
            method: "GET",
            body: request
        });
    };

    public getVehicleTypes = (): Promise<ExecutionResponse> =>
        this.sendJsonRequest({
            url: this.getVehicleTaggingUrl(eMandiPortal.vehicleTagging.getVehicleTypes),
            method: "GET"
        });

    public insertTaggingData = (request: TagVehicleRequest): Promise<ExecutionResponse> => {
        return this.sendJsonRequest({
            url: this.getVehicleTaggingUrl(eMandiPortal.vehicleTagging.insertTaggingData),
            method: "POST",
            body: request
        });
    };

    private getVehicleTaggingUrl = (path: string): string => `${eMandiPortal.baseUrl}${eMandiPortal.vehicleTagging.baseRoute}${path}`;

    private sendJsonRequest = async (config: RequestConfig): Promise<ExecutionResponse> => {
        const response = await axios.request({
            url: config.url,
            method: config.method,
            data: config.body,
        });

        return { content: response.data, statusCode: response.status };
    };
}

export const vehicleTaggingService = new VehicleTaggingService();
