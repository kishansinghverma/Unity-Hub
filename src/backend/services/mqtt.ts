import 'dotenv/config';
import { IClientOptions, MqttClient, connect } from "mqtt";
import { source, constants } from "../common/constants";
import { Logger, Throwable } from "../common/models";
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
            err ? this.logger.error(err.message) : this.logger.success(constants.message.printerSubscribed);
        });
    }

    public initialize = () => {
        this.client.on('connect', () => {
            this.logger.info(constants.message.mqttConnected);
            this.subscribeToPrinterStatus();
        });
        this.client.on('disconnect', () => this.logger.warning(constants.message.mqttDisconnected));
        this.client.on('error', (err) => this.logger.error(err.message));
    }

    public publishMessage = (packets: Array<MqttPacket>) => {
        if (!this.client.connected) throw new Throwable(constants.errors.mqttNotReady, 500);
        packets.forEach(packet => this.client.publish(packet.topic, packet.message));
    }

    public publishPrinterAction = (operation: string, payload: string) => {
        const topic = `printer/${operation}`;
        this.publishMessage([{ topic: topic, message: payload }]);
    }
}

export const mqttService = new MqttService();