import { ExecutionResponse } from "../common/types";
import { GetTaggedVehicleRequest, TagVehicleRequest } from "../common/types/inbound/request/VehicleTagging";
import { vehicleTaggingService } from "../services/vtag";

class VehicleTagging {
    public getVehicle = (gatepassId: string): Promise<ExecutionResponse> =>
        vehicleTaggingService.getVehicle(gatepassId);

    public getTaggingData = (request: GetTaggedVehicleRequest): Promise<ExecutionResponse> =>
        vehicleTaggingService.getTaggingData(request);

    public getVehicleTypes = (): Promise<ExecutionResponse> =>
        vehicleTaggingService.getVehicleTypes();

    public insertTaggingData = (request: TagVehicleRequest): Promise<ExecutionResponse> =>
        vehicleTaggingService.insertTaggingData(request);
}

export const vtag = new VehicleTagging();
