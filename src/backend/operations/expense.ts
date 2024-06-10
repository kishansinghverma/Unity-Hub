
import { Collection, Document } from "mongodb";
import { constants as invariants } from "../common/constants";
import { MongoDbService } from "../services/mongodb";

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
            actions.push( { lastRefinement: { insertedId: response?._id }, statusCode: 200 });

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