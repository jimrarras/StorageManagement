import { useDashboard } from "@/hooks/useDashboard";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { StockMovementChart } from "@/components/dashboard/StockMovementChart";
import { LowStockList } from "@/components/dashboard/LowStockList";
import { MostUsedChart } from "@/components/dashboard/MostUsedChart";

export function DashboardPage() {
  const { data, loading, error, movementDays, setMovementDays } = useDashboard();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Failed to load dashboard: {error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

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
        <LowStockList items={data.lowStockItems} />
        <MostUsedChart data={data.mostUsed} />
      </div>
    </div>
  );
}
