import axios from 'axios';
import { WhatsApp } from '../../core/constants.js';
import { Configuration } from '../../core/utils/configuration.js';
import { FileUtils } from '../../core/utils/file.js';
import { ObjectUtils } from '../../core/utils/object.js';
import type { FileUpload } from '../s3storage/s3storage.types.js';
import type { WhatsAppMessageResponse } from './whatsapp.types.js';

export class WhatsAppService {
  private readonly apiUri = Configuration.GetSetting('GREEN_API_URI');
  private readonly fileSystemUri = Configuration.GetSetting('GREEN_API_FS');
  private readonly instanceId = Configuration.GetSetting('GREEN_API_INSTANCE_ID');
  private readonly token = Configuration.GetSetting('GREEN_API_TOKEN');

  sendMessage = (chatId: string, message: string): Promise<WhatsAppMessageResponse> =>
    this.sendRequest<WhatsAppMessageResponse>(WhatsApp.GreenApi.Routes.sendMessage, { chatId, message });

  sendFile = async (chatId: string, file: FileUpload, caption?: string): Promise<WhatsAppMessageResponse> => {
    const resolvedFileName = file.filename;
    const urlFile = (await this.uploadFile(file.buffer, resolvedFileName)).urlFile;
    return this.sendViaUrl(chatId, urlFile, resolvedFileName, caption);
  };

  sendViaUrl = (chatId: string, urlFile: string, fileName: string, caption?: string): Promise<WhatsAppMessageResponse> => {
    const body = ObjectUtils.SanitizeObject({ chatId, fileName, urlFile, caption });
    return this.sendRequest<WhatsAppMessageResponse>(WhatsApp.GreenApi.Routes.sendFileByUrl, body);
  };

  private uploadFile = async (file: Buffer, fileName: string): Promise<{ urlFile: string }> => {
    const contentType = FileUtils.GetMimeType(fileName);

    const response = await axios.post<{ urlFile: string }>(
      this.getUrl(WhatsApp.GreenApi.Routes.uploadFile, this.fileSystemUri), file,
      { headers: { 'Content-Type': contentType }, timeout: 10000 }
    );
    
    return response.data;
  };

  private sendRequest = async <T>(endpoint: string, body: object): Promise<T> => {
    const response = await axios.post<T>(this.getUrl(endpoint), body, { timeout: 10000 });
    return response.data;
  };

  private getUrl = (endpoint: string, baseUrl = this.apiUri) => `${baseUrl}/${this.instanceId}/${endpoint}/${this.token}`;
}
