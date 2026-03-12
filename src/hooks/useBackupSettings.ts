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
