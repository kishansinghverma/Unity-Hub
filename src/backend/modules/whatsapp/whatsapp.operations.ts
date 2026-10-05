import { WhatsApp } from '../../core/constants.js';
import type { OperationResponse } from '../../core/http/action-response.js';
import { LogSource } from '../../core/logging/log-sources.js';
import type { Logger, ScopedLogger } from '../../core/logging/logger.js';
import type { WhatsAppService } from './whatsapp.service.js';
import type { WhatsAppFile, WhatsAppMessageResponse } from './whatsapp.types.js';

export class WhatsAppOperation {
  private readonly whatsappService: WhatsAppService;
  private readonly logger: ScopedLogger;

  constructor({ whatsappService, logger }: { whatsappService: WhatsAppService; logger: Logger }) {
    this.whatsappService = whatsappService;
    this.logger = logger.for(LogSource.WhatsApp);
  }

  sendMessageToEmandiGroup = async (message: string): Promise<OperationResponse<WhatsAppMessageResponse>> => {
    this.logger.info('Sending message to Emandi');
    return { content: await this.whatsappService.sendMessage(WhatsApp.GreenApi.Group.EMandi, message) };
  };

  sendMessageToUnityHubGroup = async (message: string): Promise<OperationResponse<WhatsAppMessageResponse>> => {
    this.logger.info('Sending message to Unity Hub');
    return { content: await this.whatsappService.sendMessage(WhatsApp.GreenApi.Group.UnityHub, message) };
  };

  sendFileToEmandiGroup = async (file: WhatsAppFile): Promise<OperationResponse<WhatsAppMessageResponse>> => {
    this.logger.info('Sending file to Emandi');
    return { content: await this.sendFile(WhatsApp.GreenApi.Group.EMandi, file) };
  };

  sendFileToUnityHubGroup = async (file: WhatsAppFile): Promise<OperationResponse<WhatsAppMessageResponse>> => {
    this.logger.info('Sending file to Unity Hub');
    return { content: await this.sendFile(WhatsApp.GreenApi.Group.UnityHub, file) };
  };

  private sendFile = (chatId: string, file: WhatsAppFile): Promise<WhatsAppMessageResponse> => {
    if ('fileUrl' in file) return this.whatsappService.sendViaUrl(chatId, file.fileUrl, file.fileName, file.caption)
    else return this.whatsappService.sendFile(chatId, file.file, file.caption);
  }
}
