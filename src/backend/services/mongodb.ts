import { Collection, Db, Document, Filter, FindOptions, MongoClient } from "mongodb";
import { constants } from "../common/constants";
import { mongoId } from "../common/utils";
import { CustomError, String } from "../common/models";
import { CollectionOperation, DatabaseOperation } from "../common/types";

export class MongoDb {
    private database: string;

    constructor(database: string) {
        this.database = database;
    }

    getClientWithDatabase = (database = this.database) => {
        const client = new MongoClient(process.env.MONGO_CONNECTION_STRING || String.empty);
        return { client: client, database: client.db(database) };
    }

    getClientWithCollection = (collectionName: string) => {
        const { client, database } = this.getClientWithDatabase();
        return { client: client, collection: database.collection(collectionName) };
    };

    executeOperationOnCollection = async(collectionName: string, operation: CollectionOperation) => {
        const { client, collection } = this.getClientWithCollection(collectionName);
        try {
            const response = await operation(collection);
            return response;
        }
        catch (err: any) {
            return CustomError.handleErrorAndGetResponse(err);
        }
        finally {
            client.close();
        };
    }

    executeOperationOnDatabase = async (operation: DatabaseOperation) => {
        const { client, database } = this.getClientWithDatabase();
        try {
            const response = await operation(database);
            return response;
        }
        catch (err: any) {
            return CustomError.handleErrorAndGetResponse(err);
        }
        finally {
            client.close();
        };
    }

    getDocument = async (collectionName: string, filter: Filter<Document>, options: FindOptions<Document>) => {
        const operation = async (collection: Collection) => {
            const data = await collection.findOne(filter, options);
            return { content: data, statusCode: data ? 200 : 404 };
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    getDocuments = async (collectionName: string, filter: Filter<Document>, options: FindOptions<Document>) => {
        const operation = async (collection: Collection) => {
            const response = await collection.find(filter, options).toArray();
            return { content: response, statusCode: 200 };
        };

        return this.executeOperationOnCollection(collectionName, operation);
    };

    insertDocument = async (collectionName: string, document: Document) => {
        const operation = async (collection: Collection) => {
            const { insertedId } = await collection.insertOne(document);
            return { content: { insertedId }, statusCode: 201 };
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    deleteDocument = async (collectionName: string, recordId: string) => {
        const operation = async (collection: Collection) => {
            const { deletedCount } = await collection.deleteOne({ _id: mongoId(recordId) });
            return (deletedCount > 0 ? { content: { _id: recordId }, statusCode: 200 } : { content: null, statusCode: 404 });
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    updateDocumentById = async (collectionName: string, documentId: string, patchData: Document) => {
        const operation = async (collection: Collection) => {
            const { modifiedCount } = await collection.updateOne({ _id: mongoId(documentId) }, { $set: patchData });
            return { content: { modifiedCount }, statusCode: 200 };
        }

        return this.executeOperationOnCollection(collectionName, operation);
    };

    updateDocument = async (collectionName: string, document: Document) => {
        const { _id, ...patchData } = document;
        return (_id && Object.keys(patchData).length > 0) ?
            this.updateDocumentById(collectionName, _id, patchData) :
            { content: constants.errors.missingParams, statusCode: 400 };
    }

    moveDocument = async (sourceCollection: string, targetCollection: string, filter: Filter<Document>, options: any) => {
        const operation = async (database: Db) => {
            const record = await database.collection(sourceCollection).findOneAndDelete(filter, options);
            if (record) await database.collection(targetCollection).insertOne(record);
            return { content: record, statusCode: record ? 200 : 404 };
        }

        return this.executeOperationOnDatabase(operation);
    }
}