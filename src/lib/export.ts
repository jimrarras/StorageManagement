import ExcelJS from "exceljs";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { InventoryItem } from "./inventory";
import type { ActivityEntry } from "./activity";

export async function exportInventoryXlsx(items: InventoryItem[]): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventory");

  // Title row
  sheet.mergeCells("A1:D1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `Inventory Report — ${new Date().toLocaleDateString("el-GR")}`;
  titleCell.font = { bold: true, size: 14 };

  // Empty row
  sheet.addRow([]);

  // Headers
  const headerRow = sheet.addRow(["Barcode", "Description", "Quantity", "Last Updated"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data
  for (const item of items) {
    const row = sheet.addRow([item.barcode, item.description, item.quantity, item.updatedAt]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 20;

  return saveWorkbook(workbook, "Inventory.xlsx");
}

export async function exportActivityXlsx(entries: ActivityEntry[]): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Activity Log");

  sheet.mergeCells("A1:D1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `Activity Report — ${new Date().toLocaleDateString("el-GR")}`;
  titleCell.font = { bold: true, size: 14 };

  sheet.addRow([]);

  const headerRow = sheet.addRow(["Date/Time", "Barcode", "Action", "Qty Change"]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  for (const entry of entries) {
    const row = sheet.addRow([
      entry.createdAt,
      entry.barcode,
      entry.action,
      entry.quantityChange ?? "—",
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  sheet.getColumn(1).width = 22;
  sheet.getColumn(2).width = 20;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 14;

  return saveWorkbook(workbook, "Activity.xlsx");
}

async function saveWorkbook(workbook: ExcelJS.Workbook, defaultName: string): Promise<boolean> {
  const filePath = await save({
    defaultPath: defaultName,
    filters: [{ name: "Excel", extensions: ["xlsx"] }],
  });
  if (!filePath) return false;

  const buffer = await workbook.xlsx.writeBuffer();
  await writeFile(filePath, new Uint8Array(buffer));
  return true;
}
