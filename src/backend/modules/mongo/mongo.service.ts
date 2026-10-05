import { MongoClient } from 'mongodb';
import type { ClientSession, Db } from 'mongodb';
import { MongoDatabases } from '../../core/constants.js';
import { Configuration } from '../../core/utils/configuration.js';

export class MongoService {
  private readonly connectionString = Configuration.GetSetting('MONGO_CONNECTION_STRING');

  private readonly client: MongoClient;
  private initialized = false;

  constructor() {
    this.client = new MongoClient(this.connectionString);
  }

  initialize = async (): Promise<void> => {
    if (this.initialized) return;

    await this.client.connect();
    this.initialized = true;
  };

  database = (databaseName: string): Db => this.client.db(databaseName);

  createIndexes = async (): Promise<void> => {
    await Promise.all([this.createEmandiIndexes(), this.createDeploymentIndexes()]);
  };

  withTransaction = async <Result>(
    operation: (session: ClientSession) => Promise<Result>,
  ): Promise<Result> => {
    const session = this.client.startSession();
    try {
      return await session.withTransaction(operation) as Result;
    } finally {
      await session.endSession();
    }
  };

  close = async (): Promise<void> => {
    await this.client.close();
    this.initialized = false;
  };

  private createEmandiIndexes = async (): Promise<void> => {
    const { database, collections } = MongoDatabases.EMandi;
    const databaseInstance = this.database(database);

    await Promise.all([
      databaseInstance.collection(collections.queued).createIndex({ createdOn: 1, _id: 1 }),
      databaseInstance.collection(collections.processed).createIndex({ createdOn: 1, _id: 1 }),
      databaseInstance.collection(collections.parties).createIndex(
        { name: 1, mandi: 1, state: 1 },
        { unique: true },
      ),
    ]);
  };

  private createDeploymentIndexes = async (): Promise<void> => {
    const { database, collections } = MongoDatabases.Deployment;
    await this.database(database).collection(collections.keyVault).createIndex({ key: 1 }, { unique: true });
  };
}
