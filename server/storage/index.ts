import { createDb } from "../db";
import { MemStorage } from "./mem";
import { PgStorage } from "./pg";
import type { IStorage } from "./types";

const preferMemory =
  process.env.USE_IN_MEMORY_STORAGE === "true" || process.env.USE_SAMPLE_DATA === "true";
const useProductionData = process.env.USE_PRODUCTION_DATA === "true";
const shouldSeedDemoData = process.env.SEED_DEMO_DATA !== "false";
const localDatabaseUrl = process.env.DATABASE_URL;
const productionDatabaseUrl = process.env.PRODUCTION_DATABASE_URL;

function logChoice(message: string) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} [storage] ${message}`);
}

function buildPgStorage({
  connectionString,
  label,
  seedDemoData,
}: {
  connectionString: string;
  label: string;
  seedDemoData: boolean;
}) {
  const db = createDb(connectionString);
  logChoice(`Using PostgreSQL storage (${label}).`);
  return new PgStorage(db, { seedDemoData, label });
}

let storage: IStorage;

if (useProductionData) {
  if (!productionDatabaseUrl) {
    throw new Error(
      "USE_PRODUCTION_DATA is true but PRODUCTION_DATABASE_URL is not set. Provide a read-only connection string.",
    );
  }
  storage = buildPgStorage({
    connectionString: productionDatabaseUrl,
    label: "production",
    seedDemoData: false,
  });
} else if (localDatabaseUrl) {
  storage = buildPgStorage({
    connectionString: localDatabaseUrl,
    label: "local",
    seedDemoData: shouldSeedDemoData,
  });
} else if (preferMemory) {
  const reason =
    process.env.USE_IN_MEMORY_STORAGE === "true"
      ? "flag USE_IN_MEMORY_STORAGE"
      : "flag USE_SAMPLE_DATA";
  logChoice(`Using in-memory storage (${reason}).`);
  storage = new MemStorage();
} else {
  logChoice("No database configured; defaulting to in-memory fixtures.");
  storage = new MemStorage();
}

export { storage };
export * from "./types";
