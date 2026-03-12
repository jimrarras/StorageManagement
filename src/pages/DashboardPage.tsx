import { useState, useMemo } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useLocations } from "@/hooks/useLocations";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { StockMovementChart } from "@/components/dashboard/StockMovementChart";
import { LowStockList } from "@/components/dashboard/LowStockList";
import { MostUsedChart } from "@/components/dashboard/MostUsedChart";
import { LocationFilter } from "@/components/inventory/LocationFilter";

export function DashboardPage() {
  const [locationId, setLocationId] = useState<number | undefined>(undefined);
  const { locations } = useLocations();
  const { data, loading, error, movementDays, setMovementDays } = useDashboard(locationId);

  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Φόρτωση...</div>;
  if (error) return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">Αποτυχία φόρτωσης πίνακα ελέγχου: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Πίνακας Ελέγχου</h1>
        <LocationFilter
          value={locationId}
          onChange={setLocationId}
          locations={locations}
        />
      </div>

      <KpiCards
        totalItems={data.totalItems}
        totalQuantity={data.totalQuantity}
        lowStockCount={data.lowStockItems.length}
        itemsAddedThisMonth={data.itemsAddedThisMonth}
      />

      <StockMovementChart
        data={data.stockMovement}
        days={movementDays}
        onDaysChange={setMovementDays}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LowStockList items={data.lowStockItems} locationMap={locationMap} />
        <MostUsedChart data={data.mostUsed} />
      </div>
    </div>
  );
}
