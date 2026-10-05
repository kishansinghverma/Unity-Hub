import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

export function generateRequestId(request: IncomingMessage): string {
  const supplied = request.headers['x-request-id'];
  return typeof supplied === 'string' && /^[\x21-\x7e]{1,128}$/.test(supplied) ? supplied : randomUUID();
}
