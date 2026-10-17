import cron, { type ScheduledTask } from 'node-cron';
import { CronJobs } from '../../core/constants.js';
import { LogSource } from '../../core/logging/log-sources.js';
import type { Logger, ScopedLogger } from '../../core/logging/logger.js';
import type { CronJobsOperation } from './cronJobs.operations.js';

export class CronJobsService {
  private readonly logger: ScopedLogger;
  private readonly cronJobsOperation: CronJobsOperation;
  private task: ScheduledTask | null = null;

  constructor({ logger, cronJobsOperation }: { logger: Logger; cronJobsOperation: CronJobsOperation }) {
    this.logger = logger.for(LogSource.Cron);
    this.cronJobsOperation = cronJobsOperation;
  }

  start = (): void => {
    if (this.task) return;

    this.task = cron.schedule(CronJobs.CleanupSchedule, async () => {
      await this.cronJobsOperation.cleanupPdfFiles().catch((error) => {
        this.logger.error(`Failed to clear PDF files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });

      await this.cronJobsOperation.cleanupS3Storage().catch((error) => {
        this.logger.error(`Failed to cleanup S3 storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });
    }, { noOverlap: true });

    this.logger.info('Cron job registered');
  };

  stop = async (): Promise<void> => {
    if (!this.task) return;
    await this.task.destroy();
    this.task = null;
  };
}