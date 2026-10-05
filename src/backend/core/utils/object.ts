export class ObjectUtils {
  static SanitizeObject = <T extends object>(value?: T): T => {
    if (!value) return {} as T;
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== null && entry !== undefined)) as T;
  }
}
