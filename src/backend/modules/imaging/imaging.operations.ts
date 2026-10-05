import type { OperationResponse } from '../../core/http/action-response.js';
import type { GenerateQrRequest } from './imaging.types.js';
import type { ImagingService } from './imaging.service.js';

export class ImagingOperation {
  private readonly imagingService: ImagingService;

  constructor({ imagingService }: { imagingService: ImagingService }) {
    this.imagingService = imagingService;
  }

  extractText = async (base64Image: string): Promise<OperationResponse<{ text: string }>> => ({
    content: { text: await this.imagingService.extractText(base64Image) }
  });

  generateQr = (request: GenerateQrRequest): Promise<string> => this.imagingService.generateQr(request);
}
