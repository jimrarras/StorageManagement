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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      setErrorMsg(`Αποτυχία προσθήκης είδους: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEdit = async (data: { barcode: string; description: string; quantity: number }) => {
    if (!selectedItem) return;
    try {
      await editItem(selectedItem.id, data);
      setDialogMode(null);
    } catch (err) {
      setErrorMsg(`Αποτυχία επεξεργασίας είδους: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteItem(selectedItem.id);
      setSelectedItem(null);
    } catch (err) {
      setErrorMsg(`Αποτυχία διαγραφής είδους: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Φόρτωση...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Απόθεμα</h1>
        <div className="flex flex-wrap gap-2">
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
          <Button size="sm" variant="destructive" disabled={!selectedItem} onClick={() => setConfirmDelete(true)}>
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

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
          <button className="ml-2 font-medium underline" onClick={() => setErrorMsg(null)}>Κλείσιμο</button>
        </div>
      )}

      <InventoryTable
        data={items}
        isFiltering={!!searchQuery}
        disableDrag={locationId == null}
        onRowClick={setSelectedItem}
        onRowDoubleClick={(item) => { setSelectedItem(item); setDialogMode("edit"); }}
        onReorder={reorder}
        locationMap={locationMap}
        getItemColor={getItemColor}
        selectedId={selectedItem?.id ?? null}
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Διαγραφή Είδους"
        description="Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το είδος; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί."
        confirmLabel="Διαγραφή"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
