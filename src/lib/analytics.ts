import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "./db";
import { inventory, activityLog } from "./schema";
import { getLowStockThreshold } from "./settings";

// --- KPI Queries ---

export async function getTotalUniqueItems(): Promise<number> {
  const db = getDb();
  const result = await db.select({ count: sql<number>`count(*)` }).from(inventory);
  return result[0]?.count ?? 0;
}

export async function getTotalQuantity(): Promise<number> {
  const db = getDb();
  const result = await db.select({ total: sql<number>`coalesce(sum(${inventory.quantity}), 0)` }).from(inventory);
  return result[0]?.total ?? 0;
}

export async function getLowStockItems(): Promise<{ id: number; barcode: string; description: string; quantity: number }[]> {
  const db = getDb();
  const threshold = await getLowStockThreshold();
  return db
    .select({
      id: inventory.id,
      barcode: inventory.barcode,
      description: inventory.description,
      quantity: inventory.quantity,
    })
    .from(inventory)
    .where(lte(inventory.quantity, threshold))
    .orderBy(inventory.quantity);
}

export async function getItemsAddedInPeriod(startDate: string): Promise<number> {
  const db = getDb();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLog)
    .where(and(eq(activityLog.action, "ADD"), gte(activityLog.createdAt, startDate)));
  return result[0]?.count ?? 0;
}

// --- Chart Queries ---

export interface DailyMovement {
  date: string;
  added: number;
  removed: number;
}

export async function getStockMovement(days: number): Promise<DailyMovement[]> {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");

  const rows = await db
    .select({
      date: sql<string>`date(${activityLog.createdAt})`,
      action: activityLog.action,
      total: sql<number>`coalesce(sum(abs(${activityLog.quantityChange})), 0)`,
    })
    .from(activityLog)
    .where(
      and(
        gte(activityLog.createdAt, startStr),
        sql`${activityLog.action} IN ('ADD', 'REMOVE')`
      )
    )
    .groupBy(sql`date(${activityLog.createdAt})`, activityLog.action)
    .orderBy(sql`date(${activityLog.createdAt})`);

  // Pivot rows into DailyMovement format
  const map = new Map<string, DailyMovement>();
  for (const row of rows) {
    const existing = map.get(row.date) ?? { date: row.date, added: 0, removed: 0 };
    if (row.action === "ADD") existing.added = row.total;
    if (row.action === "REMOVE") existing.removed = row.total;
    map.set(row.date, existing);
  }

  return Array.from(map.values());
}

export interface ReagentUsage {
  description: string;
  barcode: string;
  totalRemoved: number;
}

export async function getMostUsedReagents(days: number, limit: number = 10): Promise<ReagentUsage[]> {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");

  const rows = await db
    .select({
      barcode: activityLog.barcode,
      description: sql<string>`coalesce(${inventory.description}, ${activityLog.barcode})`,
      totalRemoved: sql<number>`coalesce(sum(abs(${activityLog.quantityChange})), 0)`,
    })
    .from(activityLog)
    .leftJoin(inventory, eq(activityLog.barcode, inventory.barcode))
    .where(
      and(
        eq(activityLog.action, "REMOVE"),
        gte(activityLog.createdAt, startStr)
      )
    )
    .groupBy(activityLog.barcode)
    .orderBy(desc(sql`sum(abs(${activityLog.quantityChange}))`))
    .limit(limit);

  return rows.map((row) => ({
    barcode: row.barcode,
    description: row.description,
    totalRemoved: row.totalRemoved,
  }));
}
