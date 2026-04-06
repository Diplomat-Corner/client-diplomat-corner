import mongoose from "mongoose";
import { dbLogger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "diplomat-corner";

interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
  profilerConfigured: boolean;
}

const cached: MongooseCache = (
  global as unknown as { mongoose?: MongooseCache }
).mongoose || { conn: null, promise: null, profilerConfigured: false };

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

    const slowMs = process.env.MONGO_PROFILE_SLOW_MS;
    if (!cached.profilerConfigured && slowMs && slowMs !== "0") {
      const slowms = Number(slowMs);
      if (!Number.isNaN(slowms) && slowms > 0) {
        try {
          const db = cached.conn.db;
          if (!db) {
            throw new Error("No database handle on connection");
          }
          await db.command({ profile: 1, slowms });
          cached.profilerConfigured = true;
          dbLogger.info(
            `MongoDB profiler enabled (level 1, slowms=${slowms}). Set MONGO_PROFILE_SLOW_MS=0 to disable on next deploy.`
          );
        } catch (e) {
          dbLogger.warn("Could not enable MongoDB profiler:", e);
        }
      }
    }

    return cached.conn;
  } catch (error) {
    dbLogger.error("Failed to connect to MongoDB:", error);
    cached.promise = null;
    throw error;
  }
};
