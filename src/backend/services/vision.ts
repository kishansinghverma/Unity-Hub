import QRCode from "qrcode";
import { Logger, Throwable } from "../common/models";
import { source } from "../common/constants";
import { ExecutionResponse } from "../common/types";

class VisionService {
    private logger: Logger;
    private apiUrl: string = 'https://api.ocr.space/parse/image';

    constructor() {
        this.logger = new Logger(source.vision);
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
                throw new Throwable(`Upstream Api Error`, response.status || 502);
            }

            const data: any = await response.json();

            if (data.IsErroredOnProcessing || !data.ParsedResults?.length) {
                const errorMsg = data.ErrorMessage?.[0] || data.ErrorDetails || 'Failed to process captcha image';
                this.logger.error(`OCR Processing Error: ${errorMsg}`);
                throw new Throwable(errorMsg, 422);
            }

            const rawText: string = data.ParsedResults[0].ParsedText || '';
            const digits = rawText.replace(/\D/g, '');
            return { content: { code: digits }, statusCode: 200 };
            
        } catch (error: any) {
            if (error instanceof Throwable) throw error;
            this.logger.error(`OCR Exception: ${error.message}`);
            throw new Throwable(error.message || 'Internal OCR service error', 500);
        }
    };

    public generateQR = (text: string, version: 8 | 14, width: 1140 | 1620): Promise<string> => QRCode.toDataURL([{ data: Buffer.from(text, "utf8"), mode: "byte" }], {
        version,
        errorCorrectionLevel: "Q",
        maskPattern: 2,
        margin: 4,
        width,
        color: {
            dark: "#000000FF",
            light: "#FFFFFFFF"
        }
    });
}

export const visionService = new VisionService();
