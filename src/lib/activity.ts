import { like, or, desc } from "drizzle-orm";
import { getDb } from "./db";
import { activityLog } from "./schema";

export type ActivityEntry = typeof activityLog.$inferSelect;

export async function getAllActivity(): Promise<ActivityEntry[]> {
  const db = getDb();
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt));
}

export async function searchActivity(query: string): Promise<ActivityEntry[]> {
  const db = getDb();
  return db
    .select()
    .from(activityLog)
    .where(or(like(activityLog.barcode, `%${query}%`), like(activityLog.createdAt, `%${query}%`)))
    .orderBy(desc(activityLog.createdAt));
}
