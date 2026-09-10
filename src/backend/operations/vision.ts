import { ExecutionResponse } from "../common/types";
import { visionService } from "../services/vision";

class Vision {
    public resolveCaptcha = (base64Image: string): Promise<ExecutionResponse> => visionService.resolveCaptcha(base64Image);

    public generateQR = (text: string, version: 8 | 14, width: 1140 | 1620): Promise<string> => visionService.generateQR(text, version, width);
}

export const vision = new Vision();
