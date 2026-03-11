import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { importInventoryCsv, importReportCsv } from "@/lib/csv-import";
import { getLowStockThreshold, setLowStockThreshold } from "@/lib/settings";
import { useLocations } from "@/hooks/useLocations";
import { Upload, MapPin, Plus, Pencil, Trash2 } from "lucide-react";

export function SettingsPage() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(5);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const loadedRef = useRef(false);

  const { locations, add: addLoc, rename: renameLoc, remove: removeLoc } = useLocations();
  const [newLocationName, setNewLocationName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

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

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    setLocationError(null);
    try {
      await addLoc(newLocationName.trim());
      setNewLocationName("");
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRenameLocation = async (id: number) => {
    if (!editingName.trim()) return;
    setLocationError(null);
    try {
      await renameLoc(id, editingName.trim());
      setEditingId(null);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteLocation = async (id: number) => {
    setLocationError(null);
    try {
      await removeLoc(id);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : String(err));
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
          <p className={`text-sm ${importStatus.startsWith("Import failed") ? "text-red-600" : "text-green-600"}`}>
            {importStatus}
          </p>
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

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Locations</h2>
        <p className="text-sm text-muted-foreground">
          Manage storage locations. Items can be tracked per location.
        </p>

        <div className="space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {editingId === loc.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameLocation(loc.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleRenameLocation(loc.id)}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{loc.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(loc.id);
                      setEditingName(loc.name);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {loc.id !== 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteLocation(loc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="New location name..."
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddLocation();
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAddLocation}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>

        {locationError && (
          <p className="text-sm text-red-600">{locationError}</p>
        )}
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
