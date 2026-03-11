import { useState, useEffect, useCallback } from "react";
import {
  getTotalUniqueItems,
  getTotalQuantity,
  getLowStockItems,
  getItemsAddedInPeriod,
  getStockMovement,
  getMostUsedReagents,
  type DailyMovement,
  type ReagentUsage,
} from "@/lib/analytics";

interface DashboardData {
  totalItems: number;
  totalQuantity: number;
  lowStockItems: { id: number; barcode: string; description: string; quantity: number }[];
  itemsAddedThisMonth: number;
  stockMovement: DailyMovement[];
  mostUsed: ReagentUsage[];
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movementDays, setMovementDays] = useState(30);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .replace("T", " ")
        .replace(/\.\d+Z$/, "");

      const [totalItems, totalQuantity, lowStockItems, itemsAddedThisMonth, stockMovement, mostUsed] =
        await Promise.all([
          getTotalUniqueItems(),
          getTotalQuantity(),
          getLowStockItems(),
          getItemsAddedInPeriod(startOfMonth),
          getStockMovement(movementDays),
          getMostUsedReagents(movementDays),
        ]);

      setData({
        totalItems,
        totalQuantity,
        lowStockItems,
        itemsAddedThisMonth,
        stockMovement,
        mostUsed,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [movementDays]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, movementDays, setMovementDays, refresh };
}
