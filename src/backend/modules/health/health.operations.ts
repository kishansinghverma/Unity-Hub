import type { OperationResponse } from '../../core/http/action-response.js';
import type { HealthStatus } from './health.types.js';

export class HealthOperation {
  getHealth = async (): Promise<OperationResponse<HealthStatus>> => ({
    statusCode: 200,
    content: { time: new Date().toISOString() }
  });
}
