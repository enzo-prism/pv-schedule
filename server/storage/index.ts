import { createDb } from "../db.js";
import { MemStorage } from "./mem.js";
import { PgStorage } from "./pg.js";
import type { IStorage } from "./types.js";

const preferMemory =
  process.env.USE_IN_MEMORY_STORAGE === "true" || process.env.USE_SAMPLE_DATA === "true";
const vercelEnv = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const hardcodedFlag = process.env.USE_HARDCODED_DATA?.trim();
const useHardcodedData =
  hardcodedFlag && hardcodedFlag.length > 0
    ? hardcodedFlag.toLowerCase() === "true"
    : vercelEnv;
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

if (useHardcodedData) {
  const sourceLabel = hardcodedFlag && hardcodedFlag.length > 0 ? "USE_HARDCODED_DATA" : "Vercel default";
  logChoice(`Using hardcoded fixture data (${sourceLabel}).`);
  storage = new MemStorage();
} else if (useProductionData) {
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
export * from "./types.js";
