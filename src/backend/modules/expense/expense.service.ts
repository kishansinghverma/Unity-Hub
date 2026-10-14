import { ObjectId } from 'mongodb';
import type { Collection, Db } from 'mongodb';
import type { MongoService } from '../mongo/mongo.service.js';
import { MongoDatabases } from '../../core/constants.js';
import type { Location, LocationDocument } from './expense.types.js';

export class ExpenseService {
  private readonly database: Db;

  constructor({ mongoService }: { mongoService: MongoService }) {
    this.database = mongoService.database(MongoDatabases.Expense.database);
  }

  private get locations(): Collection<LocationDocument> {
    return this.database.collection<LocationDocument>(MongoDatabases.Expense.collections.location);
  }

  addLocation = async (location: Location): Promise<ObjectId> => {
    const id = new ObjectId();
    await this.locations.insertOne({ _id: id, ...location });
    return id;
  };
}
