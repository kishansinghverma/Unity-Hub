import { mqttService } from './backend/services/mqtt';
import { smartNestService } from './backend/services/smartnest';
import { cronJobs } from './backend/services/cronjobs';
import { httpServer } from './backend/services/express';
import { assistantService } from './backend/services/assistance';
import { smartHomeService } from './backend/services/smarthome';
import { oakterRemoteService } from './backend/services/oakterremote';
import { keyVault } from './backend/operations/keyvault';
import { dispatches } from './backend/operations/dispatches';
import { expenses } from './backend/operations/expense';

const initializeResource = async (name: string, initialize: () => Promise<unknown>) => {
    try { await initialize(); }
    catch (error) { console.error(`Failed to initialize ${name} service. Continuing startup:`, error); }
};

const initialize = async () => {
    await initializeResource('KeyVault', keyVault.initializeDatabase);
    await initializeResource('Dispatches', dispatches.initializeDatabase);
    await initializeResource('Expenses', expenses.initializeDatabase);
    await initializeResource('Oakter Remote', oakterRemoteService.initialize);

    // assistantService.initialize();
    // mqttService.initialize();
    // smartNestService.initialize();
    smartHomeService.initialize();
    cronJobs.initialize();
    httpServer.initialize();
};

initialize();