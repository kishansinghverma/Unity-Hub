import { SelectOption } from "./types";

export enum SharingStatus {
    Unknown = -1,
    Shared = 1,
    NotShared = 0
};

export const pages = {
    root: { route: '/emandi' },
    newEntry: { label: 'New', route: '/emandi/new' },
    addParty: { label: 'Add Party', route: '/emandi/addparty' },
    queued: { label: 'Queued', route: '/emandi/queued' },
    processed: { label: 'Processed', route: '/emandi/processed' },
    parties: { label: 'Parties', route: '/emandi/parties' },
    expenses: { label: 'Expenses', route: '/emandi/expenses' }
}

export const VehicleTypeOptions: Array<SelectOption> = [
    { key: 'vt1', value: '1', text: 'Truck' },
    { key: 'vt2', value: '2', text: 'Pickup' },
    { key: 'vt3', value: '4', text: 'DCM' }
]

export const vehicleType: { [key: string]: string } = {
    "1": "Truck",
    "2": "Pickup",
    "4": "DCM"
};

export const Url = {
    Parties: "/api/emandi/parties",
    Push: "/api/emandi/push",
    Processed: "/api/emandi/processed",
    Requeue: "/api/emandi/requeue",
    Queued: "/api/emandi/queued",
    Delete: "/api/emandi/entry",
    DraftExpenses: "/api/expenses",
    ExpenseLastRefinement: "/api/expenses/lastrefinement",
    ExpenseDescriptions: "/api/expenses/descriptions",
    AddDescriptions: "/api/expenses/description",
    ExpenseGroups: "/api/expenses/groups",
    FinalizeExpense: "/api/expenses/finalize",
    SettleExpense: "/api/splitwise/settlement",
    NotificationUrl: "/api/whatsapp/sendtext/unityhub",
    SplitWiseGroups: "/api/splitwise/groups",
    SplitWiseGroup: "/api/splitwise/group",
    SplitWiseExpenses: "/api/splitwise/transactions",
    BankStatement: "/api/expenses/statement/bank",
    PhonePeStatement: "/api/expenses/statement/phonepe",
    Distance: "https://dev.virtualearth.net/REST/V1/Routes/Driving?o=json&wp.0=sadabad&key=AhWAWkHKZZ0JtpBDWvq2_vZqrtmAgf3prbe31w7FbepXyGzvHoWzvpetsQIA7DpL&wp.1"
}

export const PostParams = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
}

export const PatchParams = {
    method: 'PATCH',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
}

export const DeleteParams = {
    method: 'DELETE'
}

export const HttpStatusCode: { [key: number]: string } = {
    200: 'Operation Successfull.',
    201: 'Record Created Successfully.',
    401: 'Authorization Error!',
    500: 'Something Wrong On Server!',
    501: 'Method Not Implemented!',
    404: 'Resource Not Found!',
    400: 'Bad Request!',
    409: 'Duplicate Record!'
}

export const TransactionMetaData: { [key: string]: { Account: string, Type: string } } = {
    "Debited from XX0041": { Account: "HDFC", Type: "Debit" },
    "Debited from XX6026": { Account: "SBI", Type: "Debit" },
    "Credited to XX0041": { Account: "HDFC", Type: "Credit" },
    "Credited to XX6026": { Account: "SBI", Type: "Credit" }
}

export const States: { [key: string]: string } = {
    "1": "Uttar Pradesh",
    "2": "Uttarakhand",
    "3": "Haryana",
    "4": "Jharkhand",
    "5": "Rajasthan",
    "6": "Maharashtra",
    "7": "Madhya Pradesh",
    "8": "Chhattishgarh",
    "9": "Bihar",
    "10": "Andhra Pradesh",
    "11": "Arunanchal Pradesh",
    "12": "Assam",
    "13": "Chandigarh",
    "14": "Dadar & Nagar Haveli",
    "15": "Daman & Diu",
    "16": "Delhi",
    "17": "Goa",
    "18": "Gujrat",
    "19": "Himanchal Pradesh",
    "20": "Jammu & Kashmir",
    "21": "Karnataka",
    "22": "Kerala",
    "23": "Lakshadweep",
    "24": "Manipur",
    "25": "Meghalaya",
    "26": "Mizoram",
    "27": "Nagaland",
    "28": "Odisha",
    "29": "Puducherry",
    "30": "Punjab",
    "31": "Sikkim",
    "32": "Tamil Nadu",
    "33": "Tripura",
    "34": "West Bengal",
    "35": "Andaman & Nicobar Islands",
    "36": "Telangana",
    "37": "Nepal"
}