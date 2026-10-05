export class StringUtils {
  static Empty = '';

  static Capitalize = (value: string): string =>
    value.length === 0 ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

  static Format = (template: string, ...values: string[]): string =>
    values.reduce((result, value, index) => result.replaceAll(`{${index}}`, value), template)
}
