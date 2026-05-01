import { mqttService } from './backend/services/mqtt';
import { smartNestService } from './backend/services/smartnest';
import { cronJobs } from './backend/services/cronjobs';
import { httpServer } from './backend/services/express';
import { assistantService } from './backend/services/assistance';
import { smartHomeService } from './backend/services/smarthome';
import { oakterRemoteService } from './backend/services/oakterremote';

// assistantService.initialize();
// mqttService.initialize();
smartHomeService.initialize();
oakterRemoteService.initialize();
cronJobs.initialize();
// smartNestService.initialize();
httpServer.initialize();