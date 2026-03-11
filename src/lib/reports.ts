import { sql, eq, and, gte, lte, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { inventory, activityLog, locations } from "./schema";
import { getLowStockThreshold } from "./settings";

// ---------------------------------------------------------------------------
// Date preset utilities
// ---------------------------------------------------------------------------

export type DatePreset =
  | "this_week"
  | "this_month"
  | "last_30"
  | "last_90"
  | "this_year";

export interface DateRange {
  start: string;
  end: string;
}

/** Convert a JS Date to an ISO-style "YYYY-MM-DD HH:MM:SS" string (UTC). */
export function formatDate(d: Date): string {
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

/** Resolve a named preset into concrete start / end datetime strings. */
export function resolveDatePreset(preset: DatePreset): DateRange {
  const now = new Date();
  let start: Date;

  switch (preset) {
    case "this_week": {
      // Monday 00:00 UTC of the current week
      start = new Date(now);
      const day = start.getUTCDay(); // 0=Sun … 6=Sat
      const diff = day === 0 ? 6 : day - 1; // days since Monday
      start = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() - diff));
      break;
    }
    case "this_month":
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      break;
    case "last_30":
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30));
      break;
    case "last_90":
      start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 90));
      break;
    case "this_year":
      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      break;
  }

  return { start: formatDate(start), end: formatDate(now) };
}

// ---------------------------------------------------------------------------
// 3a – Inventory Snapshot
// ---------------------------------------------------------------------------

export interface SnapshotRow {
  barcode: string;
  description: string;
  quantity: number;
  locationId: number;
  locationName: string;
  updatedAt: string;
}

/**
 * Current point-in-time inventory snapshot (no date range needed).
 * Joins with locations to include the human-readable name.
 */
