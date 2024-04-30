
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { Request, Response } from "express";
import { greenApi } from "../common/constants";
import { fileService } from "../services/file";
import { whatsAppService } from "../services/whatsapp";
import { IncomingMessage } from "../common/types";
import path from 'path';
import { String } from '../common/models';
import { validateResponse } from '../common/utils';
import { mqttService } from '../services/mqtt';
import { assistantService } from '../services/assistance';

class WhatsApp {
    public sendMessageToEmandiGroup = (message: string) => whatsAppService.sendMessage(greenApi.groupId.emandi, message);

    public sendMessageToUnityGroup = (message: string) => whatsAppService.sendMessage(greenApi.groupId.unityHub, message);

    public shareMessageViaUnityGroup = (recipientNumber: string, message: string) =>
        whatsAppService.shareMessageViaGroup(recipientNumber, greenApi.groupId.unityHub, message);

    public shareFileViaUnityGroup = (request: Request, response: Response) =>
        fileService.saveIncomingFile(request, response).then(({ content }) =>
            whatsAppService.shareLocalFileViaGroup(request.params.number, greenApi.groupId.unityHub, content, request.body.caption));

    public handleIncomingMessages = async (message: IncomingMessage) => {
        if (message.messageData.typeMessage === 'textMessage') {
            if (message.messageData.textMessageData?.textMessage.endsWith('!'))
                assistantService.ask(message.messageData.textMessageData.textMessage.replaceAll('!', ''))
                    .then(response => whatsAppService.sendMessage(greenApi.groupId.unityHub, response));  
        }
        else if (message.messageData.typeMessage === 'documentMessage' && message.messageData.fileMessageData?.mimeType === 'application/pdf') {
            const fileName = `${String.generateId()}.pdf`;
            return fetch(message.messageData.fileMessageData.downloadUrl)
                .then(validateResponse)
                .then(({ body }) => {
                    const stream = fs.createWriteStream(path.join(__dirname, `../static/${fileName}`));
                    return finished(Readable.fromWeb(body as any).pipe(stream));
                })
                .then(() => {
                    if (message.messageData.fileMessageData?.caption.toLowerCase().includes('print')) {
                        mqttService.publishPrinterAction('print', fileName);
                        whatsAppService.sendMessage(greenApi.groupId.unityHub, 'Print Command Send!');
                    }
                    else {
                        whatsAppService.sendMessage(greenApi.groupId.unityHub, fileName);
                    }
                });
        }
    }
}

export const whatsApp = new WhatsApp();
