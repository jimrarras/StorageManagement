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

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Failed to load dashboard: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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
