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
        schemaNotReady: 'Validation Schema Not Found',
        mqttNotReady: 'Mqtt Service Not Ready',
        timeLimitExceeded: "Max Wait Time Exceeded",
    },
    message: {
        serviceOk: 'Service Ok',
        ping: 'Recieved Ping: Health Normal',
        mqttConnected: "Connected to Mqtt Server!",
        mqttDisconnected: "Disconnected from Mqtt Server",
        printerSubscribed: "Subscribed to Printer Status Feeds",
        mqttPublished: "Mqtt Message Published Successfully",
        cronJobRegistered: 'Cron Jobs Registered!'
    },
    adminDb: 'admin'
};

export const templates = {
    gatepassCreated: 'Gatepass requested for ${name}, ${mandi}, ${state}. Proceed here : https://emandi.up.gov.in/Traders/Dashboard'
}

export const greenApi = {
    groupId: {
        emandi: '120363153442141119@g.us',
        unityHub: '120363265204710984@g.us'
    }
}

export const mongoErrorCodes: { [key: string]: number } = {
    8: 500,
    8000: 401,
    11000: 409
}

export enum source {
    server = 'Server',
    route = 'Route',
    mqtt = 'Mqtt',
    smartnest = 'SmartNest',
    cronjob = 'CronJob',
    assistant = 'GoogleAssistant',
    smarthome = 'SmartHome'
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

export const mimeType: { [key: string]: string } = {
    pdf: 'application/pdf',
    zip: 'application/zip',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    any: 'application/x-binary'
}