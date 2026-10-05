import axios from 'axios';
import QRCode from 'qrcode';
import { Ocr } from '../../core/constants.js';
import { UpstreamApiError } from '../../core/errors/app-error.js';
import { Configuration } from '../../core/utils/configuration.js';
import type { GenerateQrRequest, OcrResponse } from './imaging.types.js';
import { StringUtils } from '../../core/utils/string.js';

export class ImagingService {
  private readonly ocrApiKey = Configuration.TryGetSetting('OCR_SPACE_API_KEY') ?? 'helloworld';

  extractText = async (base64Image: string): Promise<string> => {
    const formData = new FormData();
    formData.append('apikey', this.ocrApiKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('scale', 'true');
    formData.append('OCREngine', '3');
    formData.append('base64Image', base64Image);

    const response = await axios.post<OcrResponse>(Ocr.OcrApiUrl, formData, { timeout: 10000 });
    const data = response.data;
    const result = data.ParsedResults?.[0];
    const errorMessage = result?.ErrorMessage || result?.ErrorDetails;

    if (data.IsErroredOnProcessing || errorMessage || !result) {
      throw new UpstreamApiError(errorMessage ?? 'Failed to extract text from image', 422);
    }

    return result.ParsedText ?? StringUtils.Empty;
  };

  generateQr = ({ text, version, maskPattern, width }: GenerateQrRequest): Promise<string> =>
    QRCode.toDataURL([{ data: Buffer.from(text, 'utf8'), mode: 'byte' }], {
      version,
      errorCorrectionLevel: 'Q',
      maskPattern,
      margin: 4,
      width,
      color: { dark: '#000000FF', light: '#FFFFFFFF' }
    });
}
