import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useReport, type ReportTab, type ReportData } from "@/hooks/useReport";
import { useLocations } from "@/hooks/useLocations";
import { LocationFilter } from "@/components/inventory/LocationFilter";
import { DateRangeBar } from "@/components/reports/DateRangeBar";
import { InventorySnapshot } from "@/components/reports/InventorySnapshot";
import { MovementReport } from "@/components/reports/MovementReport";
import { LowStockHistory } from "@/components/reports/LowStockHistory";
import { UsageReport } from "@/components/reports/UsageReport";
import { exportReportXlsx, type ReportColumn } from "@/lib/export";
import type {
  SnapshotRow,
  MovementRow,
  LowStockHistoryRow,
  UsageRow,
} from "@/lib/reports";

// ---------------------------------------------------------------------------
// Column configs for XLSX export (kept at module scope)
// ---------------------------------------------------------------------------

const snapshotCols: ReportColumn<SnapshotRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Description", width: 40, accessor: (r) => r.description },
  { header: "Quantity", width: 12, accessor: (r) => r.quantity },
  { header: "Location", width: 20, accessor: (r) => r.locationName },
  { header: "Last Updated", width: 20, accessor: (r) => r.updatedAt },
];

const movementCols: ReportColumn<MovementRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Description", width: 40, accessor: (r) => r.description },
  { header: "Added", width: 12, accessor: (r) => r.totalAdded },
  { header: "Removed", width: 12, accessor: (r) => r.totalRemoved },
  { header: "Transfers In", width: 14, accessor: (r) => r.transfersIn },
  { header: "Transfers Out", width: 14, accessor: (r) => r.transfersOut },
  { header: "Net Change", width: 12, accessor: (r) => r.netChange },
];

const lowStockCols: ReportColumn<LowStockHistoryRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Description", width: 40, accessor: (r) => r.description },
  { header: "Location", width: 20, accessor: (r) => r.locationName },
  { header: "Times Below", width: 14, accessor: (r) => r.timesBelowThreshold },
  { header: "Days Below", width: 14, accessor: (r) => r.totalDaysBelow },
  { header: "Current Qty", width: 14, accessor: (r) => r.currentQty },
  { header: "Status", width: 12, accessor: (r) => r.status },
];

const usageCols: ReportColumn<UsageRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Description", width: 40, accessor: (r) => r.description },
  { header: "Current Qty", width: 14, accessor: (r) => r.currentQty },
  { header: "Total Consumed", width: 16, accessor: (r) => r.totalConsumed },
  { header: "Avg Daily Usage", width: 16, accessor: (r) => r.avgDailyUsage },
  {
    header: "Est. Depletion",
    width: 16,
    accessor: (r) =>
      r.estDaysUntilDepletion == null
        ? "N/A"
        : r.estDaysUntilDepletion === 0
          ? "Depleted"
          : `${r.estDaysUntilDepletion} days`,
  },
];

// ---------------------------------------------------------------------------
// Export handler
// ---------------------------------------------------------------------------

function handleExport(data: ReportData | null) {
  if (!data) return;
  switch (data.tab) {
    case "snapshot":
      return exportReportXlsx("Inventory Snapshot", snapshotCols, data.rows);
    case "movement":
      return exportReportXlsx("Movement Report", movementCols, data.rows);
    case "low_stock":
      return exportReportXlsx("Low Stock History", lowStockCols, data.rows);
    case "usage":
      return exportReportXlsx("Reagent Usage", usageCols, data.rows);
  }
}

// ---------------------------------------------------------------------------
// ReportsPage
// ---------------------------------------------------------------------------

export function ReportsPage() {
  const { locations } = useLocations();
  const {
    tab,
    setTab,
    preset,
    setPreset,
    locationId,
    setLocationId,
    data,
    loading,
    error,
  } = useReport();

  const hasRows = data !== null && data.rows.length > 0;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex gap-2">
          <LocationFilter
            value={locationId}
            onChange={setLocationId}
            locations={locations}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={loading || !hasRows}
            onClick={async () => {
              try {
                await handleExport(data);
              } catch (err) {
                alert(`Export failed: ${err}`);
              }
            }}
          >
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Export XLSX
          </Button>
        </div>
      </div>

      {/* Date range bar — hidden for the snapshot tab (point-in-time) */}
      {tab !== "snapshot" && (
        <DateRangeBar value={preset} onChange={setPreset} />
      )}

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ReportTab)}
      >
        <TabsList>
          <TabsTrigger value="snapshot">Inventory Snapshot</TabsTrigger>
          <TabsTrigger value="movement">Movement</TabsTrigger>
          <TabsTrigger value="low_stock">Low Stock History</TabsTrigger>
          <TabsTrigger value="usage">Reagent Usage</TabsTrigger>
        </TabsList>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="text-sm text-muted-foreground">Loading report...</p>
        )}

        {/* Tab content */}
        {!loading && !error && (
          <>
            <TabsContent value="snapshot">
              {data?.tab === "snapshot" && (
                <InventorySnapshot rows={data.rows} />
              )}
            </TabsContent>
            <TabsContent value="movement">
              {data?.tab === "movement" && (
                <MovementReport rows={data.rows} />
              )}
            </TabsContent>
            <TabsContent value="low_stock">
              {data?.tab === "low_stock" && (
                <LowStockHistory rows={data.rows} />
              )}
            </TabsContent>
            <TabsContent value="usage">
              {data?.tab === "usage" && <UsageReport rows={data.rows} />}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
