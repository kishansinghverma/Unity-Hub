import fs from 'fs';
import path from 'path';
import { WebSocket } from 'ws';
import dgram from 'dgram';
import { Logger } from '../common/models';
import { source } from '../common/constants';

export const wsClients: Set<WebSocket> = new Set();

class Streamer {
    private logger: Logger;
    private UDP_PORT = 12345;

    constructor() {
        this.logger = new Logger(source.udp);
    }

    private recordStream = (bufferStore: Buffer[]) => {
        setInterval(() => {
            const filename = `audio_${Date.now()}.raw`;
            const fullBuffer = Buffer.concat(bufferStore);
            fs.writeFileSync(path.join(__dirname, '../uploads', filename), fullBuffer);
            bufferStore = [];
            console.log(`Saved: ${filename}`);
        }, 60 * 60 * 1000);
    }

    public initialize = () => {
        const udp = dgram.createSocket('udp4');
        let bufferStore: Buffer[] = [];

        udp.on('listening', () => {
            const address = udp.address();
            this.logger.success(`Server listening on on ${address.port}! 🎉`);
        });

        udp.on('message', (msg, rinfo) => {
            bufferStore.push(msg);
            wsClients.forEach((client) => client.send(msg));
        });

        udp.bind(this.UDP_PORT);

        //this.recordStream(bufferStore);
    }
}

export const udpServer = new Streamer();