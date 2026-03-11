import { useState, useEffect, useCallback } from "react";
import {
  type DatePreset,
  resolveDatePreset,
  getInventorySnapshot,
  getMovementReport,
  getLowStockHistory,
  getUsageReport,
  type SnapshotRow,
  type MovementRow,
  type LowStockHistoryRow,
  type UsageRow,
} from "@/lib/reports";

export type ReportTab = "snapshot" | "movement" | "low_stock" | "usage";

export type ReportData =
  | { tab: "snapshot"; rows: SnapshotRow[] }
  | { tab: "movement"; rows: MovementRow[] }
  | { tab: "low_stock"; rows: LowStockHistoryRow[] }
  | { tab: "usage"; rows: UsageRow[] };

export function useReport() {
  const [tab, setTab] = useState<ReportTab>("snapshot");
  const [preset, setPreset] = useState<DatePreset>("this_month");
  const [locationId, setLocationId] = useState<number | undefined>(undefined);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = resolveDatePreset(preset);
      let result: ReportData;

      switch (tab) {
        case "snapshot":
          result = { tab, rows: await getInventorySnapshot(locationId) };
          break;
        case "movement":
          result = { tab, rows: await getMovementReport(range, locationId) };
          break;
        case "low_stock":
          result = { tab, rows: await getLowStockHistory(range, locationId) };
          break;
        case "usage":
          result = { tab, rows: await getUsageReport(range, locationId) };
          break;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [tab, preset, locationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    tab, setTab,
    preset, setPreset,
    locationId, setLocationId,
    data, loading, error,
    refresh,
  };
}
