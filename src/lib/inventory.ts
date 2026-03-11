import { eq, like, or, desc } from "drizzle-orm";
import { getDb } from "./db";
import { inventory, activityLog } from "./schema";

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = Omit<typeof inventory.$inferInsert, "id" | "createdAt" | "updatedAt">;

export async function getAllInventory(): Promise<InventoryItem[]> {
  const db = getDb();
  return db.select().from(inventory).orderBy(inventory.sortOrder);
}

export async function getInventoryByBarcode(barcode: string): Promise<InventoryItem | undefined> {
  const db = getDb();
  const results = await db.select().from(inventory).where(eq(inventory.barcode, barcode));
  return results[0];
}

export async function addInventoryItem(item: NewInventoryItem): Promise<void> {
  const db = getDb();
  const existing = await getInventoryByBarcode(item.barcode);

  if (existing) {
    // Barcode already exists — add to quantity
    await db
      .update(inventory)
      .set({
        quantity: existing.quantity + (item.quantity ?? 0),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(inventory.barcode, item.barcode));
  } else {
    await db.insert(inventory).values(item);
  }

  await db.insert(activityLog).values({
    barcode: item.barcode,
    action: "ADD",
    quantityChange: item.quantity,
  });
}

export async function removeQuantity(barcode: string, amount: number): Promise<void> {
  const db = getDb();
  const item = await getInventoryByBarcode(barcode);
  if (!item) throw new Error(`Item with barcode ${barcode} not found`);

  const newQty = Math.max(0, item.quantity - amount);
  const actualRemoved = item.quantity - newQty;

  await db
    .update(inventory)
    .set({ quantity: newQty, updatedAt: new Date().toISOString() })
    .where(eq(inventory.barcode, barcode));

  await db.insert(activityLog).values({
    barcode,
    action: "REMOVE",
    quantityChange: -actualRemoved,
  });
}

export async function updateInventoryItem(
  id: number,
  updates: { barcode?: string; description?: string; quantity?: number }
): Promise<void> {
  const db = getDb();
  const item = (await db.select().from(inventory).where(eq(inventory.id, id)))[0];
  if (!item) throw new Error(`Item with id ${id} not found`);

  await db
    .update(inventory)
    .set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(inventory.id, id));

  await db.insert(activityLog).values({
    barcode: updates.barcode ?? item.barcode,
    action: "EDIT",
    quantityChange: updates.quantity != null ? updates.quantity - item.quantity : null,
  });
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const db = getDb();
  const item = (await db.select().from(inventory).where(eq(inventory.id, id)))[0];
  if (!item) throw new Error(`Item with id ${id} not found`);

  await db.insert(activityLog).values({
    barcode: item.barcode,
    action: "DELETE",
    quantityChange: -item.quantity,
  });

  await db.delete(inventory).where(eq(inventory.id, id));
}

export async function updateSortOrder(updates: { id: number; sortOrder: number }[]): Promise<void> {
  const db = getDb();
  for (const { id, sortOrder } of updates) {
    await db.update(inventory).set({ sortOrder }).where(eq(inventory.id, id));
  }
}

export async function searchInventory(query: string): Promise<InventoryItem[]> {
  const db = getDb();
  return db
    .select()
    .from(inventory)
    .where(or(like(inventory.barcode, `%${query}%`), like(inventory.description, `%${query}%`)))
    .orderBy(inventory.sortOrder);
}

export async function getNextSortOrder(): Promise<number> {
  const db = getDb();
  const items = await db.select().from(inventory).orderBy(desc(inventory.sortOrder)).limit(1);
  return items.length > 0 ? items[0].sortOrder + 1 : 1;
}
