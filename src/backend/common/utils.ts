import { ObjectId } from "mongodb";

export const getEpoch = () => new Date().getTime();

export const mongoId = (id: string) => new ObjectId(id);