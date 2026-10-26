import { z } from 'zod';

const actionsSchema = z.object({ print: z.boolean(), download: z.boolean(), share: z.boolean() }).strict();
const gatepassPayloadSchema = z.object({
  uniquecode: z.string(), book_number: z.string(), serial_number: z.string(), dateofissue: z.string(), timeofissue: z.string(),
  nine_r_id: z.string(), dist_todestination: z.string(), home_center: z.string(), center_code: z.string().nullable().optional(),
  crop_name_hi: z.string(), crop_name: z.string(), crop_weight: z.string(), trader_name: z.string(), vehicle: z.string(), vehicle_no: z.string(),
  kreta_mandi: z.string(), kreta_mandiName: z.string().nullable().optional(), crop_type: z.string(), bundle_no: z.string(), qty_parameter: z.string().nullable().optional(),
  latitude: z.string(), longitude: z.string(), taggingDate: z.string(), dateofdestination: z.string(), estimated_travel_time: z.string(), avg_speed: z.string()
}).strict();

const ninerPayloadSchema = z.object({
  book_number: z.string(), serial_number: z.string(), dateofissue: z.string(), mandi_name: z.string(), trade_mandi: z.string(),
  trader_license_number: z.string(), vikreta_details: z.string(), trader_name: z.string(), buyer_state: z.string(), buyer_license_no: z.string(), mandi_name_eng: z.string().nullable().optional(),
  kreta_details: z.string(), vehicleName: z.string(), vehicle_no: z.string(), crop_code: z.string(), crop_type: z.string(), crop_name_eng: z.string().nullable().optional(),
  crop_weight: z.string(), crop_rate: z.string(), crop_amount: z.string(), mandi_fee: z.string().nullable().optional(), dev_fee: z.string().nullable().optional(),
  weighing_fee: z.string().nullable().optional(), commission_fee: z.string().nullable().optional(), porter_fee: z.string().nullable().optional(), tax: z.string().nullable().optional(),
  agent_fee: z.string().nullable().optional(), other_fee: z.string().nullable().optional(), total_tax: z.string(), total_amount: z.string(), six_r_id: z.string()
}).strict();

export const emandiValidationSchemas = {
  'POST /api/emandi/gatepasses': { body: z.object({ data: gatepassPayloadSchema, actions: actionsSchema, qr: z.string().min(1).optional() }).strict() },
  'POST /api/emandi/niners': { body: z.object({ data: ninerPayloadSchema, actions: actionsSchema, qr: z.string().min(1).optional() }).strict() }
};
