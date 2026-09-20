import 'dotenv/config';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 12;
const keyEnvironmentVariable = 'VAULT_ENCRYPTION_KEY';

class KeyVaultService {
    private getKey = (): Buffer => {
        const secret = process.env[keyEnvironmentVariable];
        if (!secret) throw new Error(`${keyEnvironmentVariable} is not configured.`);

        return createHash('sha256').update(secret, 'utf8').digest();
    };

    public encrypt = (value: string): string => {
        if (typeof value !== 'string') throw new TypeError('Vault can only encrypt strings.');

        const iv = randomBytes(ivLength);
        const cipher = createCipheriv(algorithm, this.getKey(), iv);
        const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return [iv, authTag, encrypted].map(part => part.toString('base64')).join('.');
    };

    public decrypt = (value: string): string => {
        if (typeof value !== 'string') throw new TypeError('Vault can only decrypt strings.');

        const parts = value.split('.');
        if (parts.length !== 3) throw new Error('Invalid encrypted vault value.');

        try {
            const [encodedIv, encodedAuthTag, encodedCiphertext] = parts;
            const decipher = createDecipheriv(algorithm, this.getKey(), Buffer.from(encodedIv, 'base64'));
            decipher.setAuthTag(Buffer.from(encodedAuthTag, 'base64'));

            return Buffer.concat([
                decipher.update(Buffer.from(encodedCiphertext, 'base64')),
                decipher.final()
            ]).toString('utf8');
        }
        catch {
            throw new Error('Unable to decrypt vault value.');
        }
    };
}

export const keyVaultService = new KeyVaultService();
