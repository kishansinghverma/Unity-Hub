import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError, UpstreamApiError } from '../../core/errors/app-error.js';
import { Configuration } from '../../core/utils/configuration.js';
import type { StorageFile } from './s3storage.types.js';

export class S3StorageService {
  private readonly url = Configuration.GetSetting('SUPABASE_URL');
  private readonly secretKey = Configuration.GetSetting('SUPABASE_SECRET_KEY');
  private readonly bucket = Configuration.GetSetting('SUPABASE_STORAGE_BUCKET');
  
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(this.url, this.secretKey);
  }

  upload = async (path: string, file: Buffer, contentType: string): Promise<StorageFile> => {
    const uploadOptions = { contentType, upsert: true };
    const { data, error } = await this.client.storage.from(this.bucket).upload(path, file, uploadOptions);

    if (error) throw new UpstreamApiError('Storage upload failed', 502, error);
    return data;
  };

  download = async (path: string): Promise<Buffer> => {
    const { data, error } = await this.client.storage.from(this.bucket).download(path);

    if (error?.statusCode === '404') throw new NotFoundError('File not found', undefined, error);
    if (error) throw new UpstreamApiError('File retrieval failed', 502, error);
    if (!data) throw new NotFoundError('No file content');
    return Buffer.from(await data.arrayBuffer());
  };
}
