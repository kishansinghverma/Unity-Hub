import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { Collection } from 'mongodb';
import { MongoDatabases } from '../../core/constants.js';
import { ServerError } from '../../core/errors/app-error.js';
import { Configuration } from '../../core/utils/configuration.js';
import type { MongoService } from '../mongo/mongo.service.js';
import type { KeyVaultDocument, KeyVaultEntry, KeyVaultUpdateResult } from './keyvault.types.js';

export class KeyVaultService {
  private readonly vaultEncryptionKey = Configuration.GetSetting('VAULT_ENCRYPTION_KEY');

  private readonly database: ReturnType<MongoService['database']>;
  private readonly encryptionKey = createHash('sha256').update(this.vaultEncryptionKey, 'utf8').digest();

  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12;

  constructor({ mongoService }: { mongoService: MongoService }) {
    this.database = mongoService.database(MongoDatabases.Deployment.database);
  }

  private get entries(): Collection<KeyVaultDocument> {
    return this.database.collection<KeyVaultDocument>(MongoDatabases.Deployment.collections.keyVault);
  }

  encrypt = (value: string): string => {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv, authTag, encrypted].map((part) => part.toString('base64')).join('.');
  };

  decrypt = (value: string): string => {
    const parts = value.split('.');
    if (parts.length !== 3) throw new ServerError('Invalid encrypted secret value');

    const encodedIv = parts[0] ?? '';
    const encodedAuthTag = parts[1] ?? '';
    const encodedCiphertext = parts[2] ?? '';
    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, Buffer.from(encodedIv, 'base64'));
    decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(encodedCiphertext, 'base64')),
      decipher.final()
    ]).toString('utf8');
  };

  getSecret = async (key: string): Promise<KeyVaultEntry | null> => {
    const entry = await this.entries.findOne({ key });
    return entry ? { key: entry.key, secret: this.decrypt(entry.secret) } : null;
  };

  setSecret = async (key: string, secret: string): Promise<void> => {
    await this.entries.insertOne({ key, secret: this.encrypt(secret) });
  };

  updateSecret = async (key: string, secret: string): Promise<KeyVaultUpdateResult> => {
    const result = await this.entries.updateOne({ key }, { $set: { secret: this.encrypt(secret) } });
    return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
  };

}
