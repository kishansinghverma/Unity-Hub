import type { FastifyInstance } from 'fastify';
import axios from 'axios';
import { MongoServerError } from 'mongodb';
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AppError } from './app-error.js';
import { ErrorCodes } from './error-codes.js';
import { sendErrorResponse } from '../http/action-response.js';

const oversizedCodes = new Set([
  'FST_REQ_FILE_TOO_LARGE',
  'FST_FILES_LIMIT',
  'FST_FIELDS_LIMIT',
  'FST_PARTS_LIMIT',
  'FST_ERR_CTP_BODY_TOO_LARGE',
]);

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const isValidationError =
      hasZodFastifySchemaValidationErrors(error) ||
      error instanceof z.ZodError ||
      (error instanceof AppError && error.code === ErrorCodes.ValidationError);
    let status = 500;
    let code: string = ErrorCodes.InternalError;
    let message = error instanceof Error && error.message
      ? error.message
      : 'An unexpected error occurred';
    let details: unknown;

    if (isResponseSerializationError(error)) {
      status = 500;
    } else if (isValidationError && hasZodFastifySchemaValidationErrors(error)) {
      status = 400;
      code = ErrorCodes.ValidationError;
      message = 'Request validation failed';
      details = error.validation.map((issue) => {
        const field = `${error.validationContext ?? 'body'}${issue.instancePath}`;
        const issueMessage = issue.code === 'invalid_type' && issue.input === undefined
          ? 'Field is required'
          : issue.message ?? 'Invalid value';
        return { ...(field ? { field } : {}), message: issueMessage };
      });
    } else if (isValidationError && error instanceof z.ZodError) {
      status = 400;
      code = ErrorCodes.ValidationError;
      message = 'Request validation failed';
      details = error.issues.map((issue) => {
        const field = issue.path.join('.');
        const issueMessage = issue.code === 'invalid_type' && issue.input === undefined
          ? 'Field is required'
          : issue.message;
        return { ...(field ? { field } : {}), message: issueMessage };
      });
    } else if (axios.isAxiosError(error)) {
      const responseBody = error.response?.data;
      status = error.response?.status ?? 502;
      code = ErrorCodes.UpstreamApiError;
      if (typeof responseBody === 'string') message = responseBody;
      else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = typeof body.error === 'string' ? body.error : error.message;
        details = responseBody;
      } else message = error.message;
    } else if (error instanceof AppError) {
      status = error.statusCode;
      code = error.code;
      message = error.message;
      details = error.details;
    } else if (error instanceof MongoServerError) {
      switch (error.code) {
        case 11000:
          status = 409;
          code = ErrorCodes.Conflict;
          message = 'Resource already exists';
          break;
        case 121:
          status = 400;
          code = ErrorCodes.BadRequest;
          message = 'The database rejected the provided data';
          break;
      }
    } else if (
      error instanceof Error &&
      'code' in error &&
      typeof error.code === 'string' &&
      oversizedCodes.has(error.code)
    ) {
      status = 413;
      code = ErrorCodes.PayloadTooLarge;
      message = 'The upload exceeds the permitted size or number of parts';
    } else if (
      error instanceof Error &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      status = error.statusCode;
      code = status === 413 ? ErrorCodes.PayloadTooLarge : ErrorCodes.BadRequest;
      message =
        status === 413
          ? 'The request payload is too large'
          : status === 415
            ? 'Unsupported content type'
            : 'The request could not be processed';
    }

    if (status !== 404) app.log.warn(`Request failed : ${message}`);
    return sendErrorResponse(reply, request.id, status, code, message, details);
  });

  app.setNotFoundHandler((request, reply) => {
    app.log.warn('Route not found!');
    return sendErrorResponse(reply, request.id, 404, ErrorCodes.NotFound, 'Route not found');
  });
}
