import { mqttService } from './backend/services/mqtt';
import { smartNestService } from './backend/services/smartnest';
import { cronJobs } from './backend/services/cronjobs';
import { httpServer } from './backend/services/express';
import { assistantService } from './backend/services/assistance';

assistantService.initialize();
httpServer.initialize();
cronJobs.initialize();
mqttService.initialize();
// smartNest.initialize();