import { MimeTypes } from '../constants.js';

export class FileUtils {
  static GetMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
    return MimeTypes[extension as keyof typeof MimeTypes] ?? MimeTypes.default;
  };
}
