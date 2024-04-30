import 'dotenv/config';
import { IClientOptions, MqttClient, connect } from "mqtt";
import { source, style } from "../common/constants";
import { getNestDevice, nestDeviceGroupIds, nestDeviceGroups } from "../common/devices";
import { Logger, Throwable } from "../common/models";
import { smartHomeService } from './smarthome';

class SmartNest {
    private logger: Logger;
    private deviceMap = new Map();
    private clientMap: { [key: string]: MqttClient } = {};

    private mqttOptions: IClientOptions = {
        host: process.env.SMART_NEST_HOST as string,
        username: process.env.SMART_NEST_USER_NAME as string,
        password: process.env.SMART_NEST_PASSWORD as string,
        reconnectPeriod: 100,
    };

    constructor() {
        this.logger = new Logger(source.smartnest);

        Object.entries(nestDeviceGroups).forEach(([key, value]) => {
            const map = this.deviceMap.get(value.GroupId) ?? new Map();
            map.set(value.DeviceId, key);
            this.deviceMap.set(value.GroupId, map);
        });
    }

    private processMessage = (topic: string, message: Buffer) => {
        const [groupId, event, deviceId] = topic.split('/');
        if (event == 'report') {
            const device = this.deviceMap.get(groupId).get(deviceId);
            const state = message.toString() == 'ON' ? '1' : '0';
            this.logger.info(`${device} => ${state}`);
            smartHomeService.switchDeviceState(device, state);
        }
    }

    private connectDevice = (clientId: string) => {
        const client = connect({ ...this.mqttOptions, clientId });
        this.clientMap[clientId] = client;
        
        client.on('message', this.processMessage);

        client.on('connect', () => {
            client.subscribe(`${clientId}/#`, (err) => {
                err ? this.logger.error(err.message) : this.logger.success(`Client Connected : ${clientId}`, style.bold);
            })
        });
    }

    public updateState = (device: string, state: string) => {
        const nestDevice = getNestDevice(device);
        if (!nestDevice) throw new Throwable('Device Not Registered', 404);

        const topic = `${nestDevice.GroupId}/report/${nestDevice.DeviceId}`;
        const message = state == '1' ? 'ON' : 'OFF';
        const client = this.clientMap[nestDevice.GroupId];
        client.publish(topic, message);
    }

    public initialize = () => Object.values(nestDeviceGroupIds).forEach(this.connectDevice);
}

export const smartNestService = new SmartNest();