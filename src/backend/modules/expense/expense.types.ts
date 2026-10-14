import type { ObjectId } from 'mongodb';
import type { z } from 'zod';
import type { locationSchema } from './expense.schema.js';

export type Location = z.infer<typeof locationSchema>;
export type LocationDocument = Location & { _id: ObjectId };
export type CreateLocationRequest = { Body: Location };
