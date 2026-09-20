import { Collection, Db } from "mongodb";

export type CollectionOperation = (collection: Collection) => Promise<ExecutionResponse>;

export type DatabaseOperation = (database: Db) => Promise<ExecutionResponse>;

export type OperationResponse = Promise<ExecutionResponse>;

export type CustomDevice = { [key: string]: { [key: string]: Array<string> } };

export type NestDevice = { [key: string]: { GroupId: string, DeviceId: string } };

export type KeyVaultEntry = {
    key: string;
    secret: string;
};

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

export type HtmlDocumentData = {
    tables: string[];
    qr: string;
};

export type GatepassDocumentRequest = {
    source:
        | { type: "latest" }
        | { type: "id", gatepassId: string, date: string }
        | { type: "html", party: string, tables: string[], qr: string };
    print: boolean;
    download: boolean;
    share: boolean;
};

export type NinerDocumentRequest = {
    source:
        | { type: "latest" }
        | { type: "id", ninerId: string, date: string }
        | { type: "html", party: string, tables: string[], qr: string };
    print: boolean;
    download: boolean;
    share: boolean;
};

export type GatepassQrData = {
    serialNumber: string;
    issueFrom: string;
    crop: string;
    weight: string;
    vehicleNumber: string;
    applicationNumber: string;
    issueDate: string;
    issueTime: string;
};

export type NinerQrData = {
    serialNumber: string;
    mandi: string;
    crop: string;
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

export type PaymentAppTransaction = {
    date: Date,
    recipient: string,
    transactionId: string,
    utr: string,
    bank: string | "SBI" | "HDFC"
    type: string | "Credit" | "Debit",
    amount: number
}

export type PaymentAppStatementRequest = Array<PaymentAppTransaction>;

export type PredictionSource = "bank_modal" | "payment_app_modal";

export type PredictionBankInput = {
    description: string;
};

export type PredictionPaymentAppInput = {
    recipient: string;
};

export type PredictionOutput = {
    description: string;
    category: number;
    group: number;
};

export type PredictionRequest = {
    signature: string;
    source: PredictionSource;
    bank?: PredictionBankInput;
    paymentApp?: PredictionPaymentAppInput;
    output: PredictionOutput;
};

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
    bankTxnId?: string
    appTxnId?: string
    locationTxnId?: string
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

export type EmandiCredentials = {
    username: string;
    password: string;
};

export type EMandiSession = {
    username: string;
    role: string;
    authenticatedAt: string;
    expiresAt: string;
};

export type EMandiSessionInfo = Partial<EMandiSession> & {
    authenticated: boolean;
    isExpired: boolean;
    cookieCount: number;
};

export type RequestConfig = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  redirect?: RequestRedirect;
};

export type LoginToken = {
    requestToken: string;
    captchaImageUrl: string;
    captchaText: string;
    captchaToken: string;
};

export type LoginResponse = {
    succeeded?: boolean;
    role?: string;
    message?: string;
};

export type EMandiQuery = {
    id?: string;
    date?: string;
    limit?: number;
    fromDate?: string;
    toDate?: string;
};

export type EMandiGatepass = {
    id: string;
    book_number: string;
    serial_number: string;
    trader_license_number: string | null;
    dateofissue: string;
    timeofissue: string;
    nine_r_id: string;
    dist_todestination: string;
    home_center: string;
    center_code: string | null;
    dateofdestination: string;
    timeofdestination: string | null;
    receiver_name_add: string | null;
    kreta_mandi: string;
    status: string;
    created_at: string;
    updated_at: string | null;
    bundle_no: string;
    vehicle: string;
    vehicle_no: string;
    mandi_code: string | null;
    ack: string;
    self_generate: string;
    remark: string | null;
    action_date: string | null;
    action_by: string | null;
    ip_address: string | null;
    desg_code: string | null;
    action_time: string | null;
    user_id: string | null;
    ack_date: string | null;
    ack_by: string | null;
    ack_time: string | null;
    page_no: string | null;
    kreta_mandi1: string | null;
    destination_state: string;
    lstMandi: unknown | null;
    lstNineR: unknown | null;
    lstVehicleType: unknown | null;
    qrcode: string | null;
    trader_name: string;
    crop_name: string;
    crop_weight: string;
    traderfullinfo: string;
    qty_parameter: string | null;
    crop_type: string;
    avg_speed: string;
    uname: string;
    contact: string;
    designation: string | null;
    mandi_name: string;
    crop_name_hi: string;
    estimated_travel_time: string;
    vikreta_details: unknown | null;
    kreta_details: unknown | null;
    kreta_mandiName: string | null;
    uniquecode: string;
    exportType: string;
    qrImage: string | null;
    nine_r_date: string | null;
    paidType: string | null;
    crop_code: string | null;
    lstState: unknown | null;
    isUnpaidAuto: number;
    gatepassValidityStaus: string;
    isExpiry: number;
    isRejected: number;
    proRejection: number;
    issuerName: string;
    stateName: string;
    niner_number: string | null;
    latitude: string;
    longitude: string;
    taggingDate: string;
    isBeforeDateFromSetDate: string;
    isVehicleTagging: string;
    vehicleTaggingRemark: string;
    vehicleImage: string | null;
    vehicleFullImage: string | null;
    gatepassIssueDate: string | null;
};

export type EMandiNiner = {
    id: string;
    book_number: string;
    serial_number: string;
    crop_code: string;
    trade_mandi: string;
    dateofissue: string;
    trader_license_number: string;
    kreta_details: string;
    vikreta_details: string;
    crop_weight: string;
    crop_rate: string;
    crop_amount: string;
    total_tax: string;
    total_amount: string;
    mandi_name: string;
    trader_name: string;
    mandi_code: string | null;
    created_at: string;
    updated_at: string | null;
    crop_type: string;
    qty_parameter: string | null;
    six_r_id: string;
    buyer_license_no: string;
    buyer_state: string;
    status: string;
    rem_amount: string | null;
    mandi_fee: string;
    dev_fee: string;
    weighing_fee: string;
    commission_fee: string;
    porter_fee: string;
    tax: string;
    agent_fee: string;
    other_fee: string;
    lstCrop: unknown | null;
    qrcode: string | null;
    firm_name: string;
    crop_name_eng: string;
    mandi_name_eng: string;
    t_mandi_fee: string;
    t_dev_fee: string;
    t_weighing_fee: string;
    t_commission_fee: string;
    t_porter_fee: string;
    t_tax: string;
    t_agent_fee: string;
    t_other_fee: string;
    trader_type: string | null;
    cal_mandi_fee: string | null;
    cal_dev_fee: string | null;
    exportType: string;
    nineRDetails: unknown[];
    cropName: string | null;
    insturment_id: string | null;
    instumentAmount: string | null;
    qrImage: string | null;
    stockType: string | null;
    stockTypeCategory: string | null;
    payType: string | null;
    crop_name_hi: string | null;
    isFotkar: string;
    fotkarId: string;
    cancelactive: string;
    iscancel: string;
    vehicle: string | null;
    vehicle_no: string;
    lstVehicleType: unknown | null;
    vehicleName: string;
};

export type EMandiRecord = EMandiGatepass | EMandiNiner;
