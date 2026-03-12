# Backup & Restore Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic and manual backup/restore for the SQLite database, with rotation and a Settings UI section.

**Architecture:** Uses `@tauri-apps/plugin-fs` for file operations and `@tauri-apps/plugin-dialog` for native pickers. All logic in TypeScript. Backups are timestamped copies of the SQLite file. Auto-backups trigger on app start (throttled) and on a configurable interval. Restore closes the DB, copies the backup over `storage.db`, and reloads the page.

**Tech Stack:** Tauri 2 (`@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`, `@tauri-apps/api/path`), React 19, TypeScript, shadcn/ui

**Spec:** `docs/superpowers/specs/2026-03-12-backup-restore-design.md`

---

## Chunk 1: Foundation — Tauri Permissions & Database Layer

### Task 1: Update Tauri FS Capabilities

**Files:**
- Modify: `src-tauri/capabilities/default.json`

The current capabilities have `fs:default`, `fs:allow-write`, `fs:allow-read`. Backup needs additional granular permissions for copy, readDir, mkdir, remove, and exists operations.

- [ ] **Step 1: Add FS permissions to capabilities**

In `src-tauri/capabilities/default.json`, add these permissions to the `permissions` array:

```json
"fs:allow-copy-file",
"fs:allow-read-dir",
"fs:allow-mkdir",
"fs:allow-remove",
"fs:allow-exists"
```

Add them after the existing `"fs:allow-read"` line.

Note: Tauri v2's `fs:default` combined with these granular permissions and the existing `fs:allow-write`/`fs:allow-read` should cover all needed operations. The fs plugin in v2 scopes to the app data directory by default for `BaseDirectory.AppData` operations. For user-selected directories (via the dialog picker), Tauri automatically grants temporary access.

- [ ] **Step 2: Verify the app still compiles**

Run: `cd src-tauri && cargo check`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/capabilities/default.json
git commit -m "feat(backup): add Tauri FS permissions for backup operations"
```

---

### Task 2: Add `closeDatabase()` to db.ts

**Files:**
- Modify: `src/lib/db.ts:159-167`

The restore flow needs to close the database connection to release the Windows file lock before overwriting `storage.db`. Add a `closeDatabase()` export that properly closes the Tauri SQL connection and nullifies the singletons.

- [ ] **Step 1: Add closeDatabase function**

In `src/lib/db.ts`, add this function after the existing `getRawDb()` function (after line 167):

```typescript
export async function closeDatabase() {
  if (_sqlite) {
    await _sqlite.close();
  }
  _sqlite = null;
  _db = null;
}
```

This calls `_sqlite.close()` (from `@tauri-apps/plugin-sql`) to release the OS file lock, then nullifies both singletons so `initDatabase()` can re-initialize fresh.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No TypeScript errors. The `Database` type from `@tauri-apps/plugin-sql` exposes `.close()`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat(backup): add closeDatabase() for restore flow"
```

---

## Chunk 2: Backup Core Logic

### Task 3: Create backup.ts — Backup & Folder Operations

**Files:**
- Create: `src/lib/backup.ts`

This module handles all backup operations. It uses Tauri FS plugin for file operations and the existing `settings` module for persistence.

- [ ] **Step 1: Create the backup module with helper functions and createBackup**

Create `src/lib/backup.ts`:

```typescript
import { copyFile, mkdir, readDir, remove, exists } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
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
  // Extract timestamp from: storage_backup_2026-03-12T14-30-00.db
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

  // Flush WAL to ensure backup is self-contained
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

  // Update last backup time
  await setSetting("backup_last_time", new Date().toISOString());

  // Rotate old backups
  await rotateBackups();

  return backupPath;
}

export async function createPreRestoreBackup(): Promise<string> {
  const folder = await ensureBackupFolder();
  const dbPath = await getDbPath();

  // Flush WAL before pre-restore backup too
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No errors. All imports (`@tauri-apps/plugin-fs`, `@tauri-apps/api/path`, `@tauri-apps/plugin-dialog`) are already installed as dependencies.

- [ ] **Step 3: Commit**

```bash
git add src/lib/backup.ts
git commit -m "feat(backup): add backup module with createBackup and path helpers"
```

---

### Task 4: Add listBackups, rotateBackups, and Restore Functions

**Files:**
- Modify: `src/lib/backup.ts`

Add the remaining backup operations: listing, rotation, and restore.

- [ ] **Step 1: Add listBackups and rotateBackups**

Append to `src/lib/backup.ts`, before the closing of the file (after `createPreRestoreBackup`):

```typescript
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

  // Sort newest first
  backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  return backups;
}

