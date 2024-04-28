import 'dotenv/config';
import fs from "fs";
import path from "path";
import { postParams, mimeType } from "../common/constants";
import { getJsonResponse } from "../common/utils";

class WhatsApp {
    private instanceId = process.env.GREEN_API_INSTANCE_ID;
    private token = process.env.GREEN_API_TOKEN;
    private baseUrl = process.env.GREEN_API_URI;
    private fsUrl = process.env.GREEN_API_FS;

    private getUrl = (path: string, origin = this.baseUrl) => (`${origin}/${this.instanceId}/${path}/${this.token}`);

    private getRemoteFileUrl = (fileName: string) => {
        const extension = fileName.split('.').pop() ?? 'any';
        const fetchParams = { ...postParams, headers: { 'Content-Type': mimeType[extension] }, body: fs.readFileSync(path.join(__dirname, `../static/${fileName}`)) };
        return fetch(this.getUrl('uploadFile', this.fsUrl), fetchParams).then(getJsonResponse);
    }

    private addUserToGroup = (participantChatId: string, groupId: string) => {
        const fetchParams = { ...postParams, body: JSON.stringify({ groupId, participantChatId }) };
        return fetch(this.getUrl('addGroupParticipant'), fetchParams).then(getJsonResponse);
    }

    private removeUserFromGroup = (participantChatId: string, groupId: string) => {
        const fetchParams = { ...postParams, body: JSON.stringify({ groupId, participantChatId }) };
        return fetch(this.getUrl('removeGroupParticipant'), fetchParams).then(getJsonResponse);
    }

    public sendMessage = (chatId: string, message: string) => {
        const fetchParams = { ...postParams, body: JSON.stringify({ chatId: chatId, message: message }) };
        return fetch(this.getUrl('sendMessage'), fetchParams).then(getJsonResponse);
    }

    public sendLocalFile = async (chatId: string, fileName: string, caption: string) => {
        const { content: { urlFile } } = await this.getRemoteFileUrl(fileName);
        const fetchParams = { ...postParams, body: JSON.stringify({ chatId, fileName, urlFile, caption }) };
        return fetch(this.getUrl('sendFileByUrl'), fetchParams).then(getJsonResponse);
    }

    public shareMessageViaGroup = async (participantNumber: string, groupId: string, message: string) => {
        return this.addUserToGroup(`91${participantNumber}@c.us`, groupId)
            .then(() => (this.sendMessage(groupId, message)))
            .then(response => {
                setTimeout(() => this.removeUserFromGroup(`91${participantNumber}@c.us`, groupId), 10*1000);
                return response;
            });
    }

    public shareLocalFileViaGroup = async (participantNumber: string, groupId: string, fileName: string, caption: string) => {
        return this.addUserToGroup(`91${participantNumber}@c.us`, groupId)
            .then(() => (this.sendLocalFile(groupId, fileName, caption)))
            .then(response => {
                setTimeout(() => this.removeUserFromGroup(`91${participantNumber}@c.us`, groupId), 60 * 1000);
                return response;
            });
    }
}

export const whatsAppService = new WhatsApp();