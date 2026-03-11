import { desc, like, or } from "drizzle-orm";
import { getDb } from "./db";
import { activityLog, locations } from "./schema";

export type ActivityEntry = typeof activityLog.$inferSelect & {
  locationName?: string;
  toLocationName?: string;
};

export async function getAllActivity(limit = 500, offset = 0): Promise<ActivityEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);

  return enrichWithLocationNames(rows);
}

export async function searchActivity(query: string, limit = 500, offset = 0): Promise<ActivityEntry[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(activityLog)
    .where(
      or(
        like(activityLog.barcode, `%${query}%`),
        like(activityLog.createdAt, `%${query}%`)
      )
    )
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);

  return enrichWithLocationNames(rows);
}

async function enrichWithLocationNames(
  rows: (typeof activityLog.$inferSelect)[]
): Promise<ActivityEntry[]> {
  const db = getDb();
  const allLocations = await db.select().from(locations);
  const locationMap = new Map(allLocations.map((l) => [l.id, l.name]));

  return rows.map((row) => ({
    ...row,
    locationName: row.locationId ? locationMap.get(row.locationId) : undefined,
    toLocationName: row.toLocationId
      ? locationMap.get(row.toLocationId)
      : undefined,
  }));
}
