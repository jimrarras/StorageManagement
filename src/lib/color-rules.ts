import { eq } from "drizzle-orm";
import { getDb, getRawDb } from "./db";
import { colorRules } from "./schema";

export type ColorRule = typeof colorRules.$inferSelect;

export async function getAllColorRules(): Promise<ColorRule[]> {
  const db = getDb();
  return db.select().from(colorRules).orderBy(colorRules.sortOrder);
}

export async function addColorRule(keyword: string, color: string): Promise<void> {
  const db = getDb();
  const existing = await getAllColorRules();
  const nextSort = existing.length > 0 ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 1;
  await db.insert(colorRules).values({ keyword, color, sortOrder: nextSort });
}

export async function updateColorRule(
  id: number,
  data: { keyword?: string; color?: string }
): Promise<void> {
  const db = getDb();
  await db.update(colorRules).set(data).where(eq(colorRules.id, id));
}

export async function deleteColorRule(id: number): Promise<void> {
  const db = getDb();
  await db.delete(colorRules).where(eq(colorRules.id, id));
}

export async function reorderColorRules(
  updates: { id: number; sortOrder: number }[]
): Promise<void> {
  const db = getDb();
  const sqlite = getRawDb();
  await sqlite.execute("BEGIN TRANSACTION");
  try {
    for (const { id, sortOrder } of updates) {
      await db.update(colorRules).set({ sortOrder }).where(eq(colorRules.id, id));
    }
    await sqlite.execute("COMMIT");
  } catch (e) {
    await sqlite.execute("ROLLBACK");
    throw e;
  }
}
