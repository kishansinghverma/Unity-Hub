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

export type RawExpense = {
    Id: string
    DateTime: string,
    Location: string,
    Coordinate: string
    OnDelete: Function
}

export type CustomCardProps = {
    ImageSrc: string,
    Name: string,
    Info: string
}
export interface Group {
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
}
export interface SplitwiseGroupResponse {
    group: Group
}
export interface SplitwiseGroupsResponse {
    groups: Array<Group>
}

export type SplitwiseGroup = {
    Id: number,
    Name: string,
    Avatar: string,
    Due: string
}

export type ModalParams = {
    GroupId?: number,
    ExpenseId?: string,
    AvatarLink?: string,
    Name?: string,
    DateTime?: string,
    Location?: string,
    Description?: string,
    Amount?: string
}