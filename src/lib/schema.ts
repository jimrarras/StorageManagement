import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const inventory = sqliteTable("inventory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull().unique(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(0),
  sortOrder: integer("sort_order").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  barcode: text("barcode").notNull(),
  action: text("action").notNull(), // ADD, REMOVE, EDIT, DELETE
  quantityChange: integer("quantity_change"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
