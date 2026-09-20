import { Db } from 'mongodb';
import { constants as globalConstants, source } from "../common/constants";
import { ExecutionResponse, KeyVaultEntry } from '../common/types';
import { MongoDbService } from '../services/mongodb';
import { keyVaultService } from '../services/keyvault';
import { Logger } from '../common/models';

class KeyVault {
    private constants = globalConstants.deployement;
    private database = new MongoDbService(this.constants.database);
    private logger: Logger = new Logger(source.keyvault);

    public initializeDatabase = () => {
        this.logger.info('Initializing Indexes on Database...');

        const operation = async (database: Db): Promise<ExecutionResponse> => {
            const collectionExists = await database.listCollections({ name: this.constants.collections.keyvault }).hasNext();
            if (!collectionExists) await database.createCollection(this.constants.collections.keyvault);

            const index = await database.collection(this.constants.collections.keyvault).createIndex({ key: 1 }, { unique: true });
            return {
                content: {
                    database: this.constants.database,
                    collection: this.constants.collections.keyvault,
                    index
                },
                statusCode: 200
            };
        };

        return this.database.executeOperationOnDatabase(operation);
    };

    public getSecret = async (key: string): Promise<KeyVaultEntry | null> => {
        const response = await this.database.getDocument(this.constants.collections.keyvault, { key }, {});
        if (!response.content) return null;

        const entry = response.content as KeyVaultEntry;
        return {
            key: entry.key,
            secret: keyVaultService.decrypt(entry.secret)
        };
    };

    public setSecret = (key: string, secret: string) => this.database.insertDocument(this.constants.collections.keyvault, {
        key,
        secret: keyVaultService.encrypt(secret)
    });

    public updateSecret = async (key: string, secret: string): Promise<ExecutionResponse> => {
        const response = await this.database.patchDocument(
            this.constants.collections.keyvault,
            { $set: { secret: keyVaultService.encrypt(secret) } },
            { key },
            {}
        );

        return response.content?.matchedCount > 0 ? { content: { key }, statusCode: 200 } : this.database.emptyResponse;
    };
}

export const keyVault = new KeyVault();
