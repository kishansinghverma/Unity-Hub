import type { ObjectId } from 'mongodb';
import type { z } from 'zod';
import type { createGatepassSchema, finalizeGatepassSchema, partySchema } from './gatepass.schema.js';
import type { NotificationResult } from '../whatsapp/whatsapp.types.js';

export type Party = z.infer<typeof partySchema>;
export type FinalizeGatepass = z.infer<typeof finalizeGatepassSchema>;
export type CreateGatepass = z.infer<typeof createGatepassSchema>;
export type CreateGatepassResponse = { insertedId: ObjectId; notification?: string };

export type GatepassIdParams = { id: string };
export type FinalizeRequest = { Body: FinalizeGatepass };
export type PopRequest = { Params: { id?: string } };
export type PushRequest = { Body: CreateGatepass };
export type RequeueRequest = { Params: GatepassIdParams };
export type DeleteQueuedRequest = { Params: GatepassIdParams };
export type CreatePartyRequest = { Body: Party };
export type UpdatePartyRequest = { Body: Party; Params: GatepassIdParams };
export type DeletePartyRequest = { Params: GatepassIdParams };

export type GatepassPatch = {
  gatepassId?: string | undefined;
  ninerId?: string | undefined;
  rate?: string | 0 | undefined;
};

export type GatepassDocument = {
  _id: ObjectId;
  date: string;
  seller: string;
  weight: number;
  bags: number;
  vehicleNumber: string;
  vehicleType: number;
  party: Party;
  vehicleImage?: string;
  numberPlateImage?: string;
  rawVehicleImage?: string;
  rawNumberPlateImage?: string;
  createdOn: number;
  gatepassId?: string;
  ninerId?: string;
  rate?: string | 0;
  latitude?: number | undefined;
  longitude?: number | undefined;
};

export type GatepassPayload = Omit<GatepassDocument, '_id' | 'createdOn' | 'vehicleImage' | 'numberPlateImage'>;

export type PartyDocument = Party & { _id: ObjectId };
