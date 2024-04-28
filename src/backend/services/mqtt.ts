import 'dotenv/config';
import { IClientOptions, MqttClient, connect } from "mqtt";
import { source, constants, style } from "../common/constants";
import { Logger } from "../common/models";
import { MqttPacket } from "../common/types";

class MqttService {
    public client: MqttClient;
    private logger: Logger;
    private mqttOptions: IClientOptions = {
        host: process.env.MQTT_HOST as string,
        port: parseInt(process.env.MQTT_PORT as string),
        username: process.env.MQTT_USER_NAME as  string,
        password: process.env.MQTT_PASSWORD as string,
        reconnectPeriod: 100,
        protocol: 'mqtts'
    };

    constructor() {
        this.logger = new Logger(source.mqtt);
        this.client = connect(this.mqttOptions);
    }

    private subscribeToPrinterStatus = () => {
        this.client.subscribe('printer/status', err => {
            err ? this.logger.error(err.message) : this.logger.info(constants.message.printerSubscribed);
        });
    }

    public initialize = () => {
        this.client.on('connect', () => {
            this.logger.success(constants.message.mqttConnected, style.bold);
            this.subscribeToPrinterStatus();
        });
        this.client.on('disconnect', () => this.logger.warning(constants.message.mqttDisconnected));
        this.client.on('error', (err) => this.logger.error(err.message));
    }

    public publishMessage = (packets: Array<MqttPacket>) => {
        if (!this.client.connected) return { content: constants.errors.mqttNotReady, statusCode: 500 };
        packets.forEach(packet => this.client.publish(packet.topic, packet.message));
        return { content: constants.message.mqttPublished, statusCode: 200 };
    }

    public publishPrinterAction = (operation: string, payload: string) => {
        const topic = `printer/${operation}`;
        return this.publishMessage([{ topic: topic, message: payload }]);
    }
}

export const mqttService = new MqttService();