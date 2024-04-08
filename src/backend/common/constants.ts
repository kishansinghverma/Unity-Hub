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
        invalidJson: 'Bad Request: Invalid JSON',
        missingParams: 'Bad Request: Parameters Missing',
        duplicateRecord: 'Bad Request: Duplicate Record',
        fileExpected: 'Bad Request: File Expected',
        fileTypeMismatch: 'Bad Request: Only PDFs Allowed',
        unknownError: 'Something Went Wrong On Server',
        schemaNotReady: 'Internal Error: Validation Schema Not Found'
    },
    message: {
        serviceOk: 'Service Ok',
        initializeDb: 'Database Initialized...'
    },
    adminDb: 'admin'
};

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