import mongoose from "mongoose";
import { dbLogger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "diplomat-corner";

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

const cached: MongooseCache = (
  global as unknown as { mongoose?: MongooseCache }
).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
  if (cached.conn) {
    dbLogger.debug("Using cached database connection");
    return cached.conn;
  }

  if (!MONGODB_URI) {
    dbLogger.error("MONGODB_URI is missing from environment variables");
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  try {
    dbLogger.debug("Connecting to MongoDB...");
    cached.promise =
      cached.promise ||
      mongoose
        .connect(MONGODB_URI, {
          dbName: DB_NAME,
        })
        .then((m) => {
          dbLogger.info(`Connected to MongoDB database '${DB_NAME}' successfully`);
          return m.connection;
        });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    dbLogger.error("Failed to connect to MongoDB:", error);
    cached.promise = null;
    throw error;
  }
};
