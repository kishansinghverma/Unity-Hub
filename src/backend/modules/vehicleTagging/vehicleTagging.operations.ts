import type { OperationResponse } from '../../core/http/action-response.js';
import type { VehicleTaggingService } from './vehicleTagging.service.js';
import type { GetTaggingDataRequest, TagVehicleRequest } from './vehicleTagging.types.js';
import type { JsonValue } from '../../shared/types/json.js';

export class VehicleTaggingOperation {
  private readonly vehicleTaggingService: VehicleTaggingService;

  constructor({ vehicleTaggingService }: { vehicleTaggingService: VehicleTaggingService }) {
    this.vehicleTaggingService = vehicleTaggingService;
  }

  getVehicleTypes = async (): Promise<OperationResponse<JsonValue>> =>
    ({ content: (await this.vehicleTaggingService.getVehicleTypes()).resultData });

  getVehicle = async (gatepassId: string): Promise<OperationResponse<JsonValue>> =>
    ({ content: (await this.vehicleTaggingService.getVehicle(gatepassId)).resultData });

  getTaggingData = async (request: GetTaggingDataRequest): Promise<OperationResponse<JsonValue>> =>
    ({ content: (await this.vehicleTaggingService.getTaggingData(request)).resultData });

  insertTaggingData = async (request: TagVehicleRequest): Promise<OperationResponse<JsonValue>> =>
    ({ content: (await this.vehicleTaggingService.insertTaggingData(request)).resultData });
}
