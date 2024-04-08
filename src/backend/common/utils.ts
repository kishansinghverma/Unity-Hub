import { ObjectId } from "mongodb";
import joi from 'joi';
import { Throwable } from "./models";
import { OperationResponse, ExecutionResponse } from "./types";
import { Response as ExpressResponse } from "express";

export const getEpoch = () => new Date().getTime();

export const mongoId = (id: string) => new ObjectId(id);

export const generateId = () => new ObjectId();

export const handleJsonResponse = async (response: Response): OperationResponse => {
    if (!response.ok) throw new Throwable(response.statusText, response.status);
    const json = await response.json();
    return { content: json, statusCode: response.status };
}

export const replySuccess = (response: ExpressResponse) => ((result: ExecutionResponse) => {
    if (!result.content) response.status(result.statusCode).end();
    else if (typeof result.content === 'object') response.status(result.statusCode).json(result.content);
    else response.status(result.statusCode).send(result.content);
})

export const replyError = (response: ExpressResponse) => ((error: Error) => {
    let errorCode = 500;
    if (joi.isError(error)) errorCode = 400;
    else if (error instanceof Throwable) errorCode = error.statusCode;
    response.status(errorCode).send(error.message);
});