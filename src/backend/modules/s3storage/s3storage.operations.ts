import type { S3StorageService } from './s3storage.service.js';
import type { StorageFile, FileUpload } from './s3storage.types.js';
import { StringUtils } from '../../core/utils/string.js';
import { FileUtils } from '../../core/utils/file.js';

export class S3StorageOperation {
  private readonly s3StorageService: S3StorageService;

  constructor({ s3StorageService }: { s3StorageService: S3StorageService }) {
    this.s3StorageService = s3StorageService;
  }

  uploadTaggingImages = (imageType: 'vehicle' | 'plate', gatepassId: string, image: FileUpload): Promise<StorageFile> => {
    const extension = image.filename.split('.').pop()?.toLowerCase() ?? '';
    const contentType = FileUtils.GetMimeType(image.filename);
    const fileName = `VehicleTagging/${StringUtils.Capitalize(imageType)}/${gatepassId}.${extension}`;
    return this.s3StorageService.upload(fileName, image.buffer, contentType);
  }

  download = (path: string): Promise<Buffer> => this.s3StorageService.download(path);
}
