import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

let dbInstance;

const dbPath = process.env.DATABASE_URL?.replace("sqlite:", "") || "sqlite.db";

try {
  const sqlite = new Database(dbPath);
  dbInstance = drizzle(sqlite, { schema });
} catch (error) {
  console.error("Failed to initialize SQLite database:", error);
  throw error;
}

export const db = dbInstance;
export * from "./schema";
