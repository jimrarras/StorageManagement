import { copyFile, mkdir, readDir, remove, exists } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { getRawDb, closeDatabase, initDatabase } from "./db";
import { getSetting, setSetting } from "./settings";

// ── Constants ──

const BACKUP_PREFIX = "storage_backup_";
const PRERESTORE_PREFIX = "storage_prerestore_";
const DB_FILENAME = "storage.db";

// ── Types ──

export interface BackupEntry {
  filename: string;
  date: Date;
  isPreRestore: boolean;
}

// ── Path Helpers ──

export async function getDbPath(): Promise<string> {
  const dataDir = await appDataDir();
  return await join(dataDir, DB_FILENAME);
}

export async function getBackupFolder(): Promise<string> {
  const custom = await getSetting("backup_folder");
  if (custom) return custom;
  const dataDir = await appDataDir();
  return await join(dataDir, "backups");
}

async function ensureBackupFolder(): Promise<string> {
  const folder = await getBackupFolder();
  const folderExists = await exists(folder);
  if (!folderExists) {
    await mkdir(folder, { recursive: true });
  }
  return folder;
}

function makeTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function parseDateFromFilename(filename: string): Date | null {
  const match = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
  if (!match) return null;
  const parts = match[1].split("T");
  const datePart = parts[0];
  const timePart = parts[1].replace(/-/g, ":");
  return new Date(`${datePart}T${timePart}`);
}

// ── Backup Operations ──

export async function createBackup(): Promise<string> {
  const folder = await ensureBackupFolder();
  const dbPath = await getDbPath();

  try {
    const rawDb = getRawDb();
    await rawDb.execute("PRAGMA wal_checkpoint(TRUNCATE)", []);
  } catch {
    // DB might not be initialized yet during first startup; skip WAL flush
  }

  const timestamp = makeTimestamp();
  const backupFilename = `${BACKUP_PREFIX}${timestamp}.db`;
  const backupPath = await join(folder, backupFilename);

  await copyFile(dbPath, backupPath);

  await setSetting("backup_last_time", new Date().toISOString());

  await rotateBackups();

  return backupPath;
}

async function createPreRestoreBackup(): Promise<string> {
  const folder = await ensureBackupFolder();
  const dbPath = await getDbPath();

  try {
    const rawDb = getRawDb();
    await rawDb.execute("PRAGMA wal_checkpoint(TRUNCATE)", []);
  } catch {
    // Skip if DB not available
  }

  const timestamp = makeTimestamp();
  const filename = `${PRERESTORE_PREFIX}${timestamp}.db`;
  const backupPath = await join(folder, filename);

  await copyFile(dbPath, backupPath);
  return backupPath;
}

// ── List & Rotate ──

export async function listBackups(): Promise<BackupEntry[]> {
  const folder = await getBackupFolder();
  const folderExists = await exists(folder);
  if (!folderExists) return [];

  const entries = await readDir(folder);
  const backups: BackupEntry[] = [];

  for (const entry of entries) {
    if (!entry.name) continue;
    const isBackup = entry.name.startsWith(BACKUP_PREFIX) && entry.name.endsWith(".db");
    const isPreRestore = entry.name.startsWith(PRERESTORE_PREFIX) && entry.name.endsWith(".db");

    if (!isBackup && !isPreRestore) continue;

    const date = parseDateFromFilename(entry.name);
    if (!date) continue;

    backups.push({
      filename: entry.name,
      date,
      isPreRestore,
    });
  }

  backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  return backups;
}

async function rotateBackups(): Promise<void> {
  const maxCountStr = await getSetting("backup_max_count");
  const maxCount = maxCountStr ? parseInt(maxCountStr, 10) : 30;
  if (!Number.isFinite(maxCount) || maxCount < 1) return;

  const allBackups = await listBackups();
  const regularBackups = allBackups.filter((b) => !b.isPreRestore);

  if (regularBackups.length <= maxCount) return;

  const folder = await getBackupFolder();
  const toDelete = regularBackups.slice(maxCount);

  for (const backup of toDelete) {
    const path = await join(folder, backup.filename);
    try {
      await remove(path);
    } catch {
      // Ignore deletion errors
    }
  }
}

export async function deleteBackup(filename: string): Promise<void> {
  const folder = await getBackupFolder();
  const path = await join(folder, filename);
  await remove(path);
}

// ── Restore Operations ──

export async function restoreFromBackup(filename: string): Promise<void> {
  const folder = await getBackupFolder();
  const backupPath = await join(folder, filename);
  await performRestore(backupPath);
}

export async function restoreFromFile(): Promise<boolean> {
  const selected = await open({
    filters: [{ name: "Database", extensions: ["db"] }],
    multiple: false,
    directory: false,
  });

  if (!selected) return false;

  await performRestore(selected);
  return true;
}

async function performRestore(sourcePath: string): Promise<void> {
  await createPreRestoreBackup();

  await closeDatabase();

  const dbPath = await getDbPath();
  try {
    await copyFile(sourcePath, dbPath);
  } catch (err) {
    await initDatabase();
    throw new Error(`Αποτυχία αντιγραφής αρχείου: ${err}`);
  }

  try {
    await initDatabase();
  } catch (err) {
    await closeDatabase();
    const folder = await getBackupFolder();
    const allBackups = await listBackups();
    const latestPreRestore = allBackups.find((b) => b.isPreRestore);
    if (latestPreRestore) {
      const preRestorePath = await join(folder, latestPreRestore.filename);
      await copyFile(preRestorePath, dbPath);
      await initDatabase();
    }
    throw new Error(`Το αρχείο αντιγράφου ασφαλείας είναι κατεστραμμένο. Η βάση επαναφέρθηκε στην προηγούμενη κατάσταση.`);
  }

  window.location.reload();
}
