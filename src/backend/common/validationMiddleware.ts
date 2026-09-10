import joi from 'joi';
import { NextFunction, Request, Response } from "express";
import { constants } from "./constants";
import { schemas, ValidationSchema } from "./validationSchemas";

class Validator {
    public getSchema = (request: Request, schemaKey?: string): ValidationSchema | undefined => {
        const path = request.originalUrl.split('?')[0].replace(/\/$/, '');
        const key = schemaKey ?? `${request.method} ${path}`;
        const exactSchema = schemas[key];
        if (exactSchema) return exactSchema;

        return Object.entries(schemas).find(([registeredPath]) => {
            const [method, ...pathParts] = registeredPath.split(' ');
            if (method !== request.method || pathParts.length === 0) return false;
            const registeredParts = pathParts.join(' ').split('/').filter(Boolean);
            const requestParts = path.split('/').filter(Boolean);
            return registeredParts.length === requestParts.length
                && registeredParts.every((part, index) => part.startsWith(':') || part === requestParts[index]);
        })?.[1];
    };

    public validate = (schema: joi.Schema, value: unknown) => schema.validateAsync(value);
}

export const validationMiddleware = async (request: Request, response: Response, next: NextFunction) => {
    const schema = validator.getSchema(request);
    if (!schema) return next();

    try {
        if (schema.params) request.params = await validator.validate(schema.params, request.params);
        if (schema.query) request.query = await validator.validate(schema.query, request.query);
        if (schema.body) request.body = await validator.validate(schema.body, request.body);

        next();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        response.status(400).send(`[${constants.errors.validationError}] ${message}`);
    }
};

const validator = new Validator();
