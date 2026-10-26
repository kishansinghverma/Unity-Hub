export const LogSource = {
  HTTP: 'HTTP',
  File: 'File',
  WhatsApp: 'WhatsApp',
  OakterRemote: 'OakterRemote',
  Cron: 'Cron'
} as const;

export type LogSource = (typeof LogSource)[keyof typeof LogSource];
