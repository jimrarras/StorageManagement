import { useState, useCallback } from "react";
import { ScannerView } from "@/components/scanner/ScannerView";
import { ScannedItemCard } from "@/components/scanner/ScannedItemCard";
import { ItemDialog } from "@/components/inventory/ItemDialog";
import { Button } from "@/components/ui/button";
import { getInventoryByBarcode } from "@/lib/inventory";
import { useInventory } from "@/hooks/useInventory";
import type { InventoryItem } from "@/lib/inventory";

export function ScanPage() {
  const { addItem, removeQty } = useInventory();
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const handleScan = useCallback(async (barcode: string) => {
    setScanning(false);
    const item = await getInventoryByBarcode(barcode);
    if (item) {
      setScannedItem(item);
      setUnknownBarcode(null);
    } else {
      setScannedItem(null);
      setUnknownBarcode(barcode);
    }
  }, []);

  const handleAdd = async (barcode: string, amount: number) => {
    await addItem(barcode, scannedItem?.description ?? "", amount);
    const updated = await getInventoryByBarcode(barcode);
    setScannedItem(updated ?? null);
  };

  const handleRemove = async (barcode: string, amount: number) => {
    await removeQty(barcode, amount);
    const updated = await getInventoryByBarcode(barcode);
    setScannedItem(updated ?? null);
  };

  const handleNewItem = async (data: { barcode: string; description: string; quantity: number }) => {
    await addItem(data.barcode, data.description, data.quantity);
    const created = await getInventoryByBarcode(data.barcode);
    setScannedItem(created ?? null);
    setUnknownBarcode(null);
  };

  const resetScanner = () => {
    setScannedItem(null);
    setUnknownBarcode(null);
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

      {scannedItem && (
        <ScannedItemCard item={scannedItem} onAdd={handleAdd} onRemove={handleRemove} />
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
