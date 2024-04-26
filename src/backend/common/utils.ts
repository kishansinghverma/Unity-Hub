import { MongoError } from "mongodb";
import joi from 'joi';
import { Throwable } from "./models";
import { OperationResponse, ExecutionResponse } from "./types";
import { Response as ExpressResponse } from "express";
import { constants, mongoErrorCodes } from "./constants";
import { MulterError } from "multer";

export const getHttpCode = (error: MongoError) => (mongoErrorCodes[error.code ?? 8] ?? 500);

export const getJsonResponse = async (response: Response): OperationResponse => {
    if (!response.ok) throw new Throwable(response.statusText, response.status);
    const json = await response.json();
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
    };

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