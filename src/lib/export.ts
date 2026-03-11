import ExcelJS from "exceljs";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import type { InventoryItem } from "./inventory";
import type { ActivityEntry } from "./activity";
import { actionLabel } from "./utils";

export async function exportInventoryXlsx(
  items: InventoryItem[],
  locationMap?: Map<number, string>
): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Απόθεμα");

  // Title row
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `Αναφορά Αποθέματος — ${new Date().toLocaleDateString("el-GR")}`;
  titleCell.font = { bold: true, size: 14 };

  // Empty row
  sheet.addRow([]);

  // Headers
  const headerRow = sheet.addRow(["Barcode", "Περιγραφή", "Ποσότητα", "Τοποθεσία", "Τελευταία Ενημέρωση"]);
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
    const row = sheet.addRow([
      item.barcode,
      item.description,
      item.quantity,
      locationMap?.get(item.locationId) ?? "—",
      item.updatedAt,
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

  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 40;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 20;
  sheet.getColumn(5).width = 20;

  return saveWorkbook(workbook, "Inventory.xlsx");
}

export async function exportActivityXlsx(entries: ActivityEntry[]): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Κινήσεις");

  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = `Αναφορά Κινήσεων — ${new Date().toLocaleDateString("el-GR")}`;
  titleCell.font = { bold: true, size: 14 };

  sheet.addRow([]);

  const headerRow = sheet.addRow(["Ημερομηνία/Ώρα", "Barcode", "Ενέργεια", "Μεταβολή Ποσ.", "Τοποθεσία"]);
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
    const location =
      entry.action === "TRANSFER"
        ? `${entry.locationName ?? "?"} → ${entry.toLocationName ?? "?"}`
        : entry.locationName ?? "—";
    const row = sheet.addRow([
      entry.createdAt,
      entry.barcode,
      actionLabel(entry.action),
      entry.quantityChange ?? "—",
      location,
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
  sheet.getColumn(5).width = 24;

  return saveWorkbook(workbook, "Activity.xlsx");
}

export interface ReportColumn<T> {
  header: string;
  width: number;
  accessor: (row: T) => string | number;
}

export async function exportReportXlsx<T>(
  title: string,
  columns: ReportColumn<T>[],
  rows: T[]
): Promise<boolean> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Αναφορά");

  // Title row — merge across all columns (numeric API works for any column count)
  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell("A1");
  titleCell.value = `${title} — ${new Date().toLocaleDateString("el-GR")}`;
  titleCell.font = { bold: true, size: 14 };

  // Empty row
  sheet.addRow([]);

  // Headers
  const headerRow = sheet.addRow(columns.map((c) => c.header));
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
  for (const item of rows) {
    const row = sheet.addRow(columns.map((c) => c.accessor(item)));
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  // Column widths
  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width;
  });

  const filename = `${title.replace(/ /g, "_")}.xlsx`;
  return saveWorkbook(workbook, filename);
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
