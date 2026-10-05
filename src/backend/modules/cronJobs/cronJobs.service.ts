import cron, { type ScheduledTask } from 'node-cron';
import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { CronJobs } from '../../core/constants.js';
import { LogSource } from '../../core/logging/log-sources.js';
import type { Logger, ScopedLogger } from '../../core/logging/logger.js';

export class CronJobsService {
  private readonly storagePath = path.resolve(CronJobs.StaticPath);
  private readonly logger: ScopedLogger;
  private task: ScheduledTask | null = null;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger.for(LogSource.Cron);
  }

  start = (): void => {
    if (this.task) return;

    this.task = cron.schedule(CronJobs.CleanupSchedule, () => this.clearPdfFiles().catch((error) => {
      this.logger.error(`Failed to clear PDF files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }), { noOverlap: true });

    this.logger.info('Cron job registered');
  };

  stop = async (): Promise<void> => {
    if (!this.task) return;
    await this.task.destroy();
    this.task = null;
  };

  private clearPdfFiles = async (): Promise<void> => {
    this.logger.info('Clearing generated PDF files');
    const files = await readdir(this.storagePath);
    await Promise.all(files.filter((file) => path.extname(file).toLowerCase() === '.pdf').map((file) => this.deleteFile(file)));
  };

  private deleteFile = async (file: string): Promise<void> => {
    try {
      await unlink(path.join(this.storagePath, file));
      this.logger.info(`File deleted: ${file}`);
    }
    catch (error) {
      this.logger.error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
}