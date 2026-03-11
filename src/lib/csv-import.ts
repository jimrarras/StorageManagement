import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getDb } from "./db";
import { inventory, activityLog } from "./schema";

/**
 * Parse a single CSV line respecting double-quoted fields.
 * Handles commas inside quotes, empty fields, and strips surrounding quotes.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped double-quote ("")
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip the second quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }

  fields.push(current);
  return fields;
}

export async function importInventoryCsv(): Promise<number> {
  const filePath = await open({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    title: "Select Inventory.csv",
  });
  if (!filePath) return 0;

  const content = await readTextFile(filePath as string);
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return 0;

  const db = getDb();
  let count = 0;

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvLine(lines[i]);
    if (parts.length < 4) continue;

    const [_listId, barcode, description, quantity] = parts.map((p) =>
      p.trim()
    );

    // Validate: barcode must be non-empty, quantity must be a valid number
    if (!barcode) continue;
    const parsedQty = parseInt(quantity);
    if (isNaN(parsedQty)) continue;

    try {
      await db.insert(inventory).values({
        barcode,
        description,
        quantity: parsedQty,
        sortOrder: i,
      });
      count++;
    } catch {
      // Skip duplicates (barcode UNIQUE constraint)
    }
  }

  return count;
}

export async function importReportCsv(): Promise<number> {
  const filePath = await open({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    title: "Select Report.csv",
  });
  if (!filePath) return 0;

  const content = await readTextFile(filePath as string);
  const lines = content.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return 0;

  const db = getDb();
  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    try {
      const parts = parseCsvLine(lines[i]);
      if (parts.length < 5) continue;

      const [_id, date, time, barcode, actionText] = parts.map((p) => p.trim());

      // Validate: barcode must be non-empty
      if (!barcode) continue;

      // Parse old format action text into structured data
      let action = "ADD";
      let quantityChange: number | null = null;

      if (actionText.startsWith("-")) {
        action = "REMOVE";
        quantityChange = parseInt(actionText);
      } else if (actionText.includes("Διαγραφή")) {
        action = "DELETE";
        const match = actionText.match(/ΤΜΧ:\s*(\d+)/);
        quantityChange = match ? -parseInt(match[1]) : null;
      } else if (actionText.includes("Επεξεργασία")) {
        action = "EDIT";
        const match = actionText.match(/ΤΜΧ:\s*(\d+)/);
        quantityChange = match ? parseInt(match[1]) : null;
      } else {
        quantityChange = parseInt(actionText) || null;
      }

      // Convert DD/MM/YYYY + HH:MM:SS to ISO timestamp
      const [day, month, year] = date.split("/");
      const isoDate = `${year}-${month}-${day}T${time}`;

      await db.insert(activityLog).values({
        barcode,
        action,
        quantityChange,
        createdAt: isoDate,
      });
      count++;
    } catch {
      // Skip rows that fail to parse or insert
    }
  }

  return count;
}
