import { useState, useCallback, useEffect } from "react";
import { ScannerView } from "@/components/scanner/ScannerView";
import { ScannedItemCard } from "@/components/scanner/ScannedItemCard";
import { ItemDialog } from "@/components/inventory/ItemDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getInventoryByBarcode,
  getInventoryByBarcodeAndLocation,
  removeQuantity,
  addInventoryItem,
  getNextSortOrder,
  type InventoryItem,
} from "@/lib/inventory";
import { useLocations } from "@/hooks/useLocations";

export function ScanPage() {
  const { locations } = useLocations();
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [multipleItems, setMultipleItems] = useState<InventoryItem[] | null>(null);
  const [newItemLocationId, setNewItemLocationId] = useState(1);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    if (locations.length > 0) {
      setNewItemLocationId(locations[0].id);
    }
  }, [locations]);

  const handleScan = useCallback(async (barcode: string) => {
    setScanning(false);
    const items = await getInventoryByBarcode(barcode);
    if (items.length === 0) {
      setScannedItem(null);
      setMultipleItems(null);
      setUnknownBarcode(barcode);
    } else if (items.length === 1) {
      setScannedItem(items[0]);
      setMultipleItems(null);
      setUnknownBarcode(null);
    } else {
      setScannedItem(null);
      setMultipleItems(items);
      setUnknownBarcode(null);
    }
  }, []);

  const handleAdd = async (barcode: string, amount: number) => {
    const locationId = scannedItem?.locationId ?? 1;
    const sortOrder = await getNextSortOrder();
    await addInventoryItem({ barcode, description: scannedItem?.description ?? "", quantity: amount, locationId, sortOrder });
    const updated = await getInventoryByBarcodeAndLocation(barcode, locationId);
    setScannedItem(updated ?? null);
  };

  const handleRemove = async (barcode: string, amount: number) => {
    const locationId = scannedItem?.locationId ?? 1;
    await removeQuantity(barcode, amount, locationId);
    const updated = await getInventoryByBarcodeAndLocation(barcode, locationId);
    setScannedItem(updated ?? null);
  };

  const handleNewItem = async (data: { barcode: string; description: string; quantity: number }) => {
    const sortOrder = await getNextSortOrder();
    await addInventoryItem({ barcode: data.barcode, description: data.description, quantity: data.quantity, locationId: newItemLocationId, sortOrder });
    const created = await getInventoryByBarcodeAndLocation(data.barcode, newItemLocationId);
    setScannedItem(created ?? null);
    setUnknownBarcode(null);
  };

  const resetScanner = () => {
    setScannedItem(null);
    setUnknownBarcode(null);
    setMultipleItems(null);
    setNewItemLocationId(1);
    setScanning(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scan</h1>
        {!scanning && (
          <Button variant="outline" onClick={resetScanner}>
            Scan Again
          </Button>
        )}
      </div>

      {scanning && <ScannerView onScan={handleScan} active={scanning} />}

      {multipleItems && (
        <div className="space-y-3 max-w-md mx-auto">
          <p className="text-sm font-medium">
            This barcode exists in multiple locations. Select one:
          </p>
          {multipleItems.map((item) => {
            const locName = locations.find((l) => l.id === item.locationId)?.name ?? "Unknown";
            return (
              <Button
                key={item.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => {
                  setScannedItem(item);
                  setMultipleItems(null);
                }}
              >
                <span>{locName}</span>
                <span className="text-muted-foreground">Qty: {item.quantity}</span>
              </Button>
            );
          })}
        </div>
      )}

      {scannedItem && (
        <ScannedItemCard item={scannedItem} onAdd={handleAdd} onRemove={handleRemove} />
      )}

      {unknownBarcode && locations.length > 1 && (
        <div className="space-y-2 max-w-md mx-auto">
          <Label>Location for new item</Label>
          <Select
            value={String(newItemLocationId)}
            onValueChange={(v) => setNewItemLocationId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ItemDialog
        open={unknownBarcode !== null}
        onClose={() => setUnknownBarcode(null)}
        onSubmit={handleNewItem}
        initialData={unknownBarcode ? { barcode: unknownBarcode, description: "", quantity: 1 } : undefined}
        title="New Item — Barcode Not Found"
      />
    </div>
  );
}
