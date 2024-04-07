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
        unknownError: 'Something Went Wrong On Server'
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