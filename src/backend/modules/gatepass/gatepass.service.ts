import { ObjectId } from 'mongodb';
import type { Collection, Db, Filter, FindOptions } from 'mongodb';
import type { MongoService } from '../mongo/mongo.service.js';
import { MongoDatabases } from '../../core/constants.js';
import { ObjectUtils } from '../../core/utils/object.js';
import type {
  FinalizeGatepass,
  GatepassPatch,
  GatepassDocument,
  Party,
  PartyDocument,
} from './gatepass.types.js';

export class GatepassService {
  private readonly mongoService: MongoService;
  private readonly database: Db;

  constructor({ mongoService }: { mongoService: MongoService }) {
    this.mongoService = mongoService;
    this.database = mongoService.database(MongoDatabases.EMandi.database);
  }

  private get queued(): Collection<GatepassDocument> {
    return this.database.collection<GatepassDocument>(MongoDatabases.EMandi.collections.queued);
  }

  private get processed(): Collection<GatepassDocument> {
    return this.database.collection<GatepassDocument>(MongoDatabases.EMandi.collections.processed);
  }

  private get parties(): Collection<PartyDocument> {
    return this.database.collection<PartyDocument>(MongoDatabases.EMandi.collections.parties);
  }

  listQueued = async (): Promise<GatepassDocument[]> => {
    const options: FindOptions = { sort: { createdOn: 1, _id: 1 } };
    return this.queued.find({}, options).toArray();
  }

  listProcessed = async (): Promise<GatepassDocument[]> => {
    const options: FindOptions = { sort: { createdOn: 1, _id: 1 } };
    return this.processed.find({}, options).toArray();
  }

  peek = async (): Promise<GatepassDocument | null> =>
    this.queued.findOne({}, { sort: { createdOn: 1, _id: 1 } });

  moveQueuedToProcessed = async (patch: FinalizeGatepass = {}): Promise<GatepassDocument | null> =>
    this.move(this.queued, this.processed, {}, patch);

  moveProcessedToQueued = async (id: string): Promise<GatepassDocument | null> =>
    this.move(this.processed, this.queued, { _id: new ObjectId(id) });

  deleteQueued = async (id: string): Promise<boolean> => {
    const result = await this.queued.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  };

  listParties = async (): Promise<PartyDocument[]> =>
    this.parties.find({}, { sort: { name: 1 } }).toArray();

  addParty = async (party: Party): Promise<ObjectId> => {
    const document = ObjectUtils.SanitizeObject(party);
    const result = await this.parties.insertOne({ _id: new ObjectId(), ...document });
    return result.insertedId;
  };

  updateParty = async (id: string, party: Party): Promise<boolean> => {
    const update = ObjectUtils.SanitizeObject(party);
    const result = await this.parties.updateOne({ _id: new ObjectId(id) }, { $set: update });
    return result.matchedCount === 1;
  };

  deleteParty = async (id: string): Promise<boolean> => {
    const result = await this.parties.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  };

  createGatepass = async (gatepass: Omit<GatepassDocument, '_id'>, id: ObjectId): Promise<ObjectId> => {
    await this.queued.insertOne({ _id: id, ...gatepass });
    return id;
  };

  private move = async (
    source: Collection<GatepassDocument>,
    destination: Collection<GatepassDocument>,
    filter: Filter<GatepassDocument>,
    patch: GatepassPatch = {},
  ): Promise<GatepassDocument | null> =>
    this.mongoService.withTransaction(async (session) => {
      const record = await source.findOneAndDelete(filter, { sort: { createdOn: 1, _id: 1 }, session });
      if (!record) return null;

      const moved = { ...record };
      if (patch.gatepassId !== undefined) moved.gatepassId = patch.gatepassId;
      if (patch.ninerId !== undefined) moved.ninerId = patch.ninerId;
      if (patch.rate !== undefined) moved.rate = patch.rate;

      await destination.insertOne(moved, { session });
      return moved;
    });
}
