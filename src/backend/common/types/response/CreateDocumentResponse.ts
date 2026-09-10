export type DocumentActionStatus = 'success' | 'failed' | 'not_requested';

export type DocumentActionResponse = {
    status: DocumentActionStatus;
    error?: string;
};

export type CreateDocumentResponse = {
    fileName: string;
    downloadUrl?: string;
    print: DocumentActionResponse;
    share: DocumentActionResponse;
    download: DocumentActionResponse;
};
