# Backup & Restore — Design Spec

**Date:** 2026-03-12
**Status:** Approved
**Scope:** Automatic and manual backup/restore for the StorageManagement SQLite database

---

## Problem

StorageManagement runs on a local hospital PC that is prone to hardware failures, accidental deletions, and other data loss scenarios. There is currently no way to recover data if the database is lost or corrupted. The app also lacks a way to migrate data between machines.

## Solution

A layered backup system combining automatic scheduled backups, manual on-demand backup/restore, and backup rotation — all using the existing Tauri FS and Dialog plugins with logic in TypeScript.

### Design Principles

- **Zero user effort for protection** — auto-backups run silently on app start and on a timer
- **Cloud-ready without cloud code** — user points backup folder at a synced folder (OneDrive, Google Drive) for free cloud backup
- **Zero-risk restore** — pre-restore safety backup is always created before overwriting

---

## Architecture

### Approach: Hybrid — Tauri FS Plugin + TypeScript Logic

Uses `@tauri-apps/plugin-fs` for file operations and `@tauri-apps/plugin-dialog` for native folder/file pickers. All backup logic stays in TypeScript, matching the existing codebase patterns. No Rust code changes needed beyond ensuring FS permissions.

---

## Settings & Storage

Backup configuration stored in the existing `settings` table:

| Key | Default | Description |
|-----|---------|-------------|
| `backup_folder` | `<appDataDir>/backups` | Where backups are saved |
| `backup_interval_hours` | `4` | Hours between auto-backups while running |
| `backup_max_count` | `30` | Max backups to keep before rotation |
| `backup_enabled` | `true` | Master on/off toggle |
| `backup_last_time` | `null` | Timestamp of last successful backup |

**Backup file naming:** `storage_backup_2026-03-12T14-30-00.db`
**Pre-restore file naming:** `storage_prerestore_2026-03-12T14-30-00.db`

**Database location:** The Tauri SQL plugin loads from `sqlite:storage.db` which resolves to `<appDataDir>/storage.db` (on Windows: `C:\Users\<user>\AppData\Roaming\com.pgni.storagemanagement\storage.db`). Backups are copies of this file.

---

## Backup Logic

**Module:** `src/lib/backup.ts`

### Core Operations

1. **`createBackup()`** — Copies `storage.db` to the backup folder with a timestamped filename. Uses `fs.copyFile()`. Returns the backup path on success. Updates `backup_last_time` in settings.

2. **`listBackups()`** — Reads the backup folder with `fs.readDir()`, filters for `storage_backup_*.db` and `storage_prerestore_*.db` files, returns them sorted newest-first with filename, date (parsed from filename), file size, and type (regular vs pre-restore).

3. **`rotateBackups()`** — Called after each backup. Lists regular backups (not pre-restore), deletes the oldest ones beyond `backup_max_count` using `fs.remove()`. Pre-restore backups are exempt from rotation.

4. **`getBackupFolder()`** — Returns the configured folder from settings, defaulting to `<appDataDir>/backups`. Creates the folder if it doesn't exist via `fs.mkdir()`.

### Backup Flow

```
getBackupFolder() → ensure dir exists → PRAGMA wal_checkpoint(TRUNCATE) → copyFile(storage.db → backup folder) → rotateBackups() → update backup_last_time
```

The WAL checkpoint is executed via `getRawDb().execute("PRAGMA wal_checkpoint(TRUNCATE)")` (imported from `db.ts`). This flushes the SQLite write-ahead log before copying, ensuring the backup file is self-contained and consistent.

---

## Restore Logic

### Two Restore Paths

**A) From backup list** — `restoreFromBackup(backupFilename: string)`
- User picks from a list of known backups shown in the UI
- Path is resolved from the backup folder

**B) From external file** — `restoreFromFile()`
- Opens a native file picker via `dialog.open()` with `.db` filter
- Supports migration from USB sticks, shared drives, other machines

### Restore Flow (same for both paths)

```
1. Show full-screen loading overlay to block all user interaction during restore
2. Confirm dialog: "Η επαναφορά θα αντικαταστήσει όλα τα τρέχοντα δεδομένα. Συνέχεια;"
3. Create pre-restore safety backup → storage_prerestore_<timestamp>.db
4. Close the current database connection via closeDatabase():
   - Calls await _sqlite.close() to release the OS file lock
   - Sets _db and _sqlite to null
   - This is critical on Windows where SQLite holds an exclusive file lock
5. copyFile(selected backup → storage.db)
6. Re-initialize database (initDatabase() — the _db null guard allows re-init)
7. Full page reload via window.location.reload() to reset all cached state
   (inventory, locations, color rules, settings — all need re-fetching)
```

### Error Handling

If step 6 (initDatabase) fails due to a corrupt or incompatible backup file, the system automatically restores the pre-restore safety backup and shows an error message. This makes restore a zero-risk operation.

