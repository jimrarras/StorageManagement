import { useState } from "react";
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
import { statusLabel } from "@/lib/utils";
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
  { header: "Περιγραφή", width: 40, accessor: (r) => r.description },
  { header: "Ποσότητα", width: 12, accessor: (r) => r.quantity },
  { header: "Τοποθεσία", width: 20, accessor: (r) => r.locationName },
  { header: "Τελευταία Ενημέρωση", width: 20, accessor: (r) => r.updatedAt },
];

const movementCols: ReportColumn<MovementRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Περιγραφή", width: 40, accessor: (r) => r.description },
  { header: "Προσθήκες", width: 12, accessor: (r) => r.totalAdded },
  { header: "Αφαιρέσεις", width: 12, accessor: (r) => r.totalRemoved },
  { header: "Εισερχόμενες Μεταφορές", width: 14, accessor: (r) => r.transfersIn },
  { header: "Εξερχόμενες Μεταφορές", width: 14, accessor: (r) => r.transfersOut },
  { header: "Καθαρή Μεταβολή", width: 12, accessor: (r) => r.netChange },
];

const lowStockCols: ReportColumn<LowStockHistoryRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Περιγραφή", width: 40, accessor: (r) => r.description },
  { header: "Τοποθεσία", width: 20, accessor: (r) => r.locationName },
  { header: "Φορές Κάτω", width: 14, accessor: (r) => r.timesBelowThreshold },
  { header: "Ημέρες Κάτω", width: 14, accessor: (r) => r.totalDaysBelow },
  { header: "Τρέχουσα Ποσ.", width: 14, accessor: (r) => r.currentQty },
  { header: "Κατάσταση", width: 12, accessor: (r) => statusLabel(r.status) },
];

const usageCols: ReportColumn<UsageRow>[] = [
  { header: "Barcode", width: 20, accessor: (r) => r.barcode },
  { header: "Περιγραφή", width: 40, accessor: (r) => r.description },
  { header: "Τρέχουσα Ποσ.", width: 14, accessor: (r) => r.currentQty },
  { header: "Συνολική Κατανάλωση", width: 16, accessor: (r) => r.totalConsumed },
  { header: "Μέση Ημερήσια Χρήση", width: 16, accessor: (r) => r.avgDailyUsage },
  {
    header: "Εκτ. Εξάντληση",
    width: 16,
    accessor: (r) =>
      r.estDaysUntilDepletion == null
        ? "Δ/Υ"
        : r.estDaysUntilDepletion === 0
          ? "Εξαντλημένο"
          : `${r.estDaysUntilDepletion} ημέρες`,
  },
];

// ---------------------------------------------------------------------------
// Export handler
// ---------------------------------------------------------------------------

function handleExport(data: ReportData | null) {
  if (!data) return;
  switch (data.tab) {
    case "snapshot":
      return exportReportXlsx("Στιγμιότυπο Αποθέματος", snapshotCols, data.rows);
    case "movement":
      return exportReportXlsx("Αναφορά Κινήσεων", movementCols, data.rows);
    case "low_stock":
      return exportReportXlsx("Ιστορικό Χαμηλού Αποθέματος", lowStockCols, data.rows);
    case "usage":
      return exportReportXlsx("Χρήση Αντιδραστηρίων", usageCols, data.rows);
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

  const [exportError, setExportError] = useState<string | null>(null);
  const hasRows = data !== null && data.rows.length > 0;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Αναφορές</h1>
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
                setExportError(null);
                await handleExport(data);
              } catch (err) {
                setExportError(`Αποτυχία εξαγωγής: ${err instanceof Error ? err.message : String(err)}`);
              }
            }}
          >
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Εξαγωγή XLSX
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
        <TabsList className="w-full">
          <TabsTrigger value="snapshot" className="flex-1 text-xs sm:text-sm">Στιγμιότυπο</TabsTrigger>
          <TabsTrigger value="movement" className="flex-1 text-xs sm:text-sm">Κινήσεις</TabsTrigger>
          <TabsTrigger value="low_stock" className="flex-1 text-xs sm:text-sm">Χαμηλό Απόθεμα</TabsTrigger>
          <TabsTrigger value="usage" className="flex-1 text-xs sm:text-sm">Χρήση</TabsTrigger>
        </TabsList>

        {/* Error */}
        {(error || exportError) && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error || exportError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Φόρτωση αναφοράς...</p>
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
