import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MimeTypes } from '../../core/constants.js';
import { NotFoundError, ValidationError } from '../../core/errors/app-error.js';
import { FileUtils } from '../../core/utils/file.js';
import type { Logger } from '../../core/logging/logger.js';
import { GatepassRenderer } from './file.render.gatepass.js';
import { NinerRenderer } from './file.render.niner.js';
import type { GatepassPayload, NinerPayload, FileUpload } from './file.types.js';

export class FileService {
  private readonly storagePath = path.resolve('src/backend/static');
  private readonly gatepassRenderer: GatepassRenderer;
  private readonly ninerRenderer: NinerRenderer;

  constructor({ logger }: { logger: Logger }) {
    this.gatepassRenderer = new GatepassRenderer({ logger });
    this.ninerRenderer = new NinerRenderer({ logger });
  }

  generateGatepass = async (payload: GatepassPayload): Promise<string> => this.saveGeneratedFile(
    await this.gatepassRenderer.generate(payload)
  );

  generateNiner = async (payload: NinerPayload): Promise<string> => this.saveGeneratedFile(
    await this.ninerRenderer.generate(payload)
  );

  saveIncomingFile = async (file: FileUpload): Promise<string> => {
    if (FileUtils.GetMimeType(file.filename) !== MimeTypes.pdf) throw new ValidationError('Only PDF files are supported');

    const fileName = `${randomUUID()}${path.extname(file.filename).toLowerCase()}`;
    await this.ensureStorage();
    await fs.writeFile(path.join(this.storagePath, fileName), file.buffer);
    return fileName;
  };

  readFile = async (fileName: string): Promise<Buffer> => {
    try {
      return await fs.readFile(path.join(this.storagePath, path.basename(fileName)));
    }
    catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') throw new NotFoundError('File not found');
      throw error;
    }
  };

  private saveGeneratedFile = async (content: Buffer): Promise<string> => {
    await this.ensureStorage();
    const fileName = `${randomUUID()}.pdf`;
    await fs.writeFile(path.join(this.storagePath, fileName), content);
    return fileName;
  };

  private ensureStorage = async (): Promise<void> => {
    await fs.mkdir(this.storagePath, { recursive: true });
  };
}
