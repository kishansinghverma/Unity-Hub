import { mqttService } from './backend/services/mqtt';
import { smartNestService } from './backend/services/smartnest';
import { cronJobs } from './backend/services/cronjobs';
import { httpServer } from './backend/services/express';
import { assistantService } from './backend/services/assistance';
import { smartHomeService } from './backend/services/smarthome';
import { udpServer } from './backend/services/streamer';

assistantService.initialize();
// mqttService.initialize();
smartHomeService.initialize();
cronJobs.initialize();
// smartNestService.initialize();
httpServer.initialize();
udpServer.initialize();