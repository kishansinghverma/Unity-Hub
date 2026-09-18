import joi from 'joi';
import { greenApi } from "./constants";

export type ValidationSchema = Partial<Record<'params' | 'query' | 'body', joi.Schema>>;

export const schemas: Record<string, ValidationSchema> = {
    "POST /api/whatsapp/webhook": {
        body: joi.object({
            typeWebhook: joi.string().valid("incomingMessageReceived").required(),
            senderData: joi.object({
                chatId: joi.string().valid(greenApi.groupId.unityHub).required()
            }).unknown(true),
            messageData: joi.object({
                typeMessage: joi.string().valid("textMessage", "documentMessage").required(),
                textMessageData: joi.any().optional(),
                fileMessageData: joi.any().optional()
            }).required()
        }).unknown(true)
    },
    "POST /api/whatsapp/sendtext/emandi": {
        body: joi.object({
            message: joi.string().min(3).required()
        })
    },
    "POST /api/whatsapp/sendtext/unityhub": {
        body: joi.object({
            message: joi.string().min(3).required()
        })
    },
    "POST /api/dispatches/push": {
        body: joi.object({
            date: joi.string().required(),
            seller: joi.string().trim().min(3).required(),
            weight: joi.number().required(),
            bags: joi.number().required(),
            vehicleNumber: joi.string().trim().min(6).required(),
            vehicleType: joi.number().max(4).required(),
            driverMobile: joi.string().regex(/^(\d{10})?$/).empty(''),
            party: joi.object({
                name: joi.string().trim().min(3).required(),
                mandi: joi.string().trim().min(3).required(),
                state: joi.string().trim().min(3).required(),
                stateCode: joi.number().required(),
                distance: joi.number().required(),
                licenceNumber: joi.string().trim().empty('')
            }).required()
        })
    },
    "PATCH /api/dispatches/finalize": {
        body: joi.object({
            gatepassId: joi.string().trim().min(1).optional(),
            ninerId: joi.string().trim().min(1).optional(),
            rate: joi.string().trim().min(1).optional()
        }).unknown(false)
    },
    "GET /api/dispatches/requeue/:id": {
        params: joi.object({
            id: joi.string().trim().min(1).required()
        })
    },
    "DELETE /api/dispatches/:id": {
        params: joi.object({
            id: joi.string().trim().min(1).required()
        })
    },
    "POST /api/dispatches/parties": {
        body: joi.object({
            name: joi.string().trim().min(3).required(),
            mandi: joi.string().trim().min(3).required(),
            state: joi.string().trim().min(3).required(),
            stateCode: joi.number().required(),
            distance: joi.number().required(),
            licenceNumber: joi.string().trim().empty('')
        })
    },
    "PATCH /api/dispatches/parties/:id": {
        params: joi.object({
            id: joi.string().trim().min(1).required()
        }),
        body: joi.object({
            name: joi.string().trim().min(3).required(),
            mandi: joi.string().trim().min(3).required(),
            state: joi.string().trim().min(3).required(),
            stateCode: joi.number().required(),
            distance: joi.number().required(),
            licenceNumber: joi.string().trim().empty('')
        })
    },
    "POST /api/vision/captcha": {
        body: joi.object({
            base64string: joi.string().required()
        })
    },
    "GET /api/vtag/vehicles/:gatepassId": {
        params: joi.object({
            gatepassId: joi.string().trim().min(1).required()
        }).unknown(false)
    },
    "GET /api/vtag/entries": {
        body: joi.object({
            FromDate: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required(),
            ToDate: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required(),
            MobileNumber: joi.string().trim().pattern(/^\d{10}$/).required(),
            InstrumentType: joi.string().trim().pattern(/^[1-9]\d*$/).required()
        }).unknown(false)
    },
    "POST /api/vtag/entries": {
        body: joi.object({
            ContactNumber: joi.string().trim().pattern(/^\d{10}$/).required(),
            InstrumentNumber: joi.string().trim().min(1).required(),
            InstrumentType: joi.number().integer().positive().required(),
            InstrumentTypeName: joi.string().trim().min(1).required(),
            VehicleTypeId: joi.number().integer().positive().required(),
            VehicleTypeName: joi.string().trim().min(1).required(),
            VehicleNumber: joi.string().trim().min(1).required(),
            Latitude: joi.string().trim().min(1).required(),
            Longitude: joi.string().trim().min(1).required(),
            IPAddress: joi.string().trim().min(1).required(),
            VehicleImage: joi.string().min(1).required(),
            VehicleFullImage: joi.string().min(1).required()
        }).unknown(false)
    },
    "POST /api/emandi/session": {
        body: joi.object({
            email: joi.string().trim().email().max(254).required(),
            password: joi.string().min(1).max(1024).required(),
            autorefresh: joi.boolean().optional()
        })
    },
    "GET /api/emandi/gatepasses": {
        query: joi.object({
            id: joi.string().trim().min(1).optional(),
            date: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
            limit: joi.number().integer().min(1).optional(),
            fromDate: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
            toDate: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional()
        }).custom((value, helpers) => {
            if (value.id && !value.date) return helpers.error('any.invalid');
            if (value.date && !value.id) return helpers.error('any.invalid');
            return value;
        }).messages({
            'any.invalid': 'id and date must be provided together'
        })
    },
    "GET /api/emandi/niners": {
        query: joi.object({
            id: joi.string().trim().min(1).optional(),
            date: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
            limit: joi.number().integer().min(1).optional(),
            fromDate: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional(),
            toDate: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).optional()
        }).custom((value, helpers) => {
            if (value.id && !value.date) return helpers.error('any.invalid');
            if (value.date && !value.id) return helpers.error('any.invalid');
            return value;
        }).messages({
            'any.invalid': 'id and date must be provided together'
        })
    },
    "POST /api/documents/gatepasses": {
        body: joi.object({
            source: joi.alternatives().try(
                joi.object({
                    type: joi.valid("latest").required()
                }).unknown(false),
                joi.object({
                    type: joi.valid("id").required(),
                    gatepassId: joi.string().trim().min(1).required(),
                    date: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
                }).unknown(false),
                joi.object({
                    type: joi.valid("html").required(),
                    party: joi.string().trim().min(1).required(),
                    tables: joi.array().items(joi.string()).required(),
                    qr: joi.string().required()
                }).unknown(false)
            ).required(),
            print: joi.boolean().required(),
            download: joi.boolean().required(),
            share: joi.boolean().required(),
            driverMobile: joi.string().regex(/^(\d{10})?$/).empty('').optional()
        }).custom((value, helpers) => {
            if ([value.print, value.download, value.share].filter(Boolean).length === 0)
                return helpers.error('any.invalid');
            return value;
        }).messages({
            'any.invalid': 'At least one of print, download, or share must be true'
        })
    },
    "POST /api/documents/niners": {
        body: joi.object({
            source: joi.alternatives().try(
                joi.object({
                    type: joi.valid("latest").required()
                }).unknown(false),
                joi.object({
                    type: joi.valid("id").required(),
                    ninerId: joi.string().trim().min(1).required(),
                    date: joi.string().trim().pattern(/^\d{2}\/\d{2}\/\d{4}$/).required()
                }).unknown(false),
                joi.object({
                    type: joi.valid("html").required(),
                    party: joi.string().trim().min(1).required(),
                    tables: joi.array().items(joi.string()).required(),
                    qr: joi.string().required()
                }).unknown(false)
            ).required(),
            print: joi.boolean().required(),
            download: joi.boolean().required(),
            share: joi.boolean().required(),
            driverMobile: joi.string().regex(/^(\d{10})?$/).empty('').optional()
        }).custom((value, helpers) => {
            if ([value.print, value.download, value.share].filter(Boolean).length === 0)
                return helpers.error('any.invalid');
            return value;
        }).messages({
            'any.invalid': 'At least one of print, download, or share must be true'
        })
    },
    "PATCH /api/splitwise/groups": {
        body: joi.object({
            id: joi.number().required(),
            isShared: joi.bool().required()
        })
    },
    "POST /api/expenses/statement/bank": {
        body: joi.array().items({
            date: joi.date().iso().required(),
            description: joi.string().trim().min(2).max(500).required(),
            amount: joi.number().positive().precision(2).required(),
            type: joi.string().valid("Debit", "Credit").required(),
            bank: joi.string().trim().min(2).max(50).required()
        }).min(1).required()
    },
    "POST /api/expenses/statement/paymentapp": {
        body: joi.array().items({
            date: joi.date().iso().required(),
            recipient: joi.string().trim().min(2).max(500).required(),
            transactionId: joi.string().trim().min(2).max(500).required(),
            utr: joi.string().trim().min(2).max(500).required(),
            amount: joi.number().positive().precision(2).required(),
            type: joi.string().valid("Debit", "Credit", "Unknown").required(),
            bank: joi.string().trim().min(2).max(50).required(),
            app: joi.string().valid("phonepe", "paytm").required()
        }).min(1).required()
    },
    "POST /api/expenses/predictions": {
        body: joi.object({
            signature: joi.string().trim().min(8).max(128).required(),
            source: joi.string().valid("bank_modal", "payment_app_modal").required(),
            bank: joi.object({
                description: joi.string().trim().min(2).max(500).required()
            }).optional(),
            paymentApp: joi.object({
                recipient: joi.string().trim().min(2).max(500).required()
            }).optional(),
            output: joi.object({
                description: joi.string().trim().min(2).max(500).required(),
                category: joi.number().integer().required(),
                group: joi.number().integer().required()
            }).required()
        }).or('bank', 'paymentApp')
    },
    "POST /api/oakterremote/command": {
        body: joi.object({
            commandId: joi.string().trim().regex(/^[1-9]\d*$/).required(),
            remoteId: joi.alternatives().try(
                joi.number().integer().positive(),
                joi.string().trim().regex(/^[1-9]\d*$/)
            ).required()
        })
    }
};
