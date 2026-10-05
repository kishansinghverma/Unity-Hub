import { Emandi, Snippets } from '../../core/constants.js';
import { NotFoundError, ValidationError } from '../../core/errors/app-error.js';
import type { OperationResponse } from '../../core/http/action-response.js';
import type { FileOperation } from '../file/file.operations.js';
import type { GatepassPayload, GatepassResponse, NinerPayload, NinerResponse } from '../file/file.types.js';
import type { ImagingOperation } from '../imaging/imaging.operations.js';
import type { WhatsAppOperation } from '../whatsapp/whatsapp.operations.js';
import type { ActionResult, DocumentResponse, EmandiActions, EmandiCredentials, EmandiListResponse, EmandiQuery, EmandiSessionInfo, GatepassRequest, NinerRequest } from './emandi.types.js';
import type { EmandiService } from './emandi.service.js';
import { StringUtils } from '../../core/utils/string.js';

export class EmandiOperation {
  private readonly emandiService: EmandiService;
  private readonly fileOperation: FileOperation;
  private readonly imagingOperation: ImagingOperation;
  private readonly whatsappOperation: WhatsAppOperation;

  constructor({ emandiService, fileOperation, imagingOperation, whatsappOperation }: { emandiService: EmandiService; fileOperation: FileOperation; imagingOperation: ImagingOperation; whatsappOperation: WhatsAppOperation }) {
    this.emandiService = emandiService;
    this.fileOperation = fileOperation;
    this.imagingOperation = imagingOperation;
    this.whatsappOperation = whatsappOperation;
  }

  initialize = async (credentials: EmandiCredentials): Promise<OperationResponse<{ initialized: boolean }>> => {
    await this.emandiService.initialize(credentials);
    return { content: { initialized: true } };
  };

  getSessionStatus = async (): Promise<OperationResponse<EmandiSessionInfo>> => ({ content: await this.emandiService.getSessionStatus() });


  executeGatepassRequest = async (request: GatepassRequest): Promise<OperationResponse<DocumentResponse>> => {
    const payload = request.source === 'payload' ? request.data : await this.getGatepassRecord(request);
    const fileName = await this.fileOperation.generateGatepass(payload).then((response) => response.content!.fileName);
    const caption = payload.kreta_mandi ? `*Gatepass:* ${payload.kreta_mandi}` : "*Gatepass*";
    const content = await this.executeActions(fileName, request.actions, caption);
    return this.hasActionFailure(content) ? { statusCode: 207, content } : { content };
  };

  executeNinerRequest = async (request: NinerRequest): Promise<OperationResponse<DocumentResponse>> => {
    const payload = request.source === 'payload' ? request.data : await this.getNinerRecord(request);
    const fileName = await this.fileOperation.generateNiner(payload).then((response) => response.content!.fileName);
    const caption = payload.kreta_details ? `*Niner:* ${payload.kreta_details}` : "*Niner*";
    const content = await this.executeActions(fileName, request.actions, caption);
    return this.hasActionFailure(content) ? { statusCode: 207, content } : { content };
  };

  private getRecord = async <Record>(url: string, request: Exclude<GatepassRequest | NinerRequest, { source: 'payload' }>): Promise<Record> => {
    const query: EmandiQuery = request.source === 'latest' ? this.getLatestQuery() : this.getRecordQuery(request.data.id, request.data.date);
    const response = await this.emandiService.getRecords<Record>(url, query);
    const records = (response as EmandiListResponse<Record>).data ?? [];
    const record = records[0];
    if (!record) throw new NotFoundError('E-Mandi record not found');
    return record;
  };

  private getGatepassRecord = async (request: Exclude<GatepassRequest, { source: 'payload' }>): Promise<GatepassPayload> => {
    const record = await this.getRecord<GatepassResponse>(Emandi.Routes.GatepassList, request);
    return {
      ...record,
      qr: await this.imagingOperation.generateQr({
        text: StringUtils.Format(Snippets.GatepassQrData, record.serial_number, record.trader_name, record.crop_name, record.crop_weight, record.vehicle_no, record.id, record.dateofissue, record.timeofissue),
        version: 14,
        maskPattern: 2,
        width: 1620
      })
    };
  };

  private getNinerRecord = async (request: Exclude<NinerRequest, { source: 'payload' }>): Promise<NinerPayload> => {
    const record = await this.getRecord<NinerResponse>(Emandi.Routes.NinerList, request);
    return {
      ...record,
      qr: await this.imagingOperation.generateQr({
        text: StringUtils.Format(Snippets.NinerQrData, record.serial_number, record.mandi_name_eng, record.crop_name_eng),
        version: 8,
        maskPattern: 6,
        width: 1140
      })
    };
  };

  private executeActions = async (fileName: string, actions: EmandiActions, caption: string): Promise<DocumentResponse> => {
    const download: ActionResult = actions.download ? { status: 'success', url: `/api/files/${fileName}` } : { status: 'not_requested' };
    const share: ActionResult = actions.share ? await this.shareFile(fileName, caption) : { status: 'not_requested' };
    const print: ActionResult = actions.print ? { status: 'success' } : { status: 'not_requested' };
    // TODO: Wire MQTT printing when the print workflow is implemented.
    return { fileName, actions: { download, share, print } };
  };

  private shareFile = async (fileName: string, caption?: string): Promise<ActionResult> => {
    try {
      const buffer = await this.fileOperation.readFile(fileName);
      await this.whatsappOperation.sendFileToEmandiGroup({ file: { buffer, filename: fileName }, caption });
      return { status: 'success' };
    }
    catch (error) {
      return { status: 'failure', message: error instanceof Error ? error.message : 'File sharing failed' };
    }
  };

  private getLatestQuery = (): EmandiQuery => {
    const today = new Date();
    return { fromDate: this.formatDate(new Date(today.getTime() - 7 * 86_400_000)), toDate: this.formatDate(today), limit: 1 };
  };

  private getRecordQuery = (id: string, date: string): EmandiQuery => {
    const normalizedDate = this.formatDate(new Date(date));
    return { fromDate: normalizedDate, toDate: normalizedDate, limit: 1, recordId: id };
  };

  private formatDate = (date: Date): string => {
    if (Number.isNaN(date.getTime())) throw new ValidationError('A valid date is required');
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  private hasActionFailure = ({ actions }: DocumentResponse): boolean => Object.values(actions).some(({ status }) => status === 'failure');
}
