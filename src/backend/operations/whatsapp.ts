
import { Request, Response } from "express";
import { greenApi } from "../common/constants";
import { fileService } from "../services/file";
import { whatsAppService } from "../services/whatsapp";

class WhatsApp {
    public sendMessageToEmandiGroup = (message: string) => whatsAppService.sendMessage(greenApi.groupId.emandi, message);

    public sendMessageToUnityGroup = (message: string) => whatsAppService.sendMessage(greenApi.groupId.unityHub, message);

    public shareMessageViaUnityGroup = (recipientNumber: string, message: string) =>
        whatsAppService.shareMessageViaGroup(recipientNumber, greenApi.groupId.unityHub, message);

    public shareFileViaUnityGroup = (request: Request, response: Response) =>
        fileService.saveIncomingFile(request, response).then(({ content }) =>
            whatsAppService.shareLocalFileViaGroup(request.params.number, greenApi.groupId.unityHub, content, request.body.caption));
}

export const whatsApp = new WhatsApp();
