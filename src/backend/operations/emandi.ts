import { Collection, Db, Document } from "mongodb";
import { greenApi, constants as invariants, templates } from "../common/constants";
import { MongoDbService } from "../services/mongodb";
import { String } from "../common/models";
import { getErrorResponse, getHttpCode } from "../common/utils";
import { whatsAppService } from "../services/whatsapp";

class EMandi {
    private constants = invariants.emandi;
    private database: MongoDbService;

    constructor() {
        this.database = new MongoDbService(this.constants.database);
    }

    public peekRecord = () => this.database.getDocument(this.constants.collections.queued, {}, { sort: { createdOn: 1 } });

    public getQueued = () => this.database.getDocuments(this.constants.collections.queued, {}, { sort: { createdOn: 1 } });

    public getProcessed = () => this.database.getDocuments(this.constants.collections.processed, {}, { sort: { createdOn: 1 } });

    public getParties = () => this.database.getDocuments(this.constants.collections.parties, {}, { sort: { name: 1 } });

    public deleteRecord = (recordId: string) => this.database.deleteDocument(this.constants.collections.queued, recordId);

    public addParty = (record: Document) => this.database.insertDocument(this.constants.collections.parties, record);

    public updateParty = (record: Document) => this.database.updateDocument(this.constants.collections.parties, record);

    public deleteParty = (partyId: string) => this.database.deleteDocument(this.constants.collections.parties, partyId);

    public requeueRecord = (recordId: string) => this.database.moveDocument(this.constants.collections.processed, this.constants.collections.queued, { _id: String.mongoId(recordId) }, {});

    public popRecord = () => this.database.moveDocument(this.constants.collections.queued, this.constants.collections.processed, {}, { sort: { createdOn: 1 } });

    public queueRecord = async (record: Document) => {
        const response = await this.database.insertDocument(this.constants.collections.queued, { ...record, createdOn: String.getEpoch() });
        const notificationResponse = await whatsAppService.sendMessage(greenApi.groupId.emandi, String.getTaggedString(templates.gatepassCreated, record.party)).catch(getErrorResponse);
        response.content.notification = notificationResponse.content;
        return response;
    };

    public updateRecordAtHead = async ({ finalize, ...patchData }: { finalize: boolean }) => {
        const operation = async (database: Db) => {
            if (finalize) {
                const record = await database.collection(this.constants.collections.queued).findOneAndDelete({}, { sort: { createdOn: 1 } });
                if (!record) return this.database.emptyResponse;
                const { insertedId } = await database.collection(this.constants.collections.processed).insertOne({ ...record, ...patchData });
                return { content: { insertedId }, statusCode: 200 };
            }
            else {
                const updatedRecord = await database.collection(this.constants.collections.queued).findOneAndUpdate({}, { $set: patchData }, { sort: { createdOn: 1 } });
                return (updatedRecord ? { content: { _id: updatedRecord._id }, statusCode: 200 } : this.database.emptyResponse);
            }
        }
        return this.database.executeOperationOnDatabase(operation);
    };

    public initializeDatabase = async () => {
        // Creates index on collections.
        const operation = async (collection: Collection) => {
            const index = await collection.createIndex({ name: 1, mandi: 1, state: 1 }, { unique: true });
            return { content: { actions: [{ index }] }, statusCode: 200 };
        }

        const createIndex = async (collecion: Collection) => {
            const index = await collecion.createIndex({ createdOn: 1 });
            return { content: { actions: [{ index }] }, statusCode: 200 };
        }

        await this.database.executeOperationOnCollection(this.constants.collections.processed, createIndex);
        await this.database.executeOperationOnCollection(this.constants.collections.queued, createIndex);
        return this.database.executeOperationOnCollection(this.constants.collections.parties, operation);
    }

    public validateInstance = async () => {
        const time = new Date().toLocaleString();
        const response = { time: time, apiServer: { status: invariants.message.serviceOk, code: 200 } };
        const operation = async (database: Db) => {
            const { content, statusCode } = await database.command({ ping: 1 })
                .then(() => ({ content: invariants.message.serviceOk, statusCode: 200 }))
                .catch((err) => ({ content: err.message, statusCode: getHttpCode(err) }));
            return { content: { ...response, mongoServer: { status: content, code: statusCode } }, statusCode: 200 };
        }

        return await this.database.executeOperationOnDatabase(operation);
    }
}

export const eMandi = new EMandi();