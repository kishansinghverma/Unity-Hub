import fp from 'fastify-plugin';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { validationSchemas } from './validation-schemas.js';

export const validationPlugin = fp(
  async (app) => {
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.addHook('preValidation', async (request) => {
      const schema = validationSchemas[`${request.method} ${request.routeOptions.url}`];
      if (!schema) return;
      if (schema.body) request.body = schema.body.parse(request.body);
      if (schema.params) request.params = schema.params.parse(request.params);
      if (schema.query) request.query = schema.query.parse(request.query);
    });
  },
  { name: 'validation' },
);
