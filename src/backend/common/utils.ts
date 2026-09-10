import { MongoError } from "mongodb";
import joi from 'joi';
import { ObjectUtils, SplitwiseThrowable, Throwable } from "./models";
import { GatepassQrData, NinerQrData, OperationResponse, ExecutionResponse } from "./types";
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

export const getGatepassQrData = ({serialNumber,issueFrom,crop,weight,vehicleNumber,applicationNumber,issueDate,issueTime}: GatepassQrData): string =>
    `Gatepass no:${serialNumber},Issue from:${issueFrom},Crop:${crop},Weight:${weight},Vehicle no:${vehicleNumber},applicationnumber:${applicationNumber}date & time of issue :${issueDate} ${issueTime}InstrumentType:Gatepass,http://emandi.up.gov.in/`;

export const getNinerQrData = ({ serialNumber, mandi, crop }: NinerQrData): string =>
    `SerialNo:${serialNumber},Mandi:${mandi},Crop:${crop}InstrumentType:9R,http://emandi.up.gov.in/`;

export function normalizePortalDate(input?: Date | string): string | undefined {
    if (!input) return undefined;

    if (input instanceof Date) {
        if (Number.isNaN(input.getTime())) throw new Throwable("Dates must be valid calendar dates", 400);
        const day = String(input.getDate()).padStart(2, "0");
        const month = String(input.getMonth() + 1).padStart(2, "0");
        return `${day}/${month}/${input.getFullYear()}`;
    }

    const trimmed = input.trim();
    if (!trimmed) return undefined;

    const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) throw new Throwable("Dates must use DD/MM/YYYY format", 400);

    const [, dayValue, monthValue, yearValue] = match;
    const day = Number(dayValue);
    const month = Number(monthValue);
    const year = Number(yearValue);
    const parsed = new Date(year, month - 1, day);

    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
        throw new Throwable("Dates must be valid calendar dates", 400);
    }

    return `${dayValue}/${monthValue}/${yearValue}`;
}
