import type { FastifyReply, FastifyRequest } from 'fastify';

export type OperationResponse<Content = undefined> = {
  statusCode?: number;
  content?: Content | undefined;
  message?: string | undefined;
};

export type ActionResponse<Content = undefined> = {
  isError: boolean;
  errorType?: string;
  message?: string;
  traceId?: string;
  content?: Content;
};

export function isOperationResponse(value: unknown): value is OperationResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !('isError' in value) &&
    ('statusCode' in value || 'content' in value || 'message' in value)
  );
}

export function createActionResponse<Content>(
  traceId: string,
  response: OperationResponse<Content>,
): ActionResponse<Content> {
  return {
    isError: false,
    traceId,
    ...(response.message === undefined ? {} : { message: response.message }),
    ...(response.content === undefined ? {} : { content: response.content }),
  };
}

export async function actionResponseHook(
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
): Promise<unknown> {
  if (!isOperationResponse(payload)) return payload;
  const statusCode = payload.statusCode ?? 200;
  reply.code(statusCode);
  if (statusCode === 204 || statusCode === 404) return undefined;
  return createActionResponse(request.id, payload);
}

export function sendErrorResponse(
  reply: FastifyReply,
  traceId: string,
  statusCode: number,
  errorType: string,
  message: string,
  content?: unknown,
): FastifyReply {
  if (statusCode === 404) return reply.code(404).send();

  return reply.code(statusCode).send({
    isError: true,
    errorType,
    message,
    traceId,
    ...(content === undefined ? {} : { content }),
  } satisfies ActionResponse<unknown>);
}
