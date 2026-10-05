export type KeyVaultEntry = {
  key: string;
  secret: string;
};

type KeyVaultDocument = KeyVaultEntry;

export type KeyVaultUpdateResult = {
  matchedCount: number;
  modifiedCount: number;
};

export type { KeyVaultDocument };
