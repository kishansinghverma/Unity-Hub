import { source } from "../common/constants";
import { getCustomDevice, helperDevices } from "../common/devices";
import { Logger, Throwable } from "../common/models";
import { Action } from "../common/types";
import { mqttService } from "./mqtt";
import { smartNestService } from "./smartnest";
import { assistantService } from "./assistance";

class SmartHome {
    private logger: Logger;

    constructor() {
        this.logger = new Logger(source.smarthome);
    }

    broadcastMessage = (message: string) => {
        mqttService.publishMessage([{ topic: 'broadcast', message }]);
        return Promise.resolve('Ok');
    };

    waitFor = (seconds: string): Promise<string> => {
        const time = parseInt(seconds);
        if (isNaN(time) || time > 30) throw new Throwable('Invalid Wait Time', 400);
        return new Promise(resolve => setTimeout(() => resolve('Ok'), time * 1000))
    };

    askAssistant = (query: string) => {
        if (query.length < 3) throw new Throwable('Invalid Query', 400);
        return assistantService.ask(query);
    }

    switchDeviceStatusSynced = (device: string, state: string) => {
        this.switchDeviceState(device, state);
        smartNestService.updateState(device, state);
    }

    executeHelperActions = (action: Action) => {
        switch (action.device) {
            case 'assistant':
                return this.askAssistant(action.query);

            case 'broadcast':
                return this.broadcastMessage(action.query);

            case 'wait':
                return this.waitFor(action.query);

            default:
                throw new Throwable('Invalid Action', 400);
        }
    }

    executeAction = async (action: Action) => {
        const device = action.device.replaceAll(' ', '').toLowerCase();
        this.logger.info(`${device} : ${action.query}`);

        if (helperDevices.includes(device))
            return await this.executeHelperActions({ ...action, device });

        const query = action.query.replaceAll(' ', '').toLowerCase();
        this.switchDeviceStatusSynced(device, query);
        return Promise.resolve('Ok');
    }

    executeActions = async (actions: Array<Action>) => {
        for (const action of actions) {
            await this.executeAction(action);
        }
        return Promise.resolve('Ok');
    }

    switchDeviceState = (device: string, state: string) => {
        const targetDevice = getCustomDevice(device);
        if (!targetDevice) throw new Throwable('Device Not Registered', 400);
        if (!["0", "1"].includes(state)) throw new Throwable('Invalid Switch State', 400);

        const messagesToPublish = Object.keys(targetDevice).map(topic => {
            const targetSwitches = targetDevice[topic];
            const applicableStates = targetSwitches.concat(new Array(targetSwitches.length).fill(state));
            const message = applicableStates.join("");
            return { message, topic };
        });

        mqttService.publishMessage(messagesToPublish);
    }

    public initialize = () => {
        this.logger.success('Home Automation Service Ready!');
    }
}

export const smartHomeService = new SmartHome();