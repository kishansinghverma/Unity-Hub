import type { FileUpload } from '../s3storage/s3storage.types.js';

export type WhatsAppMessageResponse = {
  idMessage?: string | undefined;
};

export type WhatsAppFile = |
{
  fileUrl: string;
  fileName: string;
  caption?: string | undefined;
} |
{
  file: FileUpload;
  caption?: string | undefined;
};

export type SendMessageRequest = {
  Body: {
    message: string;
  };
};

export type SendFileRequest = {
  Body: WhatsAppFile;
};

export type NotificationResult = WhatsAppMessageResponse | { error: string };
