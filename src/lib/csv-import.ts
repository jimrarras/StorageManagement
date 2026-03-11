import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { getDb } from "./db";
import { inventory, activityLog } from "./schema";

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
    const parts = lines[i].split(",");
    if (parts.length < 4) continue;

    const [_listId, barcode, description, quantity] = parts.map((p) =>
      p.trim()
    );

    try {
      await db.insert(inventory).values({
        barcode,
        description,
        quantity: parseInt(quantity) || 0,
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
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;

    const [_id, date, time, barcode, actionText] = parts.map((p) => p.trim());

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
  }

  return count;
}
