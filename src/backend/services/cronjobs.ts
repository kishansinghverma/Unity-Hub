import cron from 'node-cron';
import { Logger } from '../common/models';
import { constants, source } from '../common/constants';
import path from 'path';
import fs from 'fs';

class CronJobs {
    private logger: Logger;

    constructor() {
        this.logger = new Logger(source.cronjob);
    }

    private clearPdfFiles = () => {
        this.logger.warning("Clearing the PDF files...");

        const dirPath = path.join(__dirname, '../static');
        fs.readdir(dirPath, (err, files) => {
            if (err) this.logger.error(err.message)
            else {
                files.forEach((file) => {
                    fs.unlink(path.join(dirPath, file), (err) => {
                        err ? this.logger.error(err.message) : this.logger.info(`File deleted: ${file}`);
                    });
                });
            }
        });
    }

    public initialize = () => {
        this.logger.info(constants.message.cronJobRegistered);
        cron.schedule('0 1 * * *', () => {
            this.clearPdfFiles();
        });
    }
}

export const cronJobs = new CronJobs();