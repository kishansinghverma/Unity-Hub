import { Collection, Db, Document, WithId } from "mongodb";

export type CollectionOperation = (collection: Collection) => Promise<ExecutionResponse>;

export type DatabaseOperation = (database: Db) => Promise<ExecutionResponse>;

export type OperationResponse = Promise<ExecutionResponse>;

export type CustomDevice = { [key: string]: { [key: string]: Array<string> } };

export type NestDevice = { [key: string]: { GroupId: string, DeviceId: string } };

export type Action = {
    device: string,
    query: string
};

export type MqttPacket = {
    topic: string,
    message: string
};

export type ExecutionResponse = {
    content: any,
    statusCode: number
}

export type CreatePdfRequest = {
    name: string,
    tables: string,
    qr: string,
    print: boolean,
    forceDownload: boolean,
    party: string,
    driverMobile: string
};

export type IncomingMessage = {
    typeWebhook: "incomingMessageReceived";
    senderData: { chatId: string; }
    messageData: {
        typeMessage: "textMessage" | "documentMessage";
        textMessageData?: { textMessage: string; };
        fileMessageData?: {
            downloadUrl: string;
            caption: string;
            mimeType: string;
        }
    };
};

export type GroupExpenseRequest = {
    group_id: number
    details: string,
    description: string,
    cost: string,
    date?: string,
    shared?: string,
    debitFrom?: string
}

export type SelfPaidExpense = {
    date?: string,
    cost: string,
    details: string,
    group_id: number
    description: string,
    users__0__user_id: number,
    users__0__paid_share: string,
    users__0__owed_share: string,
    users__1__user_id: number,
    users__1__paid_share: string,
    users__1__owed_share: string,
}

export type SharedExpense = {
    date?: string, 
    group_id: number,
    details: string,
    description: string,
    cost: string,
    split_equally: boolean
};