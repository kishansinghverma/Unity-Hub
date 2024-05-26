
import { Document } from "mongodb";
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

    public deleteTransaction = (id: string) => this.database.deleteDocument(this.constants.collection.draft, id);
}

export const expenses = new Expenses();