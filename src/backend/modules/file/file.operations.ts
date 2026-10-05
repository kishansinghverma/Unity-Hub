import type { OperationResponse } from '../../core/http/action-response.js';
import type { FileService } from './file.service.js';
import type { FileUpload, GatepassPayload, NinerPayload } from './file.types.js';

export class FileOperation {
  private readonly fileService: FileService;

  constructor({ fileService }: { fileService: FileService }) {
    this.fileService = fileService;
  }

  generateGatepass = async (payload: GatepassPayload): Promise<OperationResponse<{ fileName: string }>> => ({
    content: { fileName: await this.fileService.generateGatepass(payload) }
  });

  generateNiner = async (payload: NinerPayload): Promise<OperationResponse<{ fileName: string }>> => ({
    content: { fileName: await this.fileService.generateNiner(payload) }
  });

  saveIncomingFile = async (file: FileUpload): Promise<OperationResponse<{ fileName: string }>> => ({
    statusCode: 201,
    content: { fileName: await this.fileService.saveIncomingFile(file) }
  });

  readFile = (fileName: string): Promise<Buffer> => this.fileService.readFile(fileName);
}
