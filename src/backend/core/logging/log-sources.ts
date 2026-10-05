export const LogSource = {
  HTTP: 'HTTP',
  File: 'File',
  WhatsApp: 'WhatsApp',
  Emandi: 'Emandi',
  OakterRemote: 'OakterRemote',
  Cron: 'Cron'
} as const;

export type LogSource = (typeof LogSource)[keyof typeof LogSource];
