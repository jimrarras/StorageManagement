import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { importInventoryCsv, importReportCsv } from "@/lib/csv-import";
import { getLowStockThreshold, setLowStockThreshold } from "@/lib/settings";
import { Upload } from "lucide-react";

export function SettingsPage() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(5);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    getLowStockThreshold()
      .then((val) => {
        setThreshold(val);
        loadedRef.current = true;
      })
      .catch(console.error);
  }, []);

  // Debounce threshold persistence (skip until initial load completes)
  useEffect(() => {
    if (!loadedRef.current) return;
    if (!Number.isFinite(threshold) || threshold < 0) return;
    const timer = setTimeout(async () => {
      await setLowStockThreshold(threshold);
      setThresholdSaved(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [threshold]);

  // Clear "Saved." after 2 seconds
  useEffect(() => {
    if (!thresholdSaved) return;
    const timer = setTimeout(() => setThresholdSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [thresholdSaved]);

  const handleImportInventory = async () => {
    try {
      const count = await importInventoryCsv();
      setImportStatus(`Imported ${count} inventory items.`);
    } catch (err) {
      setImportStatus(`Import failed: ${err}`);
    }
  };

  const handleImportReport = async () => {
    try {
      const count = await importReportCsv();
      setImportStatus(`Imported ${count} activity log entries.`);
    } catch (err) {
      setImportStatus(`Import failed: ${err}`);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">CSV Import (Migration)</h2>
        <p className="text-sm text-muted-foreground">
          Import data from the old StorageManagement app. This is a one-time
          operation.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleImportInventory}>
            <Upload className="mr-1 h-4 w-4" /> Import Inventory.csv
          </Button>
          <Button variant="outline" onClick={handleImportReport}>
            <Upload className="mr-1 h-4 w-4" /> Import Report.csv
          </Button>
        </div>
        {importStatus && (
          <p className="text-sm text-green-600">{importStatus}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Dashboard Settings</h2>
        <div className="space-y-2">
          <Label htmlFor="threshold">Low Stock Threshold</Label>
          <p className="text-sm text-muted-foreground">
            Items with quantity at or below this number will appear in the Low Stock alerts.
          </p>
          <Input
            id="threshold"
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0) setThreshold(n);
            }}
            className="w-24"
          />
          {thresholdSaved && <p className="text-sm text-green-600">Saved.</p>}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">About</h2>
        <p className="text-sm text-muted-foreground">
          StorageManagement — Inventory tracking for the Molecular Biology Unit,
          PGNI Hospital of Ioannina.
        </p>
        <p className="text-sm text-muted-foreground">
          Licensed under CC BY-NC-SA 4.0
        </p>
      </div>
    </div>
  );
}
