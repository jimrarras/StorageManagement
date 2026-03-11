import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ItemDialog } from "@/components/inventory/ItemDialog";
import { useInventory } from "@/hooks/useInventory";
import { Plus, Pencil, Trash2, FileSpreadsheet } from "lucide-react";
import { exportInventoryXlsx } from "@/lib/export";
import type { InventoryItem } from "@/lib/inventory";

interface StockPageProps {
  searchQuery: string;
}

export function StockPage({ searchQuery }: StockPageProps) {
  const { items, loading, addItem, editItem, deleteItem, search, reorder } = useInventory();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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
      await deleteItem(selectedItem.id);
      setSelectedItem(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setDialogMode("add"); setSelectedItem(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </Button>
          <Button size="sm" variant="outline" disabled={!selectedItem} onClick={() => setDialogMode("edit")}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
          <Button size="sm" variant="destructive" disabled={!selectedItem} onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportInventoryXlsx(items)}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> Export XLSX
          </Button>
        </div>
      </div>

      <InventoryTable
        data={items}
        isFiltering={!!searchQuery}
        onRowClick={setSelectedItem}
        onRowDoubleClick={(item) => { setSelectedItem(item); setDialogMode("edit"); }}
        onReorder={reorder}
      />

      <ItemDialog
        open={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        onSubmit={dialogMode === "edit" ? handleEdit : handleAdd}
        initialData={dialogMode === "edit" && selectedItem ? selectedItem : undefined}
        title={dialogMode === "edit" ? "Edit Item" : "Add Item"}
      />
    </div>
  );
}
