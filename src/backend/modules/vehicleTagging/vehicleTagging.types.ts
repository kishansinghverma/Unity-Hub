import type { JsonValue } from '../../shared/types/json.js';

export type VehicleTaggingResponse = {
  resultStatus: boolean;
  resultMessage: string;
  resultData: JsonValue;
};

export type GetVehicleRequest = {
  gatepassId: string;
};

export type GetTaggingDataRequest = {
  fromDate: string;
  toDate: string;
  mobileNumber?: string;
  instrumentType: string;
};

export type TagVehicleRequest = {
  contactNumber?: string;
  instrumentNumber: string;
  instrumentType: number;
  instrumentTypeName: string;
  vehicleTypeId: number;
  vehicleTypeName: string;
  vehicleNumber: string;
  latitude: string;
  longitude: string;
  ipAddress: string;
  vehicleImage: string;
  vehicleFullImage: string;
};
