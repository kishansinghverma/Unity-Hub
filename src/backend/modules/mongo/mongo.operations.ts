import type { OperationResponse } from '../../core/http/action-response.js';
import type { MongoService } from './mongo.service.js';

export class MongoOperation {
  private readonly mongoService: MongoService;

  constructor({ mongoService }: { mongoService: MongoService }) {
    this.mongoService = mongoService;
  }

  setup = async (): Promise<OperationResponse<{ message: string }>> => {
    await this.mongoService.createIndexes();
    return { content: { message: 'MongoDB indexes initialized' } };
  };
}
