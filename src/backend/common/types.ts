import { Collection, Db, Document, WithId } from "mongodb";

export type CollectionOperation = (collection: Collection) => Promise<ExecutionResponse>;

export type DatabaseOperation = (database: Db) => Promise<ExecutionResponse>;

export type ExecutionResponse = {
    content: any,
    statusCode: number
}