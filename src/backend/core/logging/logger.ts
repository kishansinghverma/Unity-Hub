import type { LogSource } from './log-sources.js';

type LoggerTarget = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export type ScopedLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
};

export type Logger = {
  for: (source: LogSource) => ScopedLogger;
};

export const createLogger = (target: LoggerTarget): Logger => ({
  for: (source) => ({
    info: (message) => target.info(`[${source}] ${message}`),
    warn: (message) => target.warn(`[${source}] ${message}`),
    error: (message) => target.error(`[${source}] ${message}`),
  }),
});
