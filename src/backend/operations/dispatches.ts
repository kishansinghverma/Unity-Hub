import { Collection, Db, Document } from "mongodb";
import { greenApi, constants as globalConstants, templates } from "../common/constants";
import { MongoDbService } from "../services/mongodb";
import { String } from "../common/models";
import { getErrorResponse, getHttpCode } from "../common/utils";
import { whatsAppService } from "../services/whatsapp";
import { FinalizeDispatchRequest } from "../common/types/request/FinalizeDispatchRequest";

class Dispatches {
    private constants = globalConstants.emandi;
    private database: MongoDbService;

    constructor() {
        this.database = new MongoDbService(this.constants.database);
    }

    public peekDispatch = () => this.database.getDocument(this.constants.collections.queued, {}, { sort: { createdOn: 1 } });

    public popDispatch = () => this.database.moveDocument(this.constants.collections.queued, this.constants.collections.processed, {}, { sort: { createdOn: 1 } });

    public getQueuedDispatches = () => this.database.getDocuments(this.constants.collections.queued, {}, { sort: { createdOn: 1 } });

    public getProcessedDispatches = () => this.database.getDocuments(this.constants.collections.processed, {}, { sort: { createdOn: 1 } });

    public deleteQueuedDispatch = (recordId: string) => this.database.deleteDocument(this.constants.collections.queued, recordId);

    public requeueDispatch = (recordId: string) => this.database.moveDocument(this.constants.collections.processed, this.constants.collections.queued, { _id: String.mongoId(recordId) }, {});

    public queueDispatch = async (record: Document) => {
        const response = await this.database.insertDocument(this.constants.collections.queued, { ...record, createdOn: String.getEpoch() });
        const notificationResponse = await whatsAppService.sendMessage(greenApi.groupId.emandi, String.getTaggedString(templates.gatepassCreated, record.party)).catch(getErrorResponse);
        response.content.notification = notificationResponse.content;
        return response;
    };

    public finalize = async ({ gatepassId, ninerId, rate }: FinalizeDispatchRequest) => {
        const patchData: Document = {};
        if (gatepassId !== undefined) patchData.gatepassId = gatepassId;
        if (ninerId !== undefined) patchData.ninerId = ninerId;
        if (rate !== undefined) patchData.rate = rate;

        const operation = async (database: Db) => {
            const record = await database.collection(this.constants.collections.queued).findOneAndDelete({}, { sort: { createdOn: 1 } });
            if (!record) return this.database.emptyResponse;
            
            const { insertedId } = await database.collection(this.constants.collections.processed).insertOne({ ...record, ...patchData });
            return { content: { insertedId }, statusCode: 200 };
        }

        return this.database.executeOperationOnDatabase(operation);
    };

    public addParty = (record: Document) => this.database.insertDocument(this.constants.collections.parties, record);

    public getParties = () => this.database.getDocuments(this.constants.collections.parties, {}, { sort: { name: 1 } });

    public updateParty = (partyId: string, record: Document) => this.database.updateDocumentById(this.constants.collections.parties, partyId, record);

    public deleteParty = (partyId: string) => this.database.deleteDocument(this.constants.collections.parties, partyId);

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
        const response = { time: time, apiServer: { status: globalConstants.message.serviceOk, code: 200 } };
        const operation = async (database: Db) => {
            const { content, statusCode } = await database.command({ ping: 1 })
                .then(() => ({ content: globalConstants.message.serviceOk, statusCode: 200 }))
                .catch((err) => ({ content: err.message, statusCode: getHttpCode(err) }));
            return { content: { ...response, mongoServer: { status: content, code: statusCode } }, statusCode: 200 };
        }

        return await this.database.executeOperationOnDatabase(operation);
    }
}

export const dispatches = new Dispatches();
