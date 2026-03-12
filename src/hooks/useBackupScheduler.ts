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
