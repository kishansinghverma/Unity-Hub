import joi from 'joi';
import { Request } from "express";
import { Throwable } from "./models";
import { constants, greenApi } from "./constants";

const joiError = (message: string) => (new joi.ValidationError(message, [], null))

const schemas: { [key: string]: any } = {
    "/api/whatsapp/webhook": joi.object({
        typeWebhook: joi.string().valid("incomingMessageReceived").required(),
        senderData: joi.object({
            chatId: joi.string().valid(greenApi.groupId.unityHub).required()
        }).unknown(true),
        messageData: joi.object({
            typeMessage: joi.string().valid("textMessage", "documentMessage").required(),
            textMessageData: joi.any().optional(),
            fileMessageData: joi.any().optional()
        }).required()
    }).unknown(true),
    "/api/whatsapp/sendtext/emandi": {
        message: joi.string().min(3).required()
    },
    "/api/whatsapp/sendtext/unityhub": {
        message: joi.string().min(3).required()
    },
    "/api/emandi/push": {
        date: joi.string().required(),
        seller: joi.string().trim().min(3).required(),
        weight: joi.number().required(),
        bags: joi.number().required(),
        vehicleNumber: joi.string().trim().min(6).required(),
        vehicleType: joi.number().max(4).required(),
        driverMobile: joi.string().regex(/^(\d{10})?$/).empty(''),
        party: {
            name: joi.string().trim().min(3).required(),
            mandi: joi.string().trim().min(3).required(),
            state: joi.string().trim().min(3).required(),
            stateCode: joi.number().required(),
            distance: joi.number().required(),
            licenceNumber: joi.string().trim().empty('')
        }
    },
    "/api/emandi/parties": {
        name: joi.string().trim().min(3).required(),
        mandi: joi.string().trim().min(3).required(),
        state: joi.string().trim().min(3).required(),
        stateCode: joi.number().required(),
        distance: joi.number().required(),
        licenceNumber: joi.string().trim().empty('')
    },
    "/api/emandi/entry": {
        rate: joi.number().required(),
        finalize: joi.boolean()
    },
    "/api/files/html": {
        name: joi.string().valid('niner', 'gatepass'),
        party: joi.string().trim().min(3).required(),
        qr: joi.string().required(),
        tables: joi.array().required(),
        print: joi.bool().required(),
        forceDownload: joi.bool().required(),
        driverMobile: joi.string().regex(/^(\d{10})?$/).empty(''),
    },
    "/api/expenses/groups": {
        id: joi.number().required(),
        name: joi.string().required(),
        isShared: joi.bool().required()
    }
}

class Validator {
    public validateRequest = (request: Request) => {
        const path = request.originalUrl.replace(/\/$/, '');
        const schema = schemas[path];
        if (schema) return joi.isSchema(schema) ? schema.validateAsync(request.body) : joi.object(schema).validateAsync(request.body);
        else return Promise.reject(new Throwable(constants.errors.schemaNotReady, 501));
    }
}

export const validator = new Validator();