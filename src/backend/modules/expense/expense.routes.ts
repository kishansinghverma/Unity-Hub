import type { FastifyPluginAsync } from 'fastify';
import type { ExpenseOperation } from './expense.operations.js';
import type { CreateLocationRequest } from './expense.types.js';

export const expenseRoutes: FastifyPluginAsync = async (app) => {
  const operations = app.container.resolve<ExpenseOperation>('expenseOperation');

  app.post<CreateLocationRequest>('/location', async (request) => operations.addLocation(request.body));
};
