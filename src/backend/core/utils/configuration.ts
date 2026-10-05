import 'dotenv/config';
import { ServerError } from '../errors/app-error.js';

export class Configuration {
  private static read = (key: string): string | null => {
    const value = process.env[key];
    return value?.trim() ? value : null;
  };

  static GetSetting = (key: string): string => {
    const value = Configuration.read(key);
    if (value === null) throw new ServerError(`Missing configuration: ${key}`);
    return value;
  };

  static TryGetSetting = (key: string): string | null => Configuration.read(key);
}
