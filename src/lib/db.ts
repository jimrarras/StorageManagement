import { drizzle } from "drizzle-orm/sqlite-proxy";
import Database from "@tauri-apps/plugin-sql";
import * as schema from "./schema";

let _db: ReturnType<typeof createDrizzle> | null = null;
let _sqlite: Database | null = null;

function createDrizzle(sqlite: Database) {
  return drizzle<typeof schema>(
    async (sql, params, method) => {
      if (method === "run") {
        await sqlite.execute(sql, params as unknown[]);
        return { rows: [] };
      }
      const rows = await sqlite.select<Record<string, unknown>[]>(
        sql,
        params as unknown[]
      );
      return { rows };
    },
    { schema }
  );
}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT NOT NULL,
    action TEXT NOT NULL,
    quantity_change INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

export async function initDatabase() {
  if (_db) return _db;

  _sqlite = await Database.load("sqlite:storage.db");

  for (const migration of MIGRATIONS) {
    await _sqlite.execute(migration);
  }

  _db = createDrizzle(_sqlite);
  return _db;
}

export function getDb() {
  if (!_db) throw new Error("Database not initialized. Call initDatabase() first.");
  return _db;
}
