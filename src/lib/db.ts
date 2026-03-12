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

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    location_id INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(barcode, location_id)
  )`,
  `CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT NOT NULL,
    action TEXT NOT NULL,
    quantity_change INTEGER,
    location_id INTEGER,
    to_location_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS color_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE COLLATE NOCASE,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL
  )`,
];

async function migrateForLocations(sqlite: Database) {
  // Seed Default location (idempotent)
  await sqlite.execute(
    `INSERT OR IGNORE INTO locations (id, name, created_at) VALUES (1, 'Default', datetime('now'))`
  );

  // Check if inventory already has location_id (skip if already migrated)
  const invCols = await sqlite.select<{ name: string }[]>(
    `PRAGMA table_info(inventory)`,
    []
  );
  if (!invCols.some((c) => c.name === "location_id")) {
    // Wrap destructive migration in a transaction
    await sqlite.execute(`BEGIN TRANSACTION`);
    try {
      await sqlite.execute(`CREATE TABLE inventory_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        location_id INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(barcode, location_id)
      )`);

      await sqlite.execute(`INSERT INTO inventory_new
        (id, barcode, description, quantity, location_id, sort_order, created_at, updated_at)
        SELECT id, barcode, description, quantity, 1, sort_order, created_at, updated_at
        FROM inventory`);

      await sqlite.execute(`DROP TABLE inventory`);
      await sqlite.execute(`ALTER TABLE inventory_new RENAME TO inventory`);

      // Fix autoincrement sequence after table rename
      await sqlite.execute(
        `UPDATE sqlite_sequence SET name = 'inventory' WHERE name = 'inventory_new'`
      );

      await sqlite.execute(`COMMIT`);
    } catch (e) {
      await sqlite.execute(`ROLLBACK`);
      throw e;
    }
  }

  // Add columns to activity_log (independent idempotency check)
  const actCols = await sqlite.select<{ name: string }[]>(
    `PRAGMA table_info(activity_log)`,
    []
  );
  const actColNames = actCols.map((c) => c.name);
  if (!actColNames.includes("location_id")) {
    await sqlite.execute(
      `ALTER TABLE activity_log ADD COLUMN location_id INTEGER`
    );
  }
  if (!actColNames.includes("to_location_id")) {
    await sqlite.execute(
      `ALTER TABLE activity_log ADD COLUMN to_location_id INTEGER`
    );
  }
}

export async function initDatabase() {
  if (_db) return _db;

  _sqlite = await Database.load("sqlite:storage.db");

  for (const migration of MIGRATIONS) {
    await _sqlite.execute(migration);
  }

  await migrateForLocations(_sqlite);

  // Seed default settings
  await _sqlite.execute(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('low_stock_threshold', '5')`
  );

  // Seed default color rules
  await _sqlite.execute(
    `INSERT OR IGNORE INTO color_rules (keyword, color, sort_order) VALUES ('perCP', '#ea580c', 1)`
  );
  await _sqlite.execute(
    `INSERT OR IGNORE INTO color_rules (keyword, color, sort_order) VALUES ('FITC', '#166534', 2)`
  );
  await _sqlite.execute(
    `INSERT OR IGNORE INTO color_rules (keyword, color, sort_order) VALUES ('PE', '#dc2626', 3)`
  );

  _db = createDrizzle(_sqlite);
  return _db;
}

export function getDb() {
  if (!_db) throw new Error("Database not initialized. Call initDatabase() first.");
  return _db;
}

export function getRawDb() {
  if (!_sqlite) throw new Error("Database not initialized. Call initDatabase() first.");
  return _sqlite;
}

export async function closeDatabase() {
  if (_sqlite) {
    await _sqlite.close();
  }
  _sqlite = null;
  _db = null;
}
