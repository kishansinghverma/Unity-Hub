import { ObjectId } from 'mongodb';
import { Snippets } from '../../core/constants.js';
import { StringUtils } from '../../core/utils/string.js';
import type { OperationResponse } from '../../core/http/action-response.js';
import type { GatepassService } from './gatepass.service.js';
import type { S3StorageOperation } from '../s3storage/s3storage.operations.js';
import type { WhatsAppOperation } from '../whatsapp/whatsapp.operations.js';
import { ObjectUtils } from '../../core/utils/object.js';
import type {
  CreateGatepass,
  CreateGatepassResponse,
  FinalizeGatepass,
  GatepassPayload,
  GatepassDocument,
  Party,
  PartyDocument,
} from './gatepass.types.js';

export class GatepassOperation {
  private readonly gatepassService: GatepassService;
  private readonly s3StorageOperation: S3StorageOperation;
  private readonly whatsappOperation: WhatsAppOperation;

  constructor({ gatepassService, s3StorageOperation, whatsappOperation }: {
    gatepassService: GatepassService;
    s3StorageOperation: S3StorageOperation;
    whatsappOperation: WhatsAppOperation;
  }) {
    this.gatepassService = gatepassService;
    this.s3StorageOperation = s3StorageOperation;
    this.whatsappOperation = whatsappOperation;
  }

  push = async (data: CreateGatepass): Promise<OperationResponse<CreateGatepassResponse>> => {
    const { vehicleImage, plateImage, ...fields } = data;
    const gatepassId = new ObjectId();

    const gatepass: GatepassPayload = { ...fields };

    if (vehicleImage) {
      const vehicleFile = await this.s3StorageOperation.uploadTaggingImages('vehicle', gatepassId.toHexString(), vehicleImage);
      gatepass.rawVehicleImage = vehicleFile.path;
    }

    if (plateImage) {
      const plateFile = await this.s3StorageOperation.uploadTaggingImages('plate', gatepassId.toHexString(), plateImage);
      gatepass.rawNumberPlateImage = plateFile.path;
    }

    await this.gatepassService.createGatepass({ ...gatepass, createdOn: Date.now() }, gatepassId);

    const notification = await this.whatsappOperation
      .sendMessageToEmandiGroup(StringUtils.Format(Snippets.GatepassRequested, fields.party.name, fields.party.mandi, fields.party.state))
      .then(({ content }) => content?.idMessage)
      .catch(({ message }) => message);

    return { statusCode: 201, content: ObjectUtils.SanitizeObject({ insertedId: gatepassId, notification }) };
  };

  listQueued = async (): Promise<OperationResponse<GatepassDocument[]>> => ({
    content: await this.gatepassService.listQueued(),
  });

  listProcessed = async (): Promise<OperationResponse<GatepassDocument[]>> => ({
    content: await this.gatepassService.listProcessed(),
  });

  peek = async (): Promise<OperationResponse<GatepassDocument>> => {
    const content = await this.gatepassService.peek();
    return content ? { content } : { statusCode: 204 };
  };

  pop = async (): Promise<OperationResponse<GatepassDocument>> => {
    const content = await this.gatepassService.moveQueuedToProcessed();
    return content ? { content } : { statusCode: 404 };
  };

  finalize = async (
    data: FinalizeGatepass,
  ): Promise<OperationResponse<{ insertedId: ObjectId }>> => {
    const content = await this.gatepassService.moveQueuedToProcessed(data);
    return content ? { content: { insertedId: content._id } } : { statusCode: 404 };
  };

  requeue = async (id: string): Promise<OperationResponse<GatepassDocument>> => {
    const content = await this.gatepassService.moveProcessedToQueued(id);
    return content ? { content } : { statusCode: 404 };
  };

  deleteQueued = async (id: string): Promise<OperationResponse<{ _id: string }>> => {
    if (!(await this.gatepassService.deleteQueued(id))) return { statusCode: 404 };
    return { content: { _id: id } };
  };

  listParties = async (): Promise<OperationResponse<PartyDocument[]>> => ({
    content: await this.gatepassService.listParties(),
  });

  addParty = async (party: Party): Promise<OperationResponse<{ insertedId: ObjectId }>> => ({
    statusCode: 201,
    content: { insertedId: await this.gatepassService.addParty(party) },
  });

  updateParty = async (id: string, party: Party): Promise<OperationResponse<{ _id: string }>> => {
    if (!(await this.gatepassService.updateParty(id, party))) return { statusCode: 404 };
    return { content: { _id: id } };
  };

  deleteParty = async (id: string): Promise<OperationResponse<{ _id: string }>> => {
    if (!(await this.gatepassService.deleteParty(id))) return { statusCode: 404 };
    return { content: { _id: id } };
  };
}
