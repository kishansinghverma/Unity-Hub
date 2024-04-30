import { mqttService } from './backend/services/mqtt';
import { smartNestService } from './backend/services/smartnest';
import { cronJobs } from './backend/services/cronjobs';
import { httpServer } from './backend/services/express';
import { assistantService } from './backend/services/assistance';
import { smartHomeService } from './backend/services/smarthome';

assistantService.initialize();
mqttService.initialize();
smartHomeService.initialize();
httpServer.initialize();
cronJobs.initialize();
smartNestService.initialize();