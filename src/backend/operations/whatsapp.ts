import { postParams } from "../common/constants";
import dotenv from 'dotenv';
dotenv.config();

class WhatsApp {
    private instanceId = process.env.GREEN_API_INSTANCE_ID;
    private token = process.env.GREEN_API_TOKEN;
    private baseUrl = process.env.GREEN_API_URI;
    private fsUrl = process.env.GREEN_API_FS;
    private emandiChatId = process.env.EMANDI_GROUP_ID as string;
    private unityHubChatId = process.env.UNITYHUB_GROUP_ID as string;

    private sendMessage = async (message: string, chatId: string) => {
        const fetchParams = {
            ...postParams,
            body: JSON.stringify({ chatId: chatId, message: message })
        };

        return fetch(`${this.baseUrl}/${this.instanceId}/sendMessage/${this.token}`, fetchParams);
    }

    public sendFile = async (recipient: string, remoteUrl: string, caption: string) => {
        const fetchParams = {
            ...postParams,
            body: JSON.stringify({
                chatId: recipient,
                urlFile: remoteUrl,
                fileName: caption
            })
        };

        return fetch(`${this.baseUrl}/${this.instanceId}/sendFileByUrl/${this.token}`, fetchParams);
    }

    // private getRemoteUrl = async (fileName: string) => {
    //     const fetchParams = {
    //         ...postParams,
    //         body: fs.readFileSync(path.join(__dirname, `../uploaded/${fileName}`)),
    //     };

    //     return fetch(`${this.fsUrl}/${this.instanceId}/uploadFile/${this.token}`, fetchParams);
    // }

    public sendMessageToEmandi = (message: string) => this.sendMessage(message, this.emandiChatId);

    public sendMessageToUnityHub = (message: string) => this.sendMessage(message, this.unityHubChatId);

    public SendFileToEmandi = async (fileName: string, caption: string) => {
        //const { urlFile } = await this.getRemoteUrl(fileName);
        return this.sendFile(this.emandiChatId, '', caption);
    }

    public SendFileToUnityHub = async (fileName: string, caption: string) => {
        //const { urlFile } = await this.getRemoteUrl(fileName);
        return this.sendFile(this.unityHubChatId, '', caption);
    }
}

export const whatsApp = new WhatsApp();
