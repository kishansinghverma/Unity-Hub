import { constants } from "../common/constants";
import { Throwable } from "../common/models";
import { mqttService } from "../services/mqtt";

class Mqtt {
    public getPrinterStatus = () => {
        mqttService.publishPrinterAction('query', 'status');
        return new Promise((resolve, reject) => {
            setTimeout(() => reject(new Throwable(constants.errors.timeLimitExceeded, 500)), 20000);
            mqttService.client.once('message', (topic, message) => resolve(message.toString()));
        })
    }
}

export const mqtt = new Mqtt();