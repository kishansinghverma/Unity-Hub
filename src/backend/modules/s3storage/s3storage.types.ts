export type FileUpload = {
  buffer: Buffer;
  filename: string;
};

export type StorageFile = {
  path: string;
  id: string;
  fullPath: string;
};

export type StorageListItem = {
  name: string;
  id: string | null;
  created_at: string | null;
};
