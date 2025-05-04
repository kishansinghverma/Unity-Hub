import { ReactState } from "../operations/utils";

export type Record<T> = {
    _id: string
} & T;

export type IHeader = {
    title: string,
    refresh: Function,
    isFetching: boolean
}

export type ITable = {
    message: string
    headerColumns: number
}

export type Pagination = {
    colSpan: number;
    currentPage: ReturnType<typeof ReactState<number>>;
    pageCount: ReturnType<typeof ReactState<number>>;
}

export type Party = {
    name: string,
    mandi: string,
    state: string,
    stateCode: number,
    distance: number,
    licenceNumber: string
}

export type SelectOption = {
    key: string,
    value: string,
    text: string
}

export type FormInput = {
    value: string,
    name: string
}

export type QueuedEntry = {
    date: string;
    seller: string;
    weight: string;
    vehicleNumber: string;
    vehicleType: string;
    bags: string;
    party: Party
}

export type ProcessedEntry = {
    paymentMode: string;
    rate: any;
} & QueuedEntry;

export type ILoaderComponent = {
    isLoading: boolean
}

export type Resource = {
    travelDistance: number;
}

export type ResourceSet = {
    resources: Resource[];
}

export type DistanceResponse = {
    resourceSets: ResourceSet[];
    statusCode: number;
}

export type DraftEntry = {
    dateTime: string,
    location: string,
    coordinate: string,
    processed?: boolean,
    onDelete: Function
}

export type BankEntry = {
    date: Date,
    description: string,
    amount: number,
    processed?: boolean,
    type: "Credit" | "Debit",
    bank: "SBI" | "HDFC"
}

export type PhonePeEntry = {
    date: Date,
    recipient: string,
    transactionId: string,
    utr: string,
    processed?: boolean,
    bank: string | "SBI" | "HDFC"
    type: string | "Credit" | "Debit",
    amount: number
}

export type WithId<T> = { // replace with withId
    _id: string
} & T;

export type ReviewModalParams = {
    id?: string,
    bankEntries: Array<WithId<BankEntry>>,
    phonePeEntries: Array<WithId<PhonePeEntry>>,
    draftEntries: Array<WithId<DraftEntry>>,
    groups: Array<SplitwiseGroup>,
    onCompletion: (completionParams: ReviewCompletionParams) => void
}

export type ReviewCompletionParams = {
    bankTransactionId: string,
    phonePeTransactionId: string,
    draftTransactionId: string
}

export type GroupInfo = {
    id: number,
    name: string,
    isShared: boolean
}

export type GroupCardProps = {
    onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
} & CardInfoProps;

export type CardInfoProps = {
    id: number,
    imageSrc: string,
    name: string,
    due: string,
    getSharing: boolean
}
export type Group = {
    id: number;
    name: string;
    simplified_debts: Array<{
        from: number;
        to: number;
        amount: string;
    }>
    whiteboard: null;
    group_type: string;
    avatar: {
        large: string;
    };
    members: Array<Member>;
}

export type Member = {
    id: number;
    first_name: string;
    email: string;
}
export type SplitwiseGroupResponse = {
    group: Group;
}
export type SplitwiseGroupsResponse = {
    groups: Array<Group>;
}

export type SplitwiseGroup = {
    id: number,
    name: string,
    avatar: string,
    due: string,
    members: Array<Member>
}

export type ExpenseModalParams = {
    groupId?: number,
    expenseId?: string,
    avatarLink?: string,
    name?: string,
    dateTime?: string,
    location?: string,
    description?: string,
    amount?: string,
    shared?: boolean,
    parties?: Array<number>
}

export type Nullable<T> = T | undefined; 