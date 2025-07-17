import { Collection, Document } from "mongodb";
import { constants as invariants } from "../common/constants";
import { MongoDbService } from "../services/mongodb";
import { ObjectUtils } from "../common/models";
import { BankStatementRequest, BankTransaction, ExecutionResponse, GroupInfoRequest, PhonePeStatementRequest, PhonePeTransaction } from "../common/types";
import { splitwise } from "./splitwise";

class Expenses {
    private constants = invariants.expense;
    private database: MongoDbService;

    constructor() {
        this.database = new MongoDbService(this.constants.database);
    }

    public getTransactions = () => this.database.getDocuments(this.constants.collection.draft, {}, {});

    public getBankStatement = () => this.database.getDocuments(this.constants.collection.statement, {}, { sort: { date: 1 } });

    public getPhonePeStatement = () => this.database.getDocuments(this.constants.collection.phonepe, {}, { sort: { date: 1 } });

    public addTransaction = (transaction: Document) => this.database.insertDocument(this.constants.collection.draft, transaction);

    public getLastRefinementDate = () => this.database.getDocument(this.constants.collection.meta, { name: 'Modified On' }, {});

    public getDescriptions = () => this.database.getDocument(this.constants.collection.meta, { name: 'Descriptions' }, {});

    public updateBankStatement = async (statement: BankStatementRequest) => {
        const statementResponse = await this.getBankStatement();
        const existingTransactions: Array<BankTransaction> = statementResponse.content ?? [];
        const descriptions = existingTransactions.map(txn => (txn.description));
        const insertables = statement.filter(txn => !(descriptions.includes(txn.description)));

        const operation = async (collection: Collection) => {
            const result = { insertedCount: insertables.length, totalCount: statement.length };
            if (insertables.length === 0) return { content: result, statusCode: 200 };

            const response = await collection.insertMany(insertables);
            return { content: { ...result, ...response }, statusCode: 200 };
        }

        return this.database.executeOperationOnCollection(this.constants.collection.statement, operation);
    }

    public updatePhonePeStatement = async (statement: PhonePeStatementRequest) => {
        const statementResponse = await this.getPhonePeStatement();
        const existingTransactions: Array<PhonePeTransaction> = statementResponse.content ?? [];
        const records = existingTransactions.map(txn => (txn.utr));
        const insertables = statement.filter(txn => !(records.includes(txn.utr)));

        const operation = async (collection: Collection) => {
            const result = { insertedCount: insertables.length, totalCount: statement.length };
            if (insertables.length === 0) return { content: result, statusCode: 200 };

            const response = await collection.insertMany(insertables);
            return { content: { ...result, ...response }, statusCode: 200 };
        }

        return this.database.executeOperationOnCollection(this.constants.collection.phonepe, operation);
    }

    public addDescription = (item: string) => {
        const query = { name: 'Descriptions' };
        const patchData = { $addToSet: { value: item } };
        return this.database.patchDocument(this.constants.collection.meta, patchData, query, {});
    }

    public completeTransaction = (transactionId: string, collectionName: string) => {
        this.database.updateDocumentById(collectionName, transactionId, { processed: true });
    }

    public finalizeTransaction = (transaction: any) => {
        if (transaction.bankTxnId) this.completeTransaction(transaction.bankTxnId, this.constants.collection.statement);
        if (transaction.phonePeTxnId) this.completeTransaction(transaction.phonePeTxnId, this.constants.collection.phonepe);
        if (transaction.draftTxnId) this.completeTransaction(transaction.draftTxnId, this.constants.collection.draft);
        this.database.patchDocument(this.constants.collection.meta, { $set: { value: new Date().getTime() } }, { name: 'Modified On' }, {});
        return splitwise.addExpense(transaction);
    }

    public initializeDatabase = async () => {
        const createIndex = async (collection: Collection) => {
            const index = await collection.createIndex({ date: 1 });
            return { content: { actions: [{ index }] }, statusCode: 200 };
        }

        await this.database.executeOperationOnCollection(this.constants.collection.statement, createIndex);

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