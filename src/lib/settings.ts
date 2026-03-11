import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { settings } from "./schema";

export async function getSetting(key: string): Promise<string | null> {
  const db = getDb();
  const result = await db.select().from(settings).where(eq(settings.key, key));
  return result[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  const existing = await getSetting(key);
  if (existing !== null) {
    await db.update(settings).set({ value }).where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value });
  }
}

export async function getLowStockThreshold(): Promise<number> {
  const value = await getSetting("low_stock_threshold");
  return value ? parseInt(value, 10) : 5;
}

export async function setLowStockThreshold(threshold: number): Promise<void> {
  await setSetting("low_stock_threshold", String(threshold));
}
