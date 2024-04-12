export const constants = {
    emandi: {
        database: 'E-Mandi',
        collections: {
            queued: 'Queued',
            processed: 'Processed',
            parties: 'Parties',
            transactions: 'Transactions'
        }
    },
    errors: {
        genericError: "ServerFault",
        customError: "CustomError",
        mongoError: "DatabaseError",
        validationError: "ValidationError",
        multerError: "UploadError",
        invalidJson: 'Invalid JSON',
        missingParams: 'Parameters Missing',
        fileExpected: 'File Expected',
        fileTypeMismatch: 'Only PDFs Allowed',
        unknownError: 'Something Went Wrong On Server',
        schemaNotReady: 'Validation Schema Not Found'
    },
    message: {
        serviceOk: 'Service Ok',
        ping: 'Recieved Ping: Health Normal'
    },
    adminDb: 'admin'
};

export const templates = {
    gatepassCreated: 'Gatepass requested for ${name}, ${mandi}, ${state}. Proceed here : https://emandi.up.gov.in/Traders/Dashboard'
}

export const mongoErrorCodes: { [key: string]: number } = {
    8: 500,
    8000: 401,
    11000: 409
}

export enum source {
    server = 'Server',
    route = 'Route'
}

export enum style {
    none = 'visible',
    bold = 'bold',
    dim = 'dim',
    italic = 'italic',
    underline = 'underline',
    strikethrough = 'strikethrough'
}

export const postParams = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
}