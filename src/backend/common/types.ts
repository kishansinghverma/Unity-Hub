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