import joi from 'joi';
import { Request } from "express";
import { Throwable } from "./models";
import { constants } from "./constants";


const schemas: { [key: string]: object } = {
    "/api/whatsapp/sendtext/emandi": {
        message: joi.string().min(3).required()
    },
    "/api/whatsapp/sendtext/unityhub": {
        message: joi.string().min(3).required()
    },
    "/api/emandi/push": {
        date: joi.date().required(),
        seller: joi.string().trim().min(3).required(),
        weight: joi.number().required(),
        bags: joi.number().required(),
        vehicleNumber: joi.string().trim().min(6).required(),
        vehicleType: joi.number().max(4).required(),
        driverMobile: joi.number().empty(''),
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
        rate: joi.number().required()
    }
}

class Validator {
    public validateRequest = (request: Request) => {
        const path = request.originalUrl;
        const schema = schemas[path];
        if (schema) return joi.object(schema).validateAsync(request.body);
        else return Promise.reject(new Throwable(constants.errors.schemaNotReady, 501));
    }
}

export const validator = new Validator();