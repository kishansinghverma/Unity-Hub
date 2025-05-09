import { MongoError } from "mongodb";
import joi from 'joi';
import { ObjectUtils, SplitwiseThrowable, Throwable } from "./models";
import { OperationResponse, ExecutionResponse } from "./types";
import { Response as ExpressResponse } from "express";
import { constants, mongoErrorCodes } from "./constants";
import { MulterError } from "multer";
export const getHttpCode = (error: MongoError) => (mongoErrorCodes[error.code ?? 8] ?? 500);

export const validateResponse = (response: Response) => {
    if (!response.ok) throw new Throwable(response.statusText, response.status);
    return response;
}

export const getJsonResponse = async (response: Response): OperationResponse => {
    validateResponse(response);
    const json = await response.json();

    // Validate Splitwise Response
    if (!ObjectUtils.isEmpty(json.errors)) throw new SplitwiseThrowable(json.errors.base, 400);

    return { content: json, statusCode: response.status };
}

export const getErrorResponse = (error: Error) => {
    let errorCode = 500, errorType = constants.errors.genericError;

    if (joi.isError(error)) {
        errorCode = 400;
        errorType = constants.errors.validationError;
    }
    else if (error instanceof Throwable) {
        errorCode = error.statusCode;
        errorType = constants.errors.customError;
    }
    else if (error instanceof MongoError) {
        errorCode = getHttpCode(error);
        errorType = constants.errors.mongoError;
    }
    else if (error instanceof MulterError) {
        errorCode = 400;
        errorType = constants.errors.multerError;
    }
    else if (error instanceof SplitwiseThrowable) {
        errorCode = error.statusCode;
        errorType = constants.errors.splitwiseError
    }

    return { content: `[${errorType}] ${error.message}`, statusCode: errorCode };
}

export const replySuccess = (response: ExpressResponse) => ((result: ExecutionResponse) => {
    if (!result.content) response.status(result.statusCode).end();
    else if (typeof result.content === 'object') response.status(result.statusCode).json(result.content);
    else response.status(result.statusCode).send(result.content);
})

export const replyError = (response: ExpressResponse) => ((error: Error) => {
    const errorResponse = getErrorResponse(error);
    response.status(errorResponse.statusCode).send(errorResponse.content);
});