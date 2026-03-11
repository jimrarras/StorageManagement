import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { locations, inventory } from "./schema";

export type Location = typeof locations.$inferSelect;

export async function getAllLocations(): Promise<Location[]> {
  const db = getDb();
  return db.select().from(locations).orderBy(locations.name);
}

export async function addLocation(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Location name cannot be empty");
  const db = getDb();
  await db.insert(locations).values({ name: trimmed });
}

export async function renameLocation(id: number, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Location name cannot be empty");
  const db = getDb();
  await db.update(locations).set({ name: trimmed }).where(eq(locations.id, id));
}

export async function deleteLocation(id: number): Promise<void> {
  const db = getDb();

  // Prevent deleting the Default location
  if (id === 1) throw new Error("Cannot delete the Default location");

  // Prevent deleting a location that has items
  const items = await db
    .select({ id: inventory.id })
    .from(inventory)
    .where(eq(inventory.locationId, id))
    .limit(1);
  if (items.length > 0) {
    throw new Error("Cannot delete a location that has items");
  }

  await db.delete(locations).where(eq(locations.id, id));
}
