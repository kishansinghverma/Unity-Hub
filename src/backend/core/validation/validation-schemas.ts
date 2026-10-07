import type { z } from 'zod';
import { gatepassValidationSchemas } from '../../modules/gatepass/gatepass.schema.js';
import { whatsappValidationSchemas } from '../../modules/whatsapp/whatsapp.schema.js';
import { imagingValidationSchemas } from '../../modules/imaging/imaging.schema.js';
import { emandiValidationSchemas } from '../../modules/emandi/emandi.schema.js';
import { vehicleTaggingValidationSchemas } from '../../modules/vehicleTagging/vehicleTagging.schema.js';
import { oakterRemoteValidationSchemas } from '../../modules/oakterRemote/oakterRemote.schema.js';
import { s3StorageValidationSchemas } from '../../modules/s3storage/s3storage.schema.js';

type RouteValidation = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

export const validationSchemas: Record<string, RouteValidation> = {
  ...gatepassValidationSchemas,
  ...whatsappValidationSchemas,
  ...imagingValidationSchemas,
  ...emandiValidationSchemas,
  ...vehicleTaggingValidationSchemas,
  ...oakterRemoteValidationSchemas,
  ...s3StorageValidationSchemas
};
