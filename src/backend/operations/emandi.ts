import { Db, Document } from "mongodb";
import { constants as invariants } from "../common/constants";
import { MongoDb } from "../services/mongodb";
import { getEpoch, mongoId } from "../common/utils";

const constants = invariants.emandi;
const db = new MongoDb(constants.database);

export const queueRecord = (record: Document) => db.insertDocument(constants.collections.queued, { ...record, createdOn: getEpoch() });

export const peekRecord = () => db.getDocument(constants.collections.queued, {}, { sort: { createdOn: 1 } });

export const getQueued = () => db.getDocuments(constants.collections.queued, {}, { sort: { createdOn: 1 } });

export const getProcessed = () => db.getDocuments(constants.collections.processed, {}, { sort: { createdOn: 1 } });

export const getTransactions = () => db.getDocuments(constants.collections.transactions, {}, { sort: { createdOn: 1 } })

export const getParties = () => db.getDocuments(constants.collections.parties, {}, { sort: { name: 1 } });

export const deleteRecord = (recordId: string) => db.deleteDocument(constants.collections.queued, recordId);

export const addParty = (record: Document) => db.insertDocument(constants.collections.parties, record);

export const updateParty = (record: Document) => db.updateDocument(constants.collections.parties, record);

export const deleteParty = (partyId: string) => db.deleteDocument(constants.collections.parties, partyId);

export const requeueRecord = (recordId: string) => db.moveDocument(constants.collections.processed, constants.collections.queued, { _id: mongoId(recordId) }, {});

export const popRecord = () => db.moveDocument(constants.collections.queued, constants.collections.processed, {}, { sort: { createdOn: 1 } });

export const updateRecordAtHead = async ({ finalize, ...patchData }: { finalize: boolean }) => {
    const operation = async (database: Db) => {
        if (finalize) {
            const record = await database.collection(constants.collections.queued).findOneAndDelete({}, { sort: { createdOn: 1 } });
            if (!record) return { content: null, statusCode: 404 };
            const { insertedId } = await database.collection(constants.collections.processed).insertOne({ ...record, ...patchData });
            return { content: { insertedId }, statusCode: 200 };
        }
        else {
            const updatedRecord = await database.collection(constants.collections.queued).findOneAndUpdate({}, { $set: patchData }, { sort: { createdOn: 1 } });
            return { content: null, statusCode: updatedRecord ? 200 : 404 };
        }
    }
    return db.executeOperationOnDatabase(operation);
};

export const initializeDatabase = async () => {
    //Creates Index on Emandi Party Collection.
    const { client, collection } = db.getClientWithCollection(constants.collections.parties);
    await collection.createIndex({ name: 1, mandi: 1, state: 1 }, { unique: true });
    await client.close();
}

export const validateInstance = async () => {
    const time = new Date().toLocaleString();
    const response = { Time: time, ApiServer: invariants.message.serviceOk, MongoServer: invariants.message.serviceOk };
    const operation = async (database: Db) => {
        await database.command({ ping: 1 });
        return { content: response, statusCode: 200 };
    }

    const result = await db.executeOperationOnDatabase(operation);
    return result.statusCode === 200 ? result : { content: { ...response, MongoServer: result.content }, statusCode: 500 };
}