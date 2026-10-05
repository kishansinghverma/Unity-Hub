import type { GatepassPayload, GatepassResponse, NinerPayload, NinerResponse } from '../file/file.types.js';

export type Cell = { text?: string; parts?: string[]; nested?: string[][]; span?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; fill?: string; size?: number };
export type TextOptions = { width: number; align: 'left' | 'center' | 'right' };

export type EmandiCredentials = { username: string; password: string };
export type EmandiSession = { username: string; role: string; authenticatedAt: string; expiresAt: string };
export type EmandiSessionInfo = Partial<EmandiSession> & { authenticated: boolean; isExpired: boolean; cookieCount: number };
export type EmandiActions = { print: boolean; download: boolean; share: boolean };
export type RecordRequest = { source: 'latest'; actions: EmandiActions } | { source: 'id'; data: { id: string; date: string }; actions: EmandiActions };
export type GatepassRequest = RecordRequest | { source: 'payload'; data: GatepassPayload; actions: EmandiActions };
export type NinerRequest = RecordRequest | { source: 'payload'; data: NinerPayload; actions: EmandiActions };
export type EmandiQuery = { fromDate: string; toDate: string; limit: number; recordId?: string };
export type EmandiListResponse<Record> = { data?: Record[] };
export type LoginToken = { requestToken: string; captchaImageUrl: string; captchaText: string; captchaToken: string };
export type LoginResponse = { succeeded?: boolean; role?: string; message?: string };
export type EmandiResponse<Record> = GatepassResponse | NinerResponse | EmandiSessionInfo | Record;
export type ActionResult = { status: 'success' | 'not_requested' | 'failure'; message?: string; url?: string };
export type DocumentResponse = { fileName: string; actions: { download: ActionResult; share: ActionResult; print: ActionResult } };
