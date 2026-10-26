import { asClass, asValue, createContainer, InjectionMode } from 'awilix';
import type { Env } from '../../config/env.js';
import { GatepassOperation } from '../../modules/gatepass/gatepass.operations.js';
import { GatepassService } from '../../modules/gatepass/gatepass.service.js';
import { MongoOperation } from '../../modules/mongo/mongo.operations.js';
import { MongoService } from '../../modules/mongo/mongo.service.js';
import { S3StorageOperation } from '../../modules/s3storage/s3storage.operations.js';
import { S3StorageService } from '../../modules/s3storage/s3storage.service.js';
import { WhatsAppOperation } from '../../modules/whatsapp/whatsapp.operations.js';
import { WhatsAppService } from '../../modules/whatsapp/whatsapp.service.js';
import { ImagingOperation } from '../../modules/imaging/imaging.operations.js';
import { ImagingService } from '../../modules/imaging/imaging.service.js';
import { FileOperation } from '../../modules/file/file.operations.js';
import { FileService } from '../../modules/file/file.service.js';
import { KeyVaultService } from '../../modules/keyvault/keyvault.service.js';
import { EmandiOperation } from '../../modules/emandi/emandi.operations.js';
import type { Logger } from '../logging/logger.js';
import { OakterRemoteOperation } from '../../modules/oakterRemote/oakterRemote.operations.js';
import { OakterRemoteService } from '../../modules/oakterRemote/oakterRemote.service.js';
import { CronJobsService } from '../../modules/cronJobs/cronJobs.service.js';
import { CronJobsOperation } from '../../modules/cronJobs/cronJobs.operations.js';
import { ExpenseOperation } from '../../modules/expense/expense.operations.js';
import { ExpenseService } from '../../modules/expense/expense.service.js';
import { HealthOperation } from '../../modules/health/health.operations.js';

export interface AppCradle {
  config: Env;
  logger: Logger;
  gatepassService: GatepassService;
  gatepassOperation: GatepassOperation;
  mongoService: MongoService;
  mongoOperation: MongoOperation;
  s3StorageService: S3StorageService;
  s3StorageOperation: S3StorageOperation;
  whatsappService: WhatsAppService;
  whatsappOperation: WhatsAppOperation;
  imagingService: ImagingService;
  imagingOperation: ImagingOperation;
  fileService: FileService;
  fileOperation: FileOperation;
  keyVaultService: KeyVaultService;
  emandiOperation: EmandiOperation;
  oakterRemoteService: OakterRemoteService;
  oakterRemoteOperation: OakterRemoteOperation;
  cronJobsService: CronJobsService;
  cronJobsOperation: CronJobsOperation;
  expenseService: ExpenseService;
  expenseOperation: ExpenseOperation;
  healthOperation: HealthOperation;
}

export function buildContainer(config: Env, logger: Logger) {
  const container = createContainer<AppCradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    config: asValue(config),
    logger: asValue(logger),
    gatepassService: asClass(GatepassService).singleton(),
    gatepassOperation: asClass(GatepassOperation).singleton(),
    mongoService: asClass(MongoService).singleton(),
    mongoOperation: asClass(MongoOperation).singleton(),
    s3StorageService: asClass(S3StorageService).singleton(),
    s3StorageOperation: asClass(S3StorageOperation).singleton(),
    whatsappService: asClass(WhatsAppService).singleton(),
    whatsappOperation: asClass(WhatsAppOperation).singleton(),
    imagingService: asClass(ImagingService).singleton(),
    imagingOperation: asClass(ImagingOperation).singleton(),
    fileService: asClass(FileService).singleton(),
    fileOperation: asClass(FileOperation).singleton(),
    keyVaultService: asClass(KeyVaultService).singleton(),
    emandiOperation: asClass(EmandiOperation).singleton(),
    oakterRemoteService: asClass(OakterRemoteService).singleton(),
    oakterRemoteOperation: asClass(OakterRemoteOperation).singleton(),
    cronJobsService: asClass(CronJobsService).singleton(),
    cronJobsOperation: asClass(CronJobsOperation).singleton(),
    expenseService: asClass(ExpenseService).singleton(),
    expenseOperation: asClass(ExpenseOperation).singleton(),
    healthOperation: asClass(HealthOperation).singleton()
  });

  return container;
}
