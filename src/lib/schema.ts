import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(0),
  locationId: integer("location_id").notNull().default(1),
  sortOrder: integer("sort_order").notNull(),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  barcodeLocation: unique("idx_barcode_location").on(table.barcode, table.locationId),
}));

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull(),
  action: text("action").notNull(),
  quantityChange: integer("quantity_change"),
  locationId: integer("location_id"),
  toLocationId: integer("to_location_id"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
