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

export type EntryImages = {
    vehicleImage?: File;
    numberPlateImage?: File;
};

export type Coordinates = {
    latitude: number;
    longitude: number;
};

export type QueuedEntry = EntryImages & {
    date: string;
    seller: string;
    weight: string;
    vehicleNumber: string;
    vehicleType: string;
    bags: string;
    party: Party;
    latitude?: number;
    longitude?: number;
}

export type ProcessedEntry = {
    paymentMode: string;
    rate: any;
} & QueuedEntry;
