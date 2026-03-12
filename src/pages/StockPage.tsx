import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ItemDialog } from "@/components/inventory/ItemDialog";
import { useInventory } from "@/hooks/useInventory";
import { useLocations } from "@/hooks/useLocations";
import { LocationFilter } from "@/components/inventory/LocationFilter";
import { Plus, FileSpreadsheet, ArrowRightLeft } from "lucide-react";
import { exportInventoryXlsx } from "@/lib/export";
import { transferItem as doTransfer, deleteInventoryItem } from "@/lib/inventory";
import type { InventoryItem } from "@/lib/inventory";
import { TransferDialog } from "@/components/inventory/TransferDialog";
import { useColorRules } from "@/hooks/useColorRules";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BulkActionBar } from "@/components/inventory/BulkActionBar";

interface StockPageProps {
  searchQuery: string;
}

export function StockPage({ searchQuery }: StockPageProps) {
  const [locationId, setLocationId] = useState<number | undefined>(undefined);
  const { locations } = useLocations();
  const { items, loading, addItem, editItem, search, reorder, refresh } = useInventory(locationId);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  const { getItemColor } = useColorRules();

  // Clear checked state on filter/search change
  useEffect(() => {
    setCheckedIds(new Set());
  }, [searchQuery, locationId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  // Auto-refresh when barcode dialog modifies inventory
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("inventory-changed", handler);
    return () => window.removeEventListener("inventory-changed", handler);
  }, [refresh]);

  const handleAdd = async (data: { barcode: string; description: string; quantity: number }) => {
    try {
      await addItem(data.barcode, data.description, data.quantity);
      setDialogOpen(false);
    } catch (err) {
      setErrorMsg(`Αποτυχία προσθήκης είδους: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditSave = useCallback(async (id: number, updates: { barcode: string; description: string; quantity: number }) => {
    try {
      await editItem(id, updates);
    } catch (err) {
      setErrorMsg(`Αποτυχία επεξεργασίας είδους: ${err instanceof Error ? err.message : String(err)}`);
      throw err; // Re-throw so InventoryTable keeps edit mode open
    }
  }, [editItem]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(checkedIds);
    const failedIds = new Set<number>();
    const errors: string[] = [];
    for (const id of ids) {
      try {
        await deleteInventoryItem(id);
      } catch (err) {
        failedIds.add(id);
        errors.push(err instanceof Error ? err.message : String(id));
      }
    }
    setCheckedIds(failedIds);
    setSelectedItem(null);
    await refresh();
    if (errors.length > 0) {
      setErrorMsg(`Αποτυχία διαγραφής ${errors.length} ειδών.`);
    }
  }, [checkedIds, refresh]);

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
          <Button size="sm" onClick={() => { setDialogOpen(true); setSelectedItem(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Προσθήκη Είδους
          </Button>
          {selectedItem && locations.length >= 2 && (
            <Button size="sm" variant="outline" onClick={() => setTransferTarget(selectedItem)}>
              <ArrowRightLeft className="mr-1 h-4 w-4" /> Μεταφορά
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={async () => { try { await exportInventoryXlsx(items, locationMap); } catch (err) { setErrorMsg(`Αποτυχία εξαγωγής: ${err instanceof Error ? err.message : String(err)}`); } }}>
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
        onReorder={reorder}
        onEditSave={handleEditSave}
        locationMap={locationMap}
        getItemColor={getItemColor}
        selectedId={selectedItem?.id ?? null}
        checkedIds={checkedIds}
        onCheckedIdsChange={setCheckedIds}
      />

      <BulkActionBar
        count={checkedIds.size}
        onDelete={() => setConfirmBulkDelete(true)}
        onDeselectAll={() => setCheckedIds(new Set())}
      />

      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleAdd}
        title="Προσθήκη Είδους"
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
        open={confirmBulkDelete}
        onOpenChange={setConfirmBulkDelete}
        title="Διαγραφή Ειδών"
        description={`Θέλετε να διαγράψετε ${checkedIds.size} είδη; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.`}
        confirmLabel="Διαγραφή"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
