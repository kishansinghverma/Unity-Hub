import type { FastifyPluginAsync } from 'fastify';
import type { VehicleTaggingOperation } from './vehicleTagging.operations.js';
import type { GetTaggingDataRequest, GetVehicleRequest, TagVehicleRequest } from './vehicleTagging.types.js';

export const vehicleTaggingRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<VehicleTaggingOperation>('vehicleTaggingOperation');

  app.get('/vehicles/types', async () => operations.getVehicleTypes());
  app.get<{ Querystring: GetVehicleRequest }>('/vehicles', async (request) => operations.getVehicle(request.query.gatepassId));
  app.get<{ Querystring: GetTaggingDataRequest }>('/entries', async (request) => operations.getTaggingData(request.query));
  app.post<{ Body: TagVehicleRequest }>('/entries', async (request) => operations.insertTaggingData(request.body));
};
