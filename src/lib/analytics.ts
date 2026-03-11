import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { getDb } from "./db";
import { inventory, activityLog } from "./schema";
import { getLowStockThreshold } from "./settings";

// --- KPI Queries ---

export async function getTotalUniqueItems(
  locationId?: number
): Promise<number> {
  const db = getDb();
  const where =
    locationId != null ? eq(inventory.locationId, locationId) : undefined;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(inventory)
    .where(where);
  return result[0]?.count ?? 0;
}

export async function getTotalQuantity(
  locationId?: number
): Promise<number> {
  const db = getDb();
  const where =
    locationId != null ? eq(inventory.locationId, locationId) : undefined;
  const result = await db
    .select({
      total: sql<number>`coalesce(sum(${inventory.quantity}), 0)`,
    })
    .from(inventory)
    .where(where);
  return result[0]?.total ?? 0;
}

export async function getLowStockItems(
  locationId?: number
): Promise<
  {
    id: number;
    barcode: string;
    description: string;
    quantity: number;
    locationId: number;
  }[]
> {
  const db = getDb();
  const threshold = await getLowStockThreshold();
  const conditions = [lte(inventory.quantity, threshold)];
  if (locationId != null) {
    conditions.push(eq(inventory.locationId, locationId));
  }
  return db
    .select({
      id: inventory.id,
      barcode: inventory.barcode,
      description: inventory.description,
      quantity: inventory.quantity,
      locationId: inventory.locationId,
    })
    .from(inventory)
    .where(and(...conditions))
    .orderBy(inventory.quantity);
}

export async function getItemsAddedInPeriod(
  startDate: string,
  locationId?: number
): Promise<number> {
  const db = getDb();
  const conditions = [
    eq(activityLog.action, "ADD"),
    gte(activityLog.createdAt, startDate),
  ];
  if (locationId != null) {
    conditions.push(eq(activityLog.locationId, locationId));
  }
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLog)
    .where(and(...conditions));
  return result[0]?.count ?? 0;
}

// --- Chart Queries ---

export interface DailyMovement {
  date: string;
  "προσθήκες": number;
  "αφαιρέσεις": number;
}

export async function getStockMovement(
  days: number,
  locationId?: number
): Promise<DailyMovement[]> {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");

  const conditions = [
    gte(activityLog.createdAt, startStr),
    sql`${activityLog.action} IN ('ADD', 'REMOVE')`,
  ];
  if (locationId != null) {
    conditions.push(eq(activityLog.locationId, locationId));
  }

  const rows = await db
    .select({
      date: sql<string>`date(${activityLog.createdAt})`,
      action: activityLog.action,
      total: sql<number>`coalesce(sum(abs(${activityLog.quantityChange})), 0)`,
    })
    .from(activityLog)
    .where(and(...conditions))
    .groupBy(sql`date(${activityLog.createdAt})`, activityLog.action)
    .orderBy(sql`date(${activityLog.createdAt})`);

  // Pivot rows into DailyMovement format
  const map = new Map<string, DailyMovement>();
  for (const row of rows) {
    const existing = map.get(row.date) ?? {
      date: row.date,
      "προσθήκες": 0,
      "αφαιρέσεις": 0,
    };
    if (row.action === "ADD") existing["προσθήκες"] = row.total;
    if (row.action === "REMOVE") existing["αφαιρέσεις"] = row.total;
    map.set(row.date, existing);
  }

  return Array.from(map.values());
}

export interface ReagentUsage {
  description: string;
  barcode: string;
  totalRemoved: number;
}

export async function getMostUsedReagents(
  days: number,
  limit: number = 10,
  locationId?: number
): Promise<ReagentUsage[]> {
  const db = getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d+Z$/, "");

  const conditions = [
    eq(activityLog.action, "REMOVE"),
    gte(activityLog.createdAt, startStr),
  ];
  if (locationId != null) {
    conditions.push(eq(activityLog.locationId, locationId));
  }

  // Aggregate activity data without joining inventory (avoids fan-out
  // when the same barcode exists in multiple locations)
  const rows = await db
    .select({
      barcode: activityLog.barcode,
      totalRemoved: sql<number>`coalesce(sum(abs(${activityLog.quantityChange})), 0)`,
    })
    .from(activityLog)
    .where(and(...conditions))
    .groupBy(activityLog.barcode)
    .orderBy(desc(sql`sum(abs(${activityLog.quantityChange}))`))
    .limit(limit);

  // Resolve descriptions with a single lookup per barcode
  const result: ReagentUsage[] = [];
  for (const row of rows) {
    const item = await db
      .select({ description: inventory.description })
      .from(inventory)
      .where(eq(inventory.barcode, row.barcode))
      .limit(1);
    result.push({
      barcode: row.barcode,
      description: item[0]?.description ?? row.barcode,
      totalRemoved: row.totalRemoved,
    });
  }

  return result;
}
