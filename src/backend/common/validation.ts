import joi from 'joi';
import { Request } from "express";
import { Throwable } from "./models";
import { constants } from "./constants";

const schemas: { [key: string]: object } = {
    "/whatsapp/sendtext/emandi": {
        message: joi.string().min(3).required()
    },
    "/whatsapp/sendtext/unityhub": {
        message: joi.string().min(3).required()
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