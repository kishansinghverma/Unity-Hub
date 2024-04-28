import { mqttService } from './backend/services/mqtt';
import { smartNestService } from './backend/services/smartnest';
import { cronJobs } from './backend/services/cronjobs';
import { httpServer } from './backend/services/express';

httpServer.initialize();
cronJobs.initialize();
mqttService.initialize();
// smartNest.initialize();