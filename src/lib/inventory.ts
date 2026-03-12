import { eq, or, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { inventory, activityLog } from "./schema";

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = Omit<
  typeof inventory.$inferInsert,
  "id" | "createdAt" | "updatedAt"
>;

function nowTimestamp(): string {
  return new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

export async function getAllInventory(
  locationId?: number
): Promise<InventoryItem[]> {
  const db = getDb();
  if (locationId != null) {
    return db
      .select()
      .from(inventory)
      .where(eq(inventory.locationId, locationId))
      .orderBy(inventory.sortOrder);
  }
  return db.select().from(inventory).orderBy(inventory.sortOrder);
}

export async function getInventoryByBarcode(
  barcode: string
): Promise<InventoryItem[]> {
  const db = getDb();
  return db.select().from(inventory).where(eq(inventory.barcode, barcode));
}

export async function getInventoryByBarcodeAndLocation(
  barcode: string,
  locationId: number
): Promise<InventoryItem | undefined> {
  const db = getDb();
  const results = await db
    .select()
    .from(inventory)
    .where(
      and(eq(inventory.barcode, barcode), eq(inventory.locationId, locationId))
    );
  return results[0];
}

export async function addInventoryItem(item: NewInventoryItem): Promise<void> {
  const db = getDb();
  const locationId = item.locationId ?? 1;

  const existing = await getInventoryByBarcodeAndLocation(
    item.barcode,
    locationId
  );

  if (existing) {
    await db
      .update(inventory)
      .set({
        quantity: existing.quantity + (item.quantity ?? 0),
        updatedAt: nowTimestamp(),
      })
      .where(eq(inventory.id, existing.id));
  } else {
    await db.insert(inventory).values({ ...item, locationId });
  }

  await db.insert(activityLog).values({
    barcode: item.barcode,
    action: "ADD",
    quantityChange: item.quantity,
    locationId,
  });
}

export async function removeQuantity(
  barcode: string,
  amount: number,
  locationId: number = 1
): Promise<void> {
  const db = getDb();

  const item = await getInventoryByBarcodeAndLocation(barcode, locationId);
  if (!item) throw new Error(`Το είδος με barcode ${barcode} δεν βρέθηκε`);

  const newQty = Math.max(0, item.quantity - amount);
  const actualRemoved = item.quantity - newQty;

  await db
    .update(inventory)
    .set({ quantity: newQty, updatedAt: nowTimestamp() })
    .where(eq(inventory.id, item.id));

  await db.insert(activityLog).values({
    barcode,
    action: "REMOVE",
    quantityChange: -actualRemoved,
    locationId,
  });
}

export async function updateInventoryItem(
  id: number,
  updates: { barcode?: string; description?: string; quantity?: number }
): Promise<void> {
  const db = getDb();

  const item = (
    await db.select().from(inventory).where(eq(inventory.id, id))
  )[0];
  if (!item) throw new Error(`Το είδος με id ${id} δεν βρέθηκε`);

  await db
    .update(inventory)
    .set({ ...updates, updatedAt: nowTimestamp() })
    .where(eq(inventory.id, id));

  await db.insert(activityLog).values({
    barcode: updates.barcode ?? item.barcode,
    action: "EDIT",
    quantityChange:
      updates.quantity != null ? updates.quantity - item.quantity : null,
    locationId: item.locationId,
  });
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const db = getDb();

  const item = (
    await db.select().from(inventory).where(eq(inventory.id, id))
  )[0];
  if (!item) throw new Error(`Το είδος με id ${id} δεν βρέθηκε`);

  await db.insert(activityLog).values({
    barcode: item.barcode,
    action: "DELETE",
    quantityChange: -item.quantity,
    locationId: item.locationId,
  });

  await db.delete(inventory).where(eq(inventory.id, id));
}

export async function transferItem(
  barcode: string,
  fromLocationId: number,
  toLocationId: number,
  quantity: number
): Promise<void> {
  const db = getDb();

  const source = await getInventoryByBarcodeAndLocation(
    barcode,
    fromLocationId
  );
  if (!source) throw new Error("Το είδος προέλευσης δεν βρέθηκε");
  if (source.quantity < quantity) throw new Error("Ανεπαρκής ποσότητα");

  // Decrement source
  await db
    .update(inventory)
    .set({
      quantity: source.quantity - quantity,
      updatedAt: nowTimestamp(),
    })
    .where(eq(inventory.id, source.id));

  // Increment or create destination
  const dest = await getInventoryByBarcodeAndLocation(barcode, toLocationId);
  if (dest) {
    await db
      .update(inventory)
      .set({
        quantity: dest.quantity + quantity,
        updatedAt: nowTimestamp(),
      })
      .where(eq(inventory.id, dest.id));
  } else {
    const nextSort = await getNextSortOrder();
    await db.insert(inventory).values({
      barcode: source.barcode,
      description: source.description,
      quantity,
      locationId: toLocationId,
      sortOrder: nextSort,
    });
  }

  // Log transfer
  await db.insert(activityLog).values({
    barcode,
    action: "TRANSFER",
    quantityChange: quantity,
    locationId: fromLocationId,
    toLocationId,
  });
}

export async function updateSortOrder(
  updates: { id: number; sortOrder: number }[]
): Promise<void> {
  const db = getDb();

  for (const { id, sortOrder } of updates) {
    await db
      .update(inventory)
      .set({ sortOrder })
      .where(eq(inventory.id, id));
  }
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function searchInventory(
  query: string,
  locationId?: number
): Promise<InventoryItem[]> {
  const db = getDb();
  const escaped = "%" + escapeLike(query) + "%";
  const likeFilter = or(
    sql`${inventory.barcode} LIKE ${escaped} ESCAPE '\\'`,
    sql`${inventory.description} LIKE ${escaped} ESCAPE '\\'`
  );
  const where =
    locationId != null
      ? and(likeFilter, eq(inventory.locationId, locationId))
      : likeFilter;
  return db.select().from(inventory).where(where).orderBy(inventory.sortOrder);
}

export async function getNextSortOrder(): Promise<number> {
  const db = getDb();
  const items = await db
    .select()
    .from(inventory)
    .orderBy(desc(inventory.sortOrder))
    .limit(1);
  return items.length > 0 ? items[0].sortOrder + 1 : 1;
}
