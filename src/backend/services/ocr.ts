import { Logger, Throwable } from "../common/models";
import { source } from "../common/constants";
import { ExecutionResponse } from "../common/types";

class OcrService {
    private logger: Logger;
    private apiUrl: string = 'https://api.ocr.space/parse/image';

    constructor() {
        this.logger = new Logger(source.ocr);
    }

    public resolveCaptcha = async (base64Image: string): Promise<ExecutionResponse> => {
        try {
            const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
            const formData = new FormData();
            formData.append('apikey', apiKey);
            formData.append('language', 'eng');
            formData.append('isOverlayRequired', 'false');
            formData.append('scale', 'true');
            formData.append('OCREngine', '3');
            formData.append('base64Image', base64Image);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                this.logger.error(`Upstream Api Error: ${response.status} ${response.statusText}`);
                throw new Throwable(`OCR service failed with status ${response.status}`, 502);
            }

            const data: any = await response.json();

            if (data.IsErroredOnProcessing || !data.ParsedResults?.length) {
                const errorMsg = data.ErrorMessage?.[0] || data.ErrorDetails || 'Failed to process captcha image';
                this.logger.error(`OCR Processing Error: ${errorMsg}`);
                throw new Throwable(errorMsg, 422);
            }

            const rawText: string = data.ParsedResults[0].ParsedText || '';
            const digits = rawText.replace(/\D/g, '');
            const parsedCode = parseInt(digits, 10);

            if (isNaN(parsedCode)) {
                throw new Throwable('Failed to extract digits from captcha', 422);
            }

            this.logger.success(`Captcha resolved successfully: ${parsedCode}`);
            
            return {
                content: { code: parsedCode, text: digits },
                statusCode: 200
            };
        } catch (error: any) {
            if (error instanceof Throwable) throw error;
            this.logger.error(`OCR Exception: ${error.message}`);
            throw new Throwable(error.message || 'Internal OCR service error', 500);
        }
    };
}

export const ocrService = new OcrService();
