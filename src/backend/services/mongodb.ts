import 'dotenv/config';
import { Collection, Db, Document, Filter, FindOptions, MongoClient } from "mongodb";
import { constants } from "../common/constants";
import { CollectionOperation, DatabaseOperation } from "../common/types";
import { String, Throwable } from "../common/models";

export class MongoDbService {
    private database: string;
    private connectionString = process.env.MONGO_CONNECTION_STRING as string;
    public emptyResponse = { content: null, statusCode: 404 };

    constructor(database: string) {
        this.database = database;
    }

    getClientWithDatabase = (database = this.database) => {
        const client = new MongoClient(this.connectionString);
        return { client: client, database: client.db(database) };
    }

    getClientWithCollection = (collectionName: string) => {
        const { client, database } = this.getClientWithDatabase();
        return { client: client, collection: database.collection(collectionName) };
    };

    executeOperationOnCollection = async (collectionName: string, operation: CollectionOperation) => {
        const { client, collection } = this.getClientWithCollection(collectionName);
        try { return await operation(collection) }
        finally { await client.close() };
    }

    executeOperationOnDatabase = async (operation: DatabaseOperation) => {
        const { client, database } = this.getClientWithDatabase();
        try { return await operation(database) }
        finally { await client.close() };
    }

    getDocument = (collectionName: string, filter: Filter<Document>, options: FindOptions<Document>) => {
        const operation = async (collection: Collection) => {
            const data = await collection.findOne(filter, options);
            return ({ content: data, statusCode: data ? 200 : 204 });
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    getDocuments = (collectionName: string, filter: Filter<Document>, options: FindOptions<Document>) => {
        const operation = async (collection: Collection) => {
            const response = await collection.find(filter, options).toArray();
            return { content: response, statusCode: 200 };
        };

        return this.executeOperationOnCollection(collectionName, operation);
    };

    insertDocument = (collectionName: string, document: Document) => {
        const operation = async (collection: Collection) => {
            const { insertedId } = await collection.insertOne(document);
            return { content: { insertedId }, statusCode: 201 };
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    deleteDocument = (collectionName: string, documentId: string) => {
        const operation = async (collection: Collection) => {
            const { deletedCount } = await collection.deleteOne({ _id: String.mongoId(documentId) });
            return (deletedCount > 0 ? { content: { _id: documentId }, statusCode: 200 } : this.emptyResponse);
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    updateDocumentById = (collectionName: string, documentId: string, patchData: Document) => {
        const operation = async (collection: Collection) => {
            const { matchedCount } = await collection.updateOne({ _id: String.mongoId(documentId) }, { $set: patchData });
            return (matchedCount > 0 ? { content: { _id: documentId }, statusCode: 200 } : this.emptyResponse);
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    updateDocument = (collectionName: string, document: Document) => {
        const { _id, ...patchData } = document;
        if (!_id || Object.keys(patchData).length < 1) return Promise.reject(new Throwable(constants.errors.missingParams, 400));
        return this.updateDocumentById(collectionName, _id, patchData);
    }

    moveDocument = (sourceCollection: string, targetCollection: string, filter: Filter<Document>, options: any) => {
        const operation = async (database: Db) => {
            const record = await database.collection(sourceCollection).findOneAndDelete(filter, options);
            if (record) await database.collection(targetCollection).insertOne(record);
            return (record ? { content: record, statusCode: 200 } : this.emptyResponse);
        }

        return this.executeOperationOnDatabase(operation);
    }
}