import axios, { type Method } from 'axios';
import { Emandi, VehicleTagging } from '../../core/constants.js';
import { ServerError, UpstreamApiError } from '../../core/errors/app-error.js';
import { Configuration } from '../../core/utils/configuration.js';
import { ObjectUtils } from '../../core/utils/object.js';
import type { GetTaggingDataRequest, TagVehicleRequest, VehicleTaggingResponse } from './vehicleTagging.types.js';
import type { JsonValue } from '../../shared/types/json.js';

export class VehicleTaggingService {
  private readonly baseUrl = `${Emandi.BaseUrl}${VehicleTagging.BaseRoute}`;
  private readonly timeout = Emandi.RequestTimeout;
  private readonly mobileNumber = Configuration.GetSetting('VEHICLE_TAGGING_MOBILE_NUMBER');

  getVehicleTypes = (): Promise<VehicleTaggingResponse> => this.sendRequest('GET', VehicleTagging.Routes.getVehicleTypes);

  getVehicle = (gatepassId: string): Promise<VehicleTaggingResponse> => this.sendRequest('POST', VehicleTagging.Routes.getVehicle, {
    GatepassNumber: gatepassId,
    InstrumentType: 1
  });

  getTaggingData = (request: GetTaggingDataRequest): Promise<VehicleTaggingResponse> => this.sendRequest('GET', VehicleTagging.Routes.getTaggingData, {
    FromDate: request.fromDate,
    ToDate: request.toDate,
    MobileNumber: request.mobileNumber ?? this.mobileNumber,
    InstrumentType: request.instrumentType
  });

  insertTaggingData = (request: TagVehicleRequest): Promise<VehicleTaggingResponse> => this.sendRequest('POST', VehicleTagging.Routes.insertTaggingData, {
    ContactNumber: request.contactNumber ?? this.mobileNumber,
    InstrumentNumber: request.instrumentNumber,
    InstrumentType: request.instrumentType,
    InstrumentTypeName: request.instrumentTypeName,
    VehicleTypeId: request.vehicleTypeId,
    VehicleTypeName: request.vehicleTypeName,
    VehicleNumber: request.vehicleNumber,
    Latitude: request.latitude,
    Longitude: request.longitude,
    IPAddress: request.ipAddress,
    VehicleImage: request.vehicleImage,
    VehicleFullImage: request.vehicleFullImage
  });

  private sendRequest = async (method: Method, path: string, data?: object): Promise<VehicleTaggingResponse> => {
    const response = await axios.request<JsonValue>({
      url: `${this.baseUrl}${path}`,
      method,
      ...(data === undefined ? {} : { data: ObjectUtils.SanitizeObject(data) }),
      timeout: this.timeout,
      validateStatus: () => true
    });

    if (response.status >= 400) throw new UpstreamApiError(`Vehicle tagging request failed (${response.status})`, response.status);
    if (!this.isResponse(response.data)) throw new UpstreamApiError('Invalid vehicle tagging response', 502);
    if (!response.data.resultStatus) throw new ServerError(response.data.resultMessage);
    return response.data;
  };

  private isResponse = (value: JsonValue): value is VehicleTaggingResponse => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return typeof value.resultStatus === 'boolean' && typeof value.resultMessage === 'string' && 'resultData' in value;
  };
}
