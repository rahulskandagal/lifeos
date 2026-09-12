import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// LifeOS uses Node's built-in SQLite (node:sqlite) as the default embedded
// database so the app runs with zero external services in development and
// in this sandbox. For production, swap this module for a `pg` Pool against
// PostgreSQL — see docs/postgres-schema.sql and README "Database Setup".
//
// The rest of the app talks to `src/lib/db/repositories/*`, not directly to
// this client, so swapping the storage engine only requires changes here.

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "lifeos.db");

declare global {
  // eslint-disable-next-line no-var
  var __lifeosDb: DatabaseSync | undefined;
}

function createConnection(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  const schemaPath = path.join(process.cwd(), "src", "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);

  return db;
}

// Reuse a single connection across hot-reloads in dev.
export const db: DatabaseSync = global.__lifeosDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  global.__lifeosDb = db;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function newId(prefix = ""): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid}` : uuid;
}

/** Convert a SQLite row (0/1 ints) to booleans for the given keys. */
export function toBool<T extends Record<string, unknown>>(row: T, keys: (keyof T)[]): T {
  const copy = { ...row };
  for (const k of keys) {
    // @ts-expect-error - runtime coercion
    copy[k] = !!copy[k];
  }
  return copy;
}
