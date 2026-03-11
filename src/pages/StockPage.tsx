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
import { useColorRules } from "@/hooks/useColorRules";

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

  const { getItemColor } = useColorRules();

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
      alert(`Αποτυχία προσθήκης είδους: ${err}`);
    }
  };

  const handleEdit = async (data: { barcode: string; description: string; quantity: number }) => {
    if (!selectedItem) return;
    try {
      await editItem(selectedItem.id, data);
      setDialogMode(null);
    } catch (err) {
      alert(`Αποτυχία επεξεργασίας είδους: ${err}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το είδος;")) {
      try {
        await deleteItem(selectedItem.id);
        setSelectedItem(null);
      } catch (err) {
        alert(`Αποτυχία διαγραφής είδους: ${err}`);
      }
    }
  };

  if (loading) return <div>Φόρτωση...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Απόθεμα</h1>
        <div className="flex gap-2">
          <LocationFilter
            value={locationId}
            onChange={setLocationId}
            locations={locations}
          />
          <Button size="sm" onClick={() => { setDialogMode("add"); setSelectedItem(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Προσθήκη Είδους
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedItem} onClick={() => setDialogMode("edit")}>
            <Pencil className="mr-1 h-4 w-4" /> Επεξεργασία
          </Button>
          <Button size="sm" variant="destructive" disabled={!selectedItem} onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Διαγραφή
          </Button>
          {selectedItem && locations.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setTransferTarget(selectedItem)}>
              <ArrowRightLeft className="mr-1 h-4 w-4" /> Μεταφορά
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => exportInventoryXlsx(items, locationMap)}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Εξαγωγή XLSX
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
        getItemColor={getItemColor}
      />

      <ItemDialog
        open={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        onSubmit={dialogMode === "edit" ? handleEdit : handleAdd}
        initialData={dialogMode === "edit" && selectedItem ? selectedItem : undefined}
        title={dialogMode === "edit" ? "Επεξεργασία Είδους" : "Προσθήκη Είδους"}
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
