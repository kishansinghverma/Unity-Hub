import { Snippets } from '../../core/constants.js';
import type { OperationResponse } from '../../core/http/action-response.js';
import type { FileOperation } from '../file/file.operations.js';
import type { FileUpload, GatepassPayload, NinerPayload } from '../file/file.types.js';
import type { ImagingOperation } from '../imaging/imaging.operations.js';
import type { WhatsAppOperation } from '../whatsapp/whatsapp.operations.js';
import type { ActionResult, DocumentResponse, EmandiActions, GatepassRequest, NinerRequest } from './emandi.types.js';
import { StringUtils } from '../../core/utils/string.js';

export class EmandiOperation {
  private readonly fileOperation: FileOperation;
  private readonly imagingOperation: ImagingOperation;
  private readonly whatsappOperation: WhatsAppOperation;

  constructor({ fileOperation, imagingOperation, whatsappOperation }: { fileOperation: FileOperation; imagingOperation: ImagingOperation; whatsappOperation: WhatsAppOperation }) {
    this.fileOperation = fileOperation;
    this.imagingOperation = imagingOperation;
    this.whatsappOperation = whatsappOperation;
  }

  executeGatepassRequest = async (request: GatepassRequest): Promise<OperationResponse<DocumentResponse>> => {
    const payload: GatepassPayload = {
      ...request.data,
      qr: request.qr ?? await this.imagingOperation.generateQr({
        text: StringUtils.Format(Snippets.GatepassQrData, request.data.serial_number, request.data.trader_name, request.data.crop_name, request.data.crop_weight, request.data.vehicle_no, request.data.uniquecode, request.data.dateofissue, request.data.timeofissue),
        version: 14,
        maskPattern: 2,
        width: 162
      })
    };
    const file = await this.fileOperation.generateGatepass(payload).then((response) => response.content!);
    const caption = payload.kreta_mandi ? `*Gatepass:* ${payload.kreta_mandi}` : "*Gatepass*";
    const content = await this.executeActions(file, request.actions, caption);
    return this.hasActionFailure(content) ? { statusCode: 207, content } : { content };
  };

  executeNinerRequest = async (request: NinerRequest): Promise<OperationResponse<DocumentResponse>> => {
    const payload: NinerPayload = {
      ...request.data,
      qr: request.qr ?? await this.imagingOperation.generateQr({
        text: StringUtils.Format(Snippets.NinerQrData, request.data.serial_number, request.data.mandi_name_eng, request.data.crop_name_eng),
        version: 8,
        maskPattern: 6,
        width: 114
      })
    };
    const file = await this.fileOperation.generateNiner(payload).then((response) => response.content!);
    const caption = payload.kreta_details ? `*Niner:* ${payload.kreta_details}` : "*Niner*";
    const content = await this.executeActions(file, request.actions, caption);
    return this.hasActionFailure(content) ? { statusCode: 207, content } : { content };
  };

  private executeActions = async (file: FileUpload, actions: EmandiActions, caption: string): Promise<DocumentResponse> => {
    const { filename: fileName } = file;
    const download: ActionResult = actions.download ? { status: 'success', url: `/api/files/${fileName}` } : { status: 'not_requested' };
    const share: ActionResult = actions.share ? await this.shareFile(file, caption) : { status: 'not_requested' };
    const print: ActionResult = actions.print ? { status: 'success' } : { status: 'not_requested' };
    // TODO: Wire MQTT printing when the print workflow is implemented.
    return { fileName, actions: { download, share, print } };
  };

  private shareFile = async (file: FileUpload, caption?: string): Promise<ActionResult> => {
    try {
      await this.whatsappOperation.sendFileToEmandiGroup({ file, caption });
      return { status: 'success' };
    }
    catch (error) {
      return { status: 'failure', message: error instanceof Error ? error.message : 'File sharing failed' };
    }
  };

  private hasActionFailure = ({ actions }: DocumentResponse): boolean => Object.values(actions).some(({ status }) => status === 'failure');
}
