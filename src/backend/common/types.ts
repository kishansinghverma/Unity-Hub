import { Collection, Db, Document, WithId } from "mongodb";

export type CollectionOperation = (collection: Collection) => Promise<ExecutionResponse>;

export type DatabaseOperation = (database: Db) => Promise<ExecutionResponse>;

export type OperationResponse = Promise<ExecutionResponse>;

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