import { z } from 'zod';

const actionsSchema = z.object({ print: z.boolean(), download: z.boolean(), share: z.boolean() }).strict();

const recordSourceSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('latest'), actions: actionsSchema }).strict(),
  z.object({ source: z.literal('id'), data: z.object({ id: z.string().min(1), date: z.string().min(1) }).strict(), actions: actionsSchema }).strict()
]);

const gatepassPayloadSchema = z.object({
  id: z.string(), book_number: z.string(), serial_number: z.string(), dateofissue: z.string(), timeofissue: z.string(),
  nine_r_id: z.string(), dist_todestination: z.string(), home_center: z.string(), center_code: z.string().optional(),
  crop_name_hi: z.string(), crop_name: z.string(), crop_weight: z.string(), trader_name: z.string(), vehicle: z.string(), vehicle_no: z.string(),
  kreta_mandi: z.string(), kreta_mandiName: z.string().optional(), crop_type: z.string(), bundle_no: z.string(), qty_parameter: z.string().optional(),
  latitude: z.string(), longitude: z.string(), taggingDate: z.string(), dateofdestination: z.string(), estimated_travel_time: z.string(), avg_speed: z.string(), qr: z.string()
}).strict();

const ninerPayloadSchema = z.object({
  book_number: z.string(), serial_number: z.string(), dateofissue: z.string(), mandi_name: z.string(), trade_mandi: z.string(),
  trader_license_number: z.string(), vikreta_details: z.string(), trader_name: z.string(), buyer_state: z.string(), buyer_license_no: z.string(),
  kreta_details: z.string(), vehicleName: z.string(), vehicle_no: z.string(), crop_name_hi: z.string().optional(), crop_code: z.string(), crop_type: z.string(),
  crop_weight: z.string(), crop_rate: z.string(), crop_amount: z.string(), mandi_fee: z.string().optional(), dev_fee: z.string().optional(),
  weighing_fee: z.string().optional(), commission_fee: z.string().optional(), porter_fee: z.string().optional(), tax: z.string().optional(),
  agent_fee: z.string().optional(), other_fee: z.string().optional(), total_tax: z.string(), total_amount: z.string(), six_r_id: z.string(), qr: z.string()
}).strict();

export const emandiValidationSchemas = {
  'POST /api/emandi/init': { body: z.object({ username: z.string().min(1), password: z.string().min(1) }).strict() },
  'POST /api/emandi/gatepasses': { body: z.union([recordSourceSchema, z.object({ source: z.literal('payload'), data: gatepassPayloadSchema, actions: actionsSchema }).strict()]) },
  'POST /api/emandi/niners': { body: z.union([recordSourceSchema, z.object({ source: z.literal('payload'), data: ninerPayloadSchema, actions: actionsSchema }).strict()]) }
};