### Pre-Restore Backups

- Use distinct prefix `storage_prerestore_*` for visual distinction
- Shown in the backup list with muted styling and label "(πριν επαναφορά)"
- Exempt from rotation — kept indefinitely, user can manually delete from the backup list UI

---

## Scheduling

**Hook:** `src/hooks/useBackupScheduler.ts` — runs in `App.tsx`

### Two Triggers

1. **On app start** — After `initDatabase()` completes, run `createBackup()` only if `backup_last_time` is more than 30 minutes ago (or null). This throttles startup backups so that frequent app restarts don't flood the backup folder and shrink the effective history window.

2. **Interval timer** — `setInterval` at the configured interval (default 4 hours). Resets if the user changes the interval in Settings.

### Flow

```
App mounts → initDatabase() → createBackup() → start interval timer
                                                      ↓
                                              every N hours → createBackup()
```

### Details

- Reads `backup_enabled` from settings — if `false`, skips both triggers
- Runs silently in the background — no UI disruption
- If a backup fails (e.g., network drive unavailable), logs to console but doesn't interrupt the user. Next scheduled attempt will retry.
- No toast/notification — the Settings UI shows the last successful backup time

---

## UI — Settings Page

**New section in `SettingsPage.tsx`** between "Ρυθμίσεις Πίνακα Ελέγχου" and "Τοποθεσίες", titled **"Αντίγραφα Ασφαλείας"**.

### Layout

```
Αντίγραφα Ασφαλείας
────────────────────
Αυτόματα αντίγραφα ασφαλείας της βάσης δεδομένων.

[✓] Ενεργοποίηση αυτόματων αντιγράφων     ← toggle for backup_enabled

Φάκελος: [C:\Users\...\backups          ] [Αλλαγή...]  ← folder path + native picker
Συχνότητα: [4] ώρες                        ← interval input
Μέγιστα αντίγραφα: [30]                    ← max count input
Τελευταίο αντίγραφο: 12/03/2026 14:30      ← read-only, from backup_last_time

[Δημιουργία αντιγράφου τώρα]               ← manual backup button

── Επαναφορά ──
Επιλέξτε αντίγραφο για επαναφορά:
  ● storage_backup_2026-03-12T14-30-00.db  (12/03/2026 14:30)
  ● storage_backup_2026-03-11T09-00-00.db  (11/03/2026 09:00)
  ● storage_prerestore_2026-03-10T...db    (10/03/2026 ...) ← muted style
  ... (scrollable list)
[Επαναφορά επιλεγμένου]    [Επαναφορά από αρχείο...]
```

### Interactions

- **Αλλαγή... (Change)** — Opens native folder picker via `dialog.open({ directory: true })`
- **Δημιουργία αντιγράφου τώρα** — Runs `createBackup()`, shows success/error feedback
- **Επαναφορά επιλεγμένου** — Confirmation dialog → restore flow
- **Επαναφορά από αρχείο...** — Native file picker (`.db` filter) → confirmation → restore flow
- Settings auto-save with debounce, matching the existing threshold pattern
- Pre-restore backups styled with muted text and label "(πριν επαναφορά)"

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/lib/backup.ts` | Backup, restore, rotation, folder management |
| `src/hooks/useBackupScheduler.ts` | Auto-backup on mount + interval timer |
| `src/hooks/useBackupSettings.ts` | Settings state for backup UI: loads/saves all backup settings with debounce, lists backups, handles delete. Validates interval (minimum 1 hour, integer) and max count (minimum 1). |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Mount `useBackupScheduler()` |
| `src/pages/SettingsPage.tsx` | Add "Αντίγραφα Ασφαλείας" section |
| `src/lib/db.ts` | Export `closeDatabase()`: calls `await _sqlite.close()` to release OS file lock, then sets `_db`/`_sqlite` to null so `initDatabase()` can re-init |
| `src-tauri/capabilities/*.json` | Add required FS permissions: `fs:allow-copy-file`, `fs:allow-read-dir`, `fs:allow-mkdir`, `fs:allow-remove`, `fs:allow-exists`, plus scope for `$APPDATA/backups/**` and user-selected backup folders |

### No New Dependencies

Everything uses existing Tauri plugins (`fs`, `dialog`, `sql`) and React patterns already in the codebase.

---

## Testing Considerations

- Backup creates a valid, openable SQLite file
- Rotation keeps exactly `backup_max_count` regular backups
- Pre-restore backups are exempt from rotation
- Restore replaces the active database and all views refresh
- Failed restore rolls back to pre-restore backup
- Scheduler respects `backup_enabled = false`
- Folder picker updates the backup path correctly
- Backup works when target folder is on a network drive
- Backup works when target folder doesn't exist yet (auto-created)
