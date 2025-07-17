import { Collection, Db } from "mongodb";

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
};

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

export type BankTransaction = {
    date: Date,
    description: string,
    amount: number,
    type: "Credit" | "Debit",
    bank: "SBI" | "HDFC"
};

export type BankStatementRequest = Array<BankTransaction>;

export type PhonePeTransaction = {
    date: Date,
    recipient: string,
    transactionId: string,
    utr: string,
    bank: string | "SBI" | "HDFC"
    type: string | "Credit" | "Debit",
    amount: number
}

export type PhonePeStatementRequest = Array<PhonePeTransaction>;

export type GroupInfoRequest = {
    id: number,
    isShared: boolean
};

export type GroupExpenseRequest = {
    group_id: number,
    details: string,
    description: string,
    cost: string,
    date?: string,
    parties: Array<number>,
    shared: boolean,
    category: number
};

export type SettlementExpenseRequest = {
    group_id: number
    cost: string
    date: string
    parties: Array<number>
    details: string
    description: string
}

export type SelfPaidExpense = {
    date?: string;
    cost: string;
    details: string;
    group_id: number;
    description: string;
    category_id: number;
} & {
    [key: `users__${number}__user_id`]: number;
} & {
    [key: `users__${number}__paid_share`]: string;
} & {
    [key: `users__${number}__owed_share`]: string;
};

export type SettlementExpense = {
    date: string;
    cost: string;
    group_id: number;
    description: string;
    category_id: '18';
    payment: true;
    transaction_method: 'offline';
    creation_method: 'payment';
    settle_all: true;
    details: string;
    currency_code: 'INR';
} & {
    [key: `users__${number}__user_id`]: number;
} & {
    [key: `users__${number}__paid_share`]: string;
} & {
    [key: `users__${number}__owed_share`]: string;
};


export type SharedExpense = {
    date?: string;
    group_id: number;
    details: string;
    description: string;
    cost: string;
    split_equally: boolean
    category_id: number;
};