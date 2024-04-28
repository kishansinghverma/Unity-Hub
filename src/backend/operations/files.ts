
import { String } from "../common/models";
import { greenApi } from "../common/constants";
import { CreatePdfRequest, ExecutionResponse } from "../common/types";
import { fileService } from "../services/file";
import { whatsAppService } from "../services/whatsapp";
import { Request, Response } from "express";

class Files {
    public uploadFile = (request: Request, response: Response) => fileService.saveIncomingFile(request, response);

    public createAndSharePdf = async (content: CreatePdfRequest): Promise<ExecutionResponse> => {
        const fileName = await fileService.generatePdfFromHtml(content);
        if (content.forceDownload) {
            return { content: fileName, statusCode: 200 };
        }
        else if (content.print) {
            //Publish print command to mqtt server.
            return { content: fileName, statusCode: 202 };
        }
        else {
            if (content.driverMobile)
                return whatsAppService.shareLocalFileViaGroup(content.driverMobile, greenApi.groupId.emandi, fileName, `*${String.capitalize(content.name)}:* ${content.party}`)
                    .then(res => ({ ...res, statusCode: 201 }));
            else
                return whatsAppService.sendLocalFile(greenApi.groupId.emandi, fileName, `*${String.capitalize(content.name)}:* ${content.party}`)
                    .then(res => ({ ...res, statusCode: 201 }));
        }
    }
}

export const files = new Files();