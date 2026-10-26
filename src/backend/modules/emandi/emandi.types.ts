import type { GatepassPayload, NinerPayload } from '../file/file.types.js';

export type Cell = { text?: string; parts?: string[]; nested?: string[][]; span?: number; bold?: boolean; align?: 'left' | 'center' | 'right'; valign?: 'top' | 'center' | 'bottom'; fill?: string; size?: number };
export type TextOptions = { width: number; align: 'left' | 'center' | 'right' };

export type EmandiActions = { print: boolean; download: boolean; share: boolean };
export type GatepassRequest = { data: Omit<GatepassPayload, 'qr'>; actions: EmandiActions; qr?: string };
export type NinerRequest = { data: Omit<NinerPayload, 'qr'>; actions: EmandiActions; qr?: string };
export type ActionResult = { status: 'success' | 'not_requested' | 'failure'; message?: string; url?: string };
export type DocumentResponse = { fileName: string; actions: { download: ActionResult; share: ActionResult; print: ActionResult } };
