import type { OperationResponse } from '../../core/http/action-response.js';
import type { ExpenseService } from './expense.service.js';
import type { Location } from './expense.types.js';

export class ExpenseOperation {
  private readonly expenseService: ExpenseService;

  constructor({ expenseService }: { expenseService: ExpenseService }) {
    this.expenseService = expenseService;
  }

  addLocation = async (location: Location): Promise<OperationResponse<{ insertedId: string }>> => ({
    statusCode: 201,
    content: { insertedId: (await this.expenseService.addLocation(location)).toHexString() },
  });
}
