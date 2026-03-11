import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ItemDialog } from "@/components/inventory/ItemDialog";
import { useInventory } from "@/hooks/useInventory";
import { useLocations } from "@/hooks/useLocations";
import { LocationFilter } from "@/components/inventory/LocationFilter";
import { Plus, Pencil, Trash2, FileSpreadsheet, ArrowRightLeft } from "lucide-react";
import { exportInventoryXlsx } from "@/lib/export";
import { transferItem as doTransfer } from "@/lib/inventory";
import type { InventoryItem } from "@/lib/inventory";
import { TransferDialog } from "@/components/inventory/TransferDialog";

interface StockPageProps {
  searchQuery: string;
}

export function StockPage({ searchQuery }: StockPageProps) {
  const [locationId, setLocationId] = useState<number | undefined>(undefined);
  const { locations } = useLocations();
  const { items, loading, addItem, editItem, deleteItem, search, reorder, refresh } = useInventory(locationId);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [transferTarget, setTransferTarget] = useState<InventoryItem | null>(null);

  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  const handleAdd = async (data: { barcode: string; description: string; quantity: number }) => {
    try {
      await addItem(data.barcode, data.description, data.quantity);
      setDialogMode(null);
    } catch (err) {
      alert(`Failed to add item: ${err}`);
    }
  };

  const handleEdit = async (data: { barcode: string; description: string; quantity: number }) => {
    if (!selectedItem) return;
    try {
      await editItem(selectedItem.id, data);
      setDialogMode(null);
    } catch (err) {
      alert(`Failed to edit item: ${err}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteItem(selectedItem.id);
        setSelectedItem(null);
      } catch (err) {
        alert(`Failed to delete item: ${err}`);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock</h1>
        <div className="flex gap-2">
          <LocationFilter
            value={locationId}
            onChange={setLocationId}
            locations={locations}
          />
          <Button size="sm" onClick={() => { setDialogMode("add"); setSelectedItem(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedItem} onClick={() => setDialogMode("edit")}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button size="sm" variant="destructive" disabled={!selectedItem} onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          {selectedItem && locations.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setTransferTarget(selectedItem)}>
              <ArrowRightLeft className="mr-1 h-4 w-4" /> Transfer
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => exportInventoryXlsx(items, locationMap)}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Export XLSX
          </Button>
        </div>
      </div>

      <InventoryTable
        data={items}
        isFiltering={!!searchQuery}
        disableDrag={locationId == null}
        onRowClick={setSelectedItem}
        onRowDoubleClick={(item) => { setSelectedItem(item); setDialogMode("edit"); }}
        onReorder={reorder}
        locationMap={locationMap}
      />

      <ItemDialog
        open={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        onSubmit={dialogMode === "edit" ? handleEdit : handleAdd}
        initialData={dialogMode === "edit" && selectedItem ? selectedItem : undefined}
        title={dialogMode === "edit" ? "Edit Item" : "Add Item"}
      />

      <TransferDialog
        open={transferTarget != null}
        onClose={() => setTransferTarget(null)}
        onTransfer={async (barcode, from, to, qty) => {
          await doTransfer(barcode, from, to, qty);
          await refresh();
        }}
        item={transferTarget}
        locations={locations}
      />
    </div>
  );
}