async function rotateBackups(): Promise<void> {
  const maxCountStr = await getSetting("backup_max_count");
  const maxCount = maxCountStr ? parseInt(maxCountStr, 10) : 30;
  if (!Number.isFinite(maxCount) || maxCount < 1) return;

  const allBackups = await listBackups();
  // Only rotate regular backups, not pre-restore
  const regularBackups = allBackups.filter((b) => !b.isPreRestore);

  if (regularBackups.length <= maxCount) return;

  const folder = await getBackupFolder();
  const toDelete = regularBackups.slice(maxCount);

  for (const backup of toDelete) {
    const path = await join(folder, backup.filename);
    try {
      await remove(path);
    } catch {
      // Ignore deletion errors (file might be in use or already gone)
    }
  }
}

export async function deleteBackup(filename: string): Promise<void> {
  const folder = await getBackupFolder();
  const path = await join(folder, filename);
  await remove(path);
}
```

- [ ] **Step 2: Add restore functions**

First, add the missing import at the top of `src/lib/backup.ts`:

```typescript
import { open } from "@tauri-apps/plugin-dialog";
```

Then continue appending to the end of `src/lib/backup.ts`:

```typescript
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

  if (!selected) return false; // User cancelled

  await performRestore(selected);
  return true;
}

async function performRestore(sourcePath: string): Promise<void> {
  // 1. Create pre-restore safety backup
  await createPreRestoreBackup();

  // 2. Close database to release file lock
  await closeDatabase();

  // 3. Copy backup over active database
  const dbPath = await getDbPath();
  try {
    await copyFile(sourcePath, dbPath);
  } catch (err) {
    // If copy fails, re-init the existing (unchanged) database
    await initDatabase();
    throw new Error(`Αποτυχία αντιγραφής αρχείου: ${err}`);
  }

  // 4. Re-initialize database (runs migrations if needed)
  try {
    await initDatabase();
  } catch (err) {
    // Backup is corrupt — restore the pre-restore backup
    await closeDatabase();
    // Get the most recent pre-restore backup
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

  // 5. Reload page to reset all cached state
  window.location.reload();
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/backup.ts
git commit -m "feat(backup): add list, rotate, delete, and restore operations"
```

---

## Chunk 3: React Hooks

### Task 5: Create useBackupScheduler Hook

**Files:**
- Create: `src/hooks/useBackupScheduler.ts`

This hook runs in `App.tsx` and silently triggers automatic backups on app start (throttled to 30min) and on a configurable interval.

- [ ] **Step 1: Create the scheduler hook**

Create `src/hooks/useBackupScheduler.ts`:

```typescript
import { useEffect } from "react";
import { createBackup } from "@/lib/backup";
import { getSetting } from "@/lib/settings";

export function useBackupScheduler() {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function startScheduler() {
      // Check if backups are enabled
      const enabled = await getSetting("backup_enabled");
      if (enabled === "false") return;

      // Throttle: skip startup backup if last one was < 30 min ago
      const lastTime = await getSetting("backup_last_time");
      const shouldBackupNow =
        !lastTime ||
        Date.now() - new Date(lastTime).getTime() > 30 * 60 * 1000;

      if (shouldBackupNow) {
        try {
          await createBackup();
        } catch (err) {
          console.error("Auto-backup failed:", err);
        }
      }

      // Start interval timer
      const intervalStr = await getSetting("backup_interval_hours");
      const intervalHours = intervalStr ? parseInt(intervalStr, 10) : 4;
      const intervalMs = Math.max(intervalHours, 1) * 60 * 60 * 1000;

      intervalId = setInterval(async () => {
        try {
          await createBackup();
        } catch (err) {
          console.error("Scheduled backup failed:", err);
        }
      }, intervalMs);
    }

    startScheduler();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBackupScheduler.ts
git commit -m "feat(backup): add useBackupScheduler hook for auto-backup"
```

---

### Task 6: Create useBackupSettings Hook

**Files:**
- Create: `src/hooks/useBackupSettings.ts`

This hook manages all backup-related settings state for the SettingsPage UI. It loads settings on mount, provides debounced save, and manages the backup list.

- [ ] **Step 1: Create the settings hook**

Create `src/hooks/useBackupSettings.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/settings";
import {
  getBackupFolder,
  listBackups,
  createBackup,
  deleteBackup,
  restoreFromBackup,
  restoreFromFile,
  type BackupEntry,
} from "@/lib/backup";

export function useBackupSettings() {
  const [enabled, setEnabled] = useState(true);
  const [folder, setFolder] = useState("");
  const [intervalHours, setIntervalHours] = useState(4);
  const [maxCount, setMaxCount] = useState(30);
  const [lastTime, setLastTime] = useState<string | null>(null);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  // Load all settings on mount
  const loadSettings = useCallback(async () => {
    const [enabledVal, intervalVal, maxVal, lastVal, folderVal] =
      await Promise.all([
        getSetting("backup_enabled"),
        getSetting("backup_interval_hours"),
        getSetting("backup_max_count"),
        getSetting("backup_last_time"),
        getBackupFolder(),
      ]);

    setEnabled(enabledVal !== "false");
    setIntervalHours(intervalVal ? parseInt(intervalVal, 10) : 4);
    setMaxCount(maxVal ? parseInt(maxVal, 10) : 30);
    setLastTime(lastVal);
    setFolder(folderVal);
    loadedRef.current = true;
    setLoading(false);
  }, []);

  const refreshBackups = useCallback(async () => {
    const list = await listBackups();
    setBackups(list);
  }, []);

  useEffect(() => {
    loadSettings();
    refreshBackups();
  }, [loadSettings, refreshBackups]);

  // Debounced save for enabled
  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = setTimeout(() => {
      setSetting("backup_enabled", String(enabled));
    }, 300);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Debounced save for interval (min 1 hour)
  useEffect(() => {
    if (!loadedRef.current) return;
    const valid = Math.max(1, Math.floor(intervalHours));
    if (valid !== intervalHours) {
      setIntervalHours(valid);
      return;
    }
    const timer = setTimeout(() => {
      setSetting("backup_interval_hours", String(valid));
    }, 500);
    return () => clearTimeout(timer);
  }, [intervalHours]);

  // Debounced save for max count (min 1)
  useEffect(() => {
    if (!loadedRef.current) return;
    const valid = Math.max(1, Math.floor(maxCount));
    if (valid !== maxCount) {
      setMaxCount(valid);
      return;
    }
    const timer = setTimeout(() => {
      setSetting("backup_max_count", String(valid));
    }, 500);
    return () => clearTimeout(timer);
  }, [maxCount]);

  // Save folder immediately (set via folder picker, not typed)
  const updateFolder = useCallback(async (newFolder: string) => {
    setFolder(newFolder);
    await setSetting("backup_folder", newFolder);
  }, []);

  // Manual backup
  const triggerBackup = useCallback(async () => {
    const path = await createBackup();
    const newLastTime = new Date().toISOString();
    setLastTime(newLastTime);
    await refreshBackups();
    return path;
  }, [refreshBackups]);

  // Delete a backup
  const removeBackup = useCallback(
    async (filename: string) => {
      await deleteBackup(filename);
      await refreshBackups();
    },
    [refreshBackups]
  );

  // Restore from backup list
  const restore = useCallback(async (filename: string) => {
    await restoreFromBackup(filename);
    // Page will reload, so no state update needed
  }, []);

  // Restore from external file
  const restoreExternal = useCallback(async () => {
    return await restoreFromFile();
    // Page will reload if successful
  }, []);

  return {
    enabled,
    setEnabled,
    folder,
    updateFolder,
    intervalHours,
    setIntervalHours,
    maxCount,
    setMaxCount,
    lastTime,
    backups,
    loading,
    triggerBackup,
    removeBackup,
    restore,
    restoreExternal,
    refreshBackups,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBackupSettings.ts
git commit -m "feat(backup): add useBackupSettings hook for backup UI state"
```

---

## Chunk 4: UI & App Integration

### Task 7: Add Backup Section to SettingsPage

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

Add the "Αντίγραφα Ασφαλείας" section between the Dashboard Settings and Locations sections. This includes the enable toggle, folder picker, interval/max inputs, manual backup button, backup list, and restore buttons.

- [ ] **Step 1: Add imports**

In `src/pages/SettingsPage.tsx`, update the imports at the top of the file.

Add to the lucide-react import:

```typescript
import { Upload, MapPin, Plus, Pencil, Trash2, GripVertical, FolderOpen, Download, RotateCcw, HardDrive } from "lucide-react";
```

Add new imports after the existing imports:

```typescript
import { useBackupSettings } from "@/hooks/useBackupSettings";
import { open } from "@tauri-apps/plugin-dialog";
import { Switch } from "@/components/ui/switch";
```

Note: The `Switch` component from shadcn/ui may need to be added first. If it doesn't exist, generate it:

Run: `pnpm dlx shadcn@latest add switch`

This creates `src/components/ui/switch.tsx`.

- [ ] **Step 2: Add backup state and handlers inside SettingsPage component**

Inside the `SettingsPage` function, after the color rules state declarations (around line 108), add:

```typescript
  const {
    enabled: backupEnabled,
    setEnabled: setBackupEnabled,
    folder: backupFolder,
    updateFolder: updateBackupFolder,
    intervalHours,
    setIntervalHours,
    maxCount: backupMaxCount,
    setMaxCount: setBackupMaxCount,
    lastTime: backupLastTime,
    backups,
    loading: backupsLoading,
    triggerBackup,
    removeBackup,
    restore: restoreBackup,
    restoreExternal,
  } = useBackupSettings();

  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const handleManualBackup = async () => {
    setBackupStatus(null);
    try {
      await triggerBackup();
      setBackupStatus("Το αντίγραφο ασφαλείας δημιουργήθηκε επιτυχώς.");
    } catch (err) {
      setBackupStatus(`Αποτυχία: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePickFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (selected) {
      await updateBackupFolder(selected);
    }
  };

  const handleRestore = async (filename: string) => {
    const confirmed = window.confirm(
      "Η επαναφορά θα αντικαταστήσει όλα τα τρέχοντα δεδομένα. Συνέχεια;"
    );
    if (!confirmed) return;
    setRestoring(true);
    try {
      await restoreBackup(filename);
      // Page will reload, so no cleanup needed
    } catch (err) {
      setRestoring(false);
      setBackupStatus(`Αποτυχία επαναφοράς: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleRestoreExternal = async () => {
    const confirmed = window.confirm(
      "Η επαναφορά θα αντικαταστήσει όλα τα τρέχοντα δεδομένα. Συνέχεια;"
    );
    if (!confirmed) return;
    setRestoring(true);
    try {
      await restoreExternal();
      // Page will reload if successful
    } catch (err) {
      setRestoring(false);
      setBackupStatus(`Αποτυχία επαναφοράς: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
```

- [ ] **Step 3: Add the backup UI section in the JSX**

In the `return` statement, find the existing `<Separator />` between the Dashboard Settings section and the Locations section (around line 234). Replace that single `<Separator />` with the following block (it starts and ends with its own separators, so the replaced one is not duplicated):

First, add the loading overlay at the very top of the return, before `<div className="space-y-6 max-w-lg">`:

```tsx
      {restoring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80">
          <p className="text-lg font-semibold">Επαναφορά βάσης δεδομένων...</p>
        </div>
      )}
```

Then replace the `<Separator />` between Dashboard Settings and Locations with the following block. It starts with a separator (between Dashboard and Backup) and ends with a separator (between Backup and Locations):

```tsx
      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Αντίγραφα Ασφαλείας</h2>
        <p className="text-sm text-muted-foreground">
          Αυτόματα αντίγραφα ασφαλείας της βάσης δεδομένων.
        </p>

        <div className="flex items-center gap-3">
          <Switch
            checked={backupEnabled}
            onCheckedChange={setBackupEnabled}
            id="backup-enabled"
          />
          <Label htmlFor="backup-enabled">Ενεργοποίηση αυτόματων αντιγράφων</Label>
        </div>

        <div className="space-y-2">
          <Label>Φάκελος</Label>
          <div className="flex gap-2">
            <Input
              value={backupFolder}
              readOnly
              className="flex-1 text-xs"
            />
            <Button variant="outline" size="sm" onClick={handlePickFolder}>
              <FolderOpen className="mr-1 h-4 w-4" /> Αλλαγή...
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="space-y-2">
            <Label htmlFor="backup-interval">Συχνότητα (ώρες)</Label>
            <Input
              id="backup-interval"
              type="number"
              min={1}
              value={intervalHours}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1) setIntervalHours(n);
              }}
              className="w-20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backup-max">Μέγιστα αντίγραφα</Label>
            <Input
              id="backup-max"
              type="number"
              min={1}
              value={backupMaxCount}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n >= 1) setBackupMaxCount(n);
              }}
              className="w-20"
            />
          </div>
        </div>

        {backupLastTime && (
          <p className="text-sm text-muted-foreground">
            Τελευταίο αντίγραφο: {new Date(backupLastTime).toLocaleString("el-GR")}
          </p>
        )}

        <Button variant="outline" onClick={handleManualBackup}>
          <HardDrive className="mr-1 h-4 w-4" /> Δημιουργία αντιγράφου τώρα
        </Button>

        {backupStatus && (
          <p className={`text-sm ${backupStatus.startsWith("Αποτυχία") ? "text-red-600" : "text-green-600"}`}>
            {backupStatus}
          </p>
        )}

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Επαναφορά</h3>
          <p className="text-sm text-muted-foreground">Επιλέξτε αντίγραφο για επαναφορά:</p>

          {backupsLoading ? (
            <p className="text-sm text-muted-foreground">Φόρτωση...</p>
          ) : backups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν αντίγραφα ασφαλείας.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
              {backups.map((backup) => (
                <div
                  key={backup.filename}
                  className={`flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer ${
                    selectedBackup === backup.filename
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  } ${backup.isPreRestore ? "text-muted-foreground" : ""}`}
                  onClick={() => setSelectedBackup(backup.filename)}
                >
                  <Download className="h-3 w-3 shrink-0" />
                  <span className="flex-1 truncate">
                    {backup.isPreRestore && "(πριν επαναφορά) "}
                    {backup.date.toLocaleString("el-GR")}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBackup(backup.filename);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedBackup || restoring}
              onClick={() => selectedBackup && handleRestore(selectedBackup)}
            >
              <RotateCcw className="mr-1 h-4 w-4" /> Επαναφορά επιλεγμένου
            </Button>
            <Button variant="outline" size="sm" disabled={restoring} onClick={handleRestoreExternal}>
              <FolderOpen className="mr-1 h-4 w-4" /> Επαναφορά από αρχείο...
            </Button>
          </div>
        </div>
      </div>

      <Separator />
```

The block above replaces the single existing `<Separator />` at line 234. The first `<Separator />` separates Dashboard Settings from Backup. The final `<Separator />` separates Backup from Locations (which follows immediately in the existing code).

- [ ] **Step 4: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No errors. If `Switch` component is missing, run `pnpm dlx shadcn@latest add switch` first.

- [ ] **Step 5: Commit**

```bash
git add src/pages/SettingsPage.tsx src/components/ui/switch.tsx
git commit -m "feat(backup): add backup/restore UI section in Settings page"
```

---

### Task 8: Wire useBackupScheduler into App.tsx

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

Mount the backup scheduler hook so auto-backups start when the app launches. The hook is placed in `AppLayout` (not `App.tsx`) because `AppLayout` only renders after the database is initialized, avoiding a race condition where the scheduler tries to read settings before the DB is ready.

- [ ] **Step 1: Add the scheduler hook to AppLayout**

The scheduler must only run after the database is initialized. Since `App.tsx` renders on every state change (including before `ready` is true), the safest approach is to mount the hook in `AppLayout`, which only renders after `initDatabase()` has completed.

In `src/components/layout/AppLayout.tsx`, add the import:

```typescript
import { useBackupScheduler } from "@/hooks/useBackupScheduler";
```

Inside the `AppLayout` function, at the top of the component body (before any other logic), add:

```typescript
  useBackupScheduler();
```

Since `AppLayout` only mounts after `ready === true` in `App.tsx`, the database is guaranteed to be initialized when the scheduler's `useEffect` fires.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm build`
Expected: No errors.

- [ ] **Step 3: Manual smoke test**

Run: `pnpm tauri dev`

Verify:
1. App starts normally
2. Check `%APPDATA%/com.pgni.storagemanagement/backups/` — a backup file should appear (if no backup was made in the last 30 min)
3. Go to Settings → "Αντίγραφα Ασφαλείας" section is visible
4. Click "Δημιουργία αντιγράφου τώρα" — backup appears in the list
5. Select a backup and click "Επαναφορά επιλεγμένου" → click again to confirm → page reloads
6. "Επαναφορά από αρχείο..." opens a native file picker
7. Toggle "Ενεργοποίηση αυτόματων αντιγράφων" off and on
8. Change the backup folder via "Αλλαγή..." — subsequent backups go to the new folder

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "feat(backup): wire auto-backup scheduler into app startup"
```
