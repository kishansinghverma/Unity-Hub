
import { Collection, Document } from "mongodb";
import { constants as invariants } from "../common/constants";
import { MongoDbService } from "../services/mongodb";
import { ObjectUtils } from "../common/models";
import { GroupInfoRequest } from "../common/types";

class Expenses {
    private constants = invariants.expense;
    private database: MongoDbService;

    constructor() {
        this.database = new MongoDbService(this.constants.database);
    }

    public getTransactions = () => this.database.getDocuments(this.constants.collection.draft, {}, {});

    public addTransaction = (transaction: Document) => this.database.insertDocument(this.constants.collection.draft, transaction);

    public getLastRefinementDate = () => this.database.getDocument(this.constants.collection.meta, { name: 'Modified On' }, {});

    public getDescriptions = () => this.database.getDocument(this.constants.collection.meta, { name: 'Descriptions' }, {});

    public getGroup = async (groupId: number) => {
        const response = await this.database.getDocument(this.constants.collection.meta, { name: 'Groups' }, {
            projection: { value: { $elemMatch: { id: groupId } }, _id: 0 }
        });

        return response?.content?.value ? { ...response, content: response.content.value[0] } : this.database.emptyResponse;
    }

    public getGroupSharing = async (groupId: number) => {
        const response = await this.getGroup(groupId);
        return ObjectUtils.isEmpty(response.content) ? response : { ...response, content: { isShared: response.content.isShared } };
    }

    public updateGroupInfo = async (groupInfo: GroupInfoRequest) => {
        const groupResponse = await this.getGroup(groupInfo.id);
        if (ObjectUtils.isEmptyResponse(groupResponse)) {
            const query = { name: 'Groups' };
            const patchData = { $addToSet: { value: groupInfo } };
            return this.database.patchDocument(this.constants.collection.meta, patchData, query, {});
        } else {
            const query = { name: 'Groups', "value.id": groupInfo.id };
            const patchData = { $set: { "value.$.isShared": groupInfo.isShared } }
            return this.database.patchDocument(this.constants.collection.meta, patchData, query, {});
        }
    }

    public addDescription = (item: string) => {
        const query = { name: 'Descriptions' };
        const patchData = { $addToSet: { value: item } };
        return this.database.patchDocument(this.constants.collection.meta, patchData, query, {});
    }

    public deleteTransaction = (id: string) => {
        this.database.patchDocument(this.constants.collection.meta, { $set: { value: new Date().getTime() } }, { name: 'Modified On' }, {});
        return this.database.deleteDocument(this.constants.collection.draft, id);
    }

    public initializeDatabase = () => {
        const operation = async (collection: Collection) => {
            const actions = [];
            const options = { upsert: true, returnOriginal: false };

            // Initialize Last Refinement Date Document
            const patchData = { $setOnInsert: { value: new Date().getTime() } };
            const response = await collection.findOneAndUpdate({ name: 'Modified On' }, patchData, options);
            actions.push({ lastRefinement: { insertedId: response?._id }, statusCode: 200 });

            // Initialize Description Array
            const descPatchData = { $setOnInsert: { value: [] } };
            const descResponse = await collection.findOneAndUpdate({ name: 'Descriptions' }, descPatchData, options);
            actions.push({ descriptions: { insertedId: descResponse?._id }, statusCode: 200 });

            return { content: actions, statusCode: 200 };
        }

        return this.database.executeOperationOnCollection(this.constants.collection.meta, operation);
    }
}

export const expenses = new Expenses();