export async function getInventorySnapshot(
  locationId?: number
): Promise<SnapshotRow[]> {
  const db = getDb();

  const conditions = [];
  if (locationId != null) {
    conditions.push(eq(inventory.locationId, locationId));
  }

  const rows = await db
    .select({
      barcode: inventory.barcode,
      description: inventory.description,
      quantity: inventory.quantity,
      locationId: inventory.locationId,
      locationName: sql<string>`coalesce(${locations.name}, 'Unknown')`,
      updatedAt: inventory.updatedAt,
    })
    .from(inventory)
    .leftJoin(locations, eq(inventory.locationId, locations.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(inventory.locationId, inventory.description);

  return rows;
}

// ---------------------------------------------------------------------------
// 3b – Movement Report
// ---------------------------------------------------------------------------

export interface MovementRow {
  barcode: string;
  description: string;
  totalAdded: number;
  totalRemoved: number;
  transfersIn: number;
  transfersOut: number;
  netChange: number;
}

/**
 * Aggregate ADD / REMOVE / TRANSFER activity per barcode within a date range.
 * When a locationId is provided the report scopes to that location (transfers
 * counted as in/out relative to the location).
 */
export async function getMovementReport(
  range: DateRange,
  locationId?: number
): Promise<MovementRow[]> {
  const db = getDb();

  // Build WHERE for the date range and action types.
  // When filtering by location, include rows where location IS source OR destination.
  const conditions = [
    sql`${activityLog.action} IN ('ADD', 'REMOVE', 'TRANSFER')`,
    gte(activityLog.createdAt, range.start),
    lte(activityLog.createdAt, range.end),
  ];
  if (locationId != null) {
    conditions.push(
      sql`(${activityLog.locationId} = ${locationId} OR ${activityLog.toLocationId} = ${locationId})`
    );
  }

  const rows = await db
    .select({
      barcode: activityLog.barcode,
      action: activityLog.action,
      quantityChange: sql<number>`coalesce(abs(${activityLog.quantityChange}), 0)`,
      srcLocation: activityLog.locationId,
      dstLocation: activityLog.toLocationId,
    })
    .from(activityLog)
    .where(and(...conditions));

  // Aggregate per barcode
  const map = new Map<
    string,
    { added: number; removed: number; transfersIn: number; transfersOut: number }
  >();

  for (const row of rows) {
    const entry = map.get(row.barcode) ?? {
      added: 0,
      removed: 0,
      transfersIn: 0,
      transfersOut: 0,
    };

    if (row.action === "ADD") {
      entry.added += row.quantityChange;
    } else if (row.action === "REMOVE") {
      entry.removed += row.quantityChange;
    } else if (row.action === "TRANSFER") {
      if (locationId != null) {
        // Transfers TO this location count as in, FROM as out
        if (row.dstLocation === locationId) {
          entry.transfersIn += row.quantityChange;
        }
        if (row.srcLocation === locationId) {
          entry.transfersOut += row.quantityChange;
        }
      } else {
        // No location filter – transfers are zero-sum globally, so omit them
        // to avoid showing redundant equal in/out values.
      }
    }

    map.set(row.barcode, entry);
  }

  // Batch-fetch descriptions for all barcodes at once
  const allBarcodes = Array.from(map.keys());
  const descMap = new Map<string, string>();
  if (allBarcodes.length > 0) {
    const descRows = await db
      .select({ barcode: inventory.barcode, description: inventory.description })
      .from(inventory)
      .where(inArray(inventory.barcode, allBarcodes))
      .groupBy(inventory.barcode);
    for (const r of descRows) {
      descMap.set(r.barcode, r.description);
    }
  }

  const result: MovementRow[] = [];
  for (const [barcode, agg] of map) {
    const netChange =
      agg.added - agg.removed + agg.transfersIn - agg.transfersOut;

    result.push({
      barcode,
      description: descMap.get(barcode) ?? barcode,
      totalAdded: agg.added,
      totalRemoved: agg.removed,
      transfersIn: agg.transfersIn,
      transfersOut: agg.transfersOut,
      netChange,
    });
  }

  // Sort by |netChange| descending
  result.sort((a, b) => Math.abs(b.netChange) - Math.abs(a.netChange));
  return result;
}

// ---------------------------------------------------------------------------
// 3c – Low Stock History
// ---------------------------------------------------------------------------

export interface LowStockHistoryRow {
  barcode: string;
  description: string;
  locationId: number;
  locationName: string;
  timesBelowThreshold: number;
  totalDaysBelow: number;
  currentQty: number;
  status: "OK" | "Low" | "Depleted";
}

/**
 * For each inventory item, reconstruct quantity timeline from activity_log and
 * determine how often (and for how long) the item fell below the low-stock
 * threshold within the given date range.
 */
export async function getLowStockHistory(
  range: DateRange,
  locationId?: number
): Promise<LowStockHistoryRow[]> {
  const db = getDb();
  const threshold = await getLowStockThreshold();

  // Fetch all inventory items (optionally filtered by location)
  const invConditions = [];
  if (locationId != null) {
    invConditions.push(eq(inventory.locationId, locationId));
  }

  const items = await db
    .select({
      barcode: inventory.barcode,
      description: inventory.description,
      quantity: inventory.quantity,
      locationId: inventory.locationId,
      locationName: sql<string>`coalesce(${locations.name}, 'Unknown')`,
    })
    .from(inventory)
    .leftJoin(locations, eq(inventory.locationId, locations.id))
    .where(invConditions.length ? and(...invConditions) : undefined);

  // Batch-fetch all relevant activity logs for the date range at once
  const allLogConditions = [
    sql`${activityLog.action} IN ('ADD', 'REMOVE', 'EDIT', 'TRANSFER')`,
    gte(activityLog.createdAt, range.start),
    lte(activityLog.createdAt, range.end),
  ];

  const allLogs = await db
    .select({
      barcode: activityLog.barcode,
      action: activityLog.action,
      quantityChange: activityLog.quantityChange,
      locationId: activityLog.locationId,
      toLocationId: activityLog.toLocationId,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .where(and(...allLogConditions))
    .orderBy(desc(activityLog.createdAt));

  // Partition logs by barcode+locationId
  const logsByKey = new Map<string, typeof allLogs>();
  for (const log of allLogs) {
    // A log is relevant if (ADD/REMOVE/EDIT and locationId matches) OR
    // (TRANSFER and locationId or toLocationId matches)
    const relevantLocationIds = new Set<number>();
    if (log.action === "TRANSFER") {
      if (log.locationId != null) relevantLocationIds.add(log.locationId);
      if (log.toLocationId != null) relevantLocationIds.add(log.toLocationId);
    } else {
      if (log.locationId != null) relevantLocationIds.add(log.locationId);
    }
    for (const locId of relevantLocationIds) {
      const key = `${log.barcode}::${locId}`;
      const arr = logsByKey.get(key) ?? [];
      arr.push(log);
      logsByKey.set(key, arr);
    }
  }

  const result: LowStockHistoryRow[] = [];

  for (const item of items) {
    const key = `${item.barcode}::${item.locationId}`;
    const logs = logsByKey.get(key) ?? [];

    if (logs.length === 0) continue;

    // Reconstruct quantity timeline by walking backwards from current quantity.
    // Each entry undoes the effect of the change to get the prior quantity.
    interface QtyPoint {
      date: string;
      qty: number;
    }
    const backwardPoints: QtyPoint[] = [];
    let qty = item.quantity;

    for (const log of logs) {
      backwardPoints.push({ date: log.createdAt, qty });
      const change = log.quantityChange ?? 0;

      if (log.action === "TRANSFER") {
        const absChange = Math.abs(change);
        if (log.locationId === item.locationId) {
          // Transfer OUT: qty decreased by change → undo by adding back
          qty += absChange;
        } else if (log.toLocationId === item.locationId) {
          // Transfer IN: qty increased by change → undo by subtracting
          qty -= absChange;
        }
      } else {
        // ADD (positive change) / REMOVE (negative change): subtracting
        // undoes the original effect.
        qty -= change;
      }
    }

    // The quantity at the start of the period (before first activity)
    backwardPoints.push({ date: range.start, qty });

    // Reverse to chronological order
    const timeline = backwardPoints.reverse();

    // Walk forward to find periods below threshold
    let timesBelowThreshold = 0;
    let totalDaysBelow = 0;
    let belowSince: Date | null = null;

    for (let i = 0; i < timeline.length; i++) {
      const point = timeline[i];
      const isBelow = point.qty <= threshold;

      if (isBelow && belowSince === null) {
        // Crossed below threshold
        timesBelowThreshold++;
        belowSince = new Date(point.date.replace(" ", "T"));
      } else if (!isBelow && belowSince !== null) {
        // Crossed back above threshold
        const recovered = new Date(point.date.replace(" ", "T"));
        totalDaysBelow += Math.max(
          0,
          (recovered.getTime() - belowSince.getTime()) / (1000 * 60 * 60 * 24)
        );
        belowSince = null;
      }
    }

    // If still below at end of range, count until range end
    if (belowSince !== null) {
      const endDate = new Date(range.end.replace(" ", "T"));
      totalDaysBelow += Math.max(
        0,
        (endDate.getTime() - belowSince.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Skip items that never went below threshold
    if (timesBelowThreshold === 0) continue;

    const status: "OK" | "Low" | "Depleted" =
      item.quantity === 0
        ? "Depleted"
        : item.quantity <= threshold
          ? "Low"
          : "OK";

    result.push({
      barcode: item.barcode,
      description: item.description,
      locationId: item.locationId,
      locationName: item.locationName,
      timesBelowThreshold,
      totalDaysBelow: Math.round(totalDaysBelow * 100) / 100,
      currentQty: item.quantity,
      status,
    });
  }

  // Sort by totalDaysBelow descending
  result.sort((a, b) => b.totalDaysBelow - a.totalDaysBelow);
  return result;
}

// ---------------------------------------------------------------------------
// 3d – Reagent Usage
// ---------------------------------------------------------------------------

export interface UsageRow {
  barcode: string;
  description: string;
  currentQty: number;
  totalConsumed: number;
  avgDailyUsage: number;
  estDaysUntilDepletion: number | null; // null = N/A (no usage)
}

/**
 * Aggregate REMOVE activity per barcode within a date range to derive
 * consumption metrics and estimated time until depletion.
 */
export async function getUsageReport(
  range: DateRange,
  locationId?: number
): Promise<UsageRow[]> {
  const db = getDb();

  const conditions = [
    eq(activityLog.action, "REMOVE"),
    gte(activityLog.createdAt, range.start),
    lte(activityLog.createdAt, range.end),
  ];
  if (locationId != null) {
    conditions.push(eq(activityLog.locationId, locationId));
  }

  // Aggregate total consumed per barcode
  const rows = await db
    .select({
      barcode: activityLog.barcode,
      totalConsumed: sql<number>`coalesce(sum(abs(${activityLog.quantityChange})), 0)`,
    })
    .from(activityLog)
    .where(and(...conditions))
    .groupBy(activityLog.barcode)
    .orderBy(desc(sql`sum(abs(${activityLog.quantityChange}))`));

  // Calculate days in period
  const startMs = new Date(range.start.replace(" ", "T")).getTime();
  const endMs = new Date(range.end.replace(" ", "T")).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInPeriod = Math.max(1, (endMs - startMs) / msPerDay);

  // Batch-fetch descriptions and quantities for all barcodes at once
  const usageBarcodes = rows.map(r => r.barcode);
  const descMap = new Map<string, string>();
  const qtyMap = new Map<string, number>();

  if (usageBarcodes.length > 0) {
    // Fetch descriptions
    const descRows = await db
      .select({ barcode: inventory.barcode, description: inventory.description })
      .from(inventory)
      .where(inArray(inventory.barcode, usageBarcodes))
      .groupBy(inventory.barcode);
    for (const r of descRows) {
      descMap.set(r.barcode, r.description);
    }

    // Fetch current quantities
    if (locationId != null) {
      const qtyRows = await db
        .select({ barcode: inventory.barcode, quantity: inventory.quantity })
        .from(inventory)
        .where(
          and(
            inArray(inventory.barcode, usageBarcodes),
            eq(inventory.locationId, locationId)
          )
        );
      for (const r of qtyRows) {
        qtyMap.set(r.barcode, r.quantity);
      }
    } else {
      const qtyRows = await db
        .select({
          barcode: inventory.barcode,
          total: sql<number>`coalesce(sum(${inventory.quantity}), 0)`,
        })
        .from(inventory)
        .where(inArray(inventory.barcode, usageBarcodes))
        .groupBy(inventory.barcode);
      for (const r of qtyRows) {
        qtyMap.set(r.barcode, r.total);
      }
    }
  }

  const result: UsageRow[] = [];

  for (const row of rows) {
    const currentQty = qtyMap.get(row.barcode) ?? 0;

    const avgDailyUsage =
      Math.round((row.totalConsumed / daysInPeriod) * 100) / 100;

    let estDaysUntilDepletion: number | null;
    if (currentQty === 0) {
      estDaysUntilDepletion = 0;
    } else if (avgDailyUsage === 0) {
      estDaysUntilDepletion = null;
    } else {
      estDaysUntilDepletion =
        Math.round((currentQty / avgDailyUsage) * 10) / 10;
    }

    result.push({
      barcode: row.barcode,
      description: descMap.get(row.barcode) ?? row.barcode,
      currentQty,
      totalConsumed: row.totalConsumed,
      avgDailyUsage,
      estDaysUntilDepletion,
    });
  }

  return result;
}
