import 'dotenv/config';
import { Assistant, AssistantLanguage } from 'nodejs-assistant';
import { Logger } from '../common/models';
import { source, style } from '../common/constants';

class GoogleAssistant {
    private logger: Logger;
    private assistant: Assistant;
    private assistantConfig = {
        token: process.env.GA_TOKEN,
        refresh_token: process.env.GA_REFRESH_TOKEN,
        client_id: process.env.GA_CLIENT_ID,
        client_secret: process.env.GA_CLIENT_SECRET,
        type: "authorized_user",
        scopes: ["https://www.googleapis.com/auth/assistant-sdk-prototype"],
        token_uri: "https://oauth2.googleapis.com/token"
    }

    private assistantOptions = {
        locale: AssistantLanguage.ENGLISH,
        deviceId: 'NodeClient',
        deviceModelId: 'AwsServer',
    }

    constructor() {
        this.assistant = new Assistant(this.assistantConfig, this.assistantOptions);
        this.logger = new Logger(source.assistant);
    }

    public initialize = () => {
        this.ask('Ping').then(response => {
            response.text ? this.logger.success(response.text, style.bold) : this.logger.error('Assistant Service Not Available!');
        });
    }

    public ask = (query: string) => this.assistant.query(query);
}

export const assistantService = new GoogleAssistant();