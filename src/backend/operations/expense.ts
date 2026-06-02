import { Collection, Document } from "mongodb";
import { constants as invariants } from "../common/constants";
import { MongoDbService } from "../services/mongodb";
import { BankStatementRequest, BankTransaction, PaymentAppStatementRequest, PaymentAppTransaction, PredictionRequest } from "../common/types";
import { splitwise } from "./splitwise";

class Expenses {
    private constants = invariants.expense;
    private database: MongoDbService;

    constructor() {
        this.database = new MongoDbService(this.constants.database);
    }

    public getLocations = () => this.database.getDocuments(this.constants.collection.location, {}, { sort: {dateTime: 1} });

    public getBankStatement = () => this.database.getDocuments(this.constants.collection.bankStatement, {}, { sort: { date: 1 } });

    public getPaymentAppStatement = () => this.database.getDocuments(this.constants.collection.appStatement, {}, { sort: { date: 1 } });

    public getPredictions = () => this.database.getDocuments(this.constants.collection.prediction, {}, { sort: { updatedAt: -1 }, limit: 500 });

    public addLocation = (location: Document) => this.database.insertDocument(this.constants.collection.location, location);

    public addPrediction = (prediction: PredictionRequest) => {
        const now = new Date();
        const query = { signature: prediction.signature };
        const patchData = {
            $set: {
                source: prediction.source,
                bank: prediction.bank ?? null,
                paymentApp: prediction.paymentApp ?? null,
                output: prediction.output,
                signature: prediction.signature,
                updatedAt: now
            },
            $setOnInsert: { createdAt: now }
        };

        return this.database.patchDocument(this.constants.collection.prediction, patchData, query, { upsert: true });
    }

    public getReviewedOnDate = () => this.database.getDocument(this.constants.collection.meta, { name: 'Modified On' }, {});

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

        return this.database.executeOperationOnCollection(this.constants.collection.bankStatement, operation);
    }

    public updatePaymentAppStatement = async (statement: PaymentAppStatementRequest) => {
        const statementResponse = await this.getPaymentAppStatement();
        const existingTransactions: Array<PaymentAppTransaction> = statementResponse.content ?? [];
        const records = existingTransactions.map(txn => (txn.utr));
        const insertables = statement.filter(txn => !(records.includes(txn.utr)));

        const operation = async (collection: Collection) => {
            const result = { insertedCount: insertables.length, totalCount: statement.length };
            if (insertables.length === 0) return { content: result, statusCode: 200 };

            const response = await collection.insertMany(insertables);
            return { content: { ...result, ...response }, statusCode: 200 };
        }

        return this.database.executeOperationOnCollection(this.constants.collection.appStatement, operation);
    }

    public addDescription = (item: string) => {
        const query = { name: 'Descriptions' };
        const patchData = { $addToSet: { value: item } };
        return this.database.patchDocument(this.constants.collection.meta, patchData, query, {});
    }

    public completeTransaction = (transactionId: string, collectionName: string) => {
        this.setReviewedOnDate();
        return this.database.updateDocumentById(collectionName, transactionId, { processed: true });
    }

    public processBankTransaction = (transactionId: string) => this.completeTransaction(transactionId, this.constants.collection.bankStatement);

    public processPaymentAppTransaction = (transactionId: string) => this.completeTransaction(transactionId, this.constants.collection.appStatement);

    public processLocationTransaction = (transactionId: string) => this.completeTransaction(transactionId, this.constants.collection.location);

    public setReviewedOnDate = () => this.database.patchDocument(this.constants.collection.meta, { $set: { value: new Date().getTime() } }, { name: 'Modified On' }, {});

    public finalizeTransaction = (transaction: any) => {
        if (transaction.bankTxnId) this.database.updateDocumentById(this.constants.collection.bankStatement, transaction.bankTxnId, { processed: true });
        if (transaction.appTxnId) this.database.updateDocumentById(this.constants.collection.appStatement, transaction.appTxnId, { processed: true });
        if (transaction.locationTxnId) this.database.updateDocumentById(this.constants.collection.location, transaction.locationTxnId, { processed: true });
        this.setReviewedOnDate();
        return splitwise.addExpense(transaction);
    }

    public initializeDatabase = async () => {
        const createDateIndex = async (collection: Collection) => {
            const index = await collection.createIndex({ date: 1 });
            return { content: { actions: [{ index }] }, statusCode: 200 };
        }

        await this.database.executeOperationOnCollection(this.constants.collection.bankStatement, createDateIndex);

        const createPredictionIndexes = async (collection: Collection) => {
            const signatureIndex = await collection.createIndex({ signature: 1 }, { unique: true });
            const updatedAtIndex = await collection.createIndex({ updatedAt: -1 });
            return { content: { actions: [{ signatureIndex }, { updatedAtIndex }] }, statusCode: 200 };
        }

        await this.database.executeOperationOnCollection(this.constants.collection.prediction, createPredictionIndexes);

        const operation = async (collection: Collection) => {
            const actions = [];
            const options = { upsert: true, returnOriginal: false };

            // Initialize reviewed on date document
            const patchData = { $setOnInsert: { value: new Date().getTime() } };
            const response = await collection.findOneAndUpdate({ name: 'Modified On' }, patchData, options);
            actions.push({ reviewedOn: { insertedId: response?._id }, statusCode: 200 });

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
