import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { CronJobs } from '../../core/constants.js';
import { LogSource } from '../../core/logging/log-sources.js';
import type { Logger, ScopedLogger } from '../../core/logging/logger.js';
import type { S3StorageService } from '../s3storage/s3storage.service.js';
import { staticDir } from '../../paths.js';

export class CronJobsOperation {
  private readonly storagePath = staticDir;
  private readonly logger: ScopedLogger;
  private readonly s3StorageService: S3StorageService;

  constructor({ logger, s3StorageService }: { logger: Logger; s3StorageService: S3StorageService }) {
    this.logger = logger.for(LogSource.Cron);
    this.s3StorageService = s3StorageService;
  }

  cleanupPdfFiles = async (): Promise<void> => {
    this.logger.info('Clearing generated PDF files');
    const files = await readdir(this.storagePath);
    await Promise.all(files.filter((file) => path.extname(file).toLowerCase() === '.pdf').map((file) => this.deleteFile(file)));
  };

  cleanupS3Storage = async (): Promise<void> => {
    this.logger.info('Starting S3 storage cleanup');
    const cutoffTime = Date.now() - (CronJobs.StorageRetentionDays * 24 * 60 * 60 * 1000);
    let totalDeleted = 0;

    for (const folder of CronJobs.StorageFolders) {
      const expiredPaths: string[] = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const files = await this.s3StorageService.list(folder, { limit, offset });
        if (files.length === 0) break;

        for (const file of files) {
          if (!file.id || !file.created_at) continue;
          if (new Date(file.created_at).getTime() <= cutoffTime) {
            expiredPaths.push(`${folder}/${file.name}`);
          }
        }

        if (files.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      for (let i = 0; i < expiredPaths.length; i += 100) {
        await this.s3StorageService.delete(expiredPaths.slice(i, i + 100));
      }

      totalDeleted += expiredPaths.length;
      
      if (expiredPaths.length > 0) {
        this.logger.info(`Deleted ${expiredPaths.length} expired file(s) from ${folder}`);
      }
    }

    this.logger.info(`S3 storage cleanup completed. Total files deleted: ${totalDeleted}`);
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
