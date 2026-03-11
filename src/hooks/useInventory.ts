import { useState, useEffect, useCallback } from "react";
import {
  getAllInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  removeQuantity,
  searchInventory,
  updateSortOrder,
  getNextSortOrder,
  type InventoryItem,
} from "@/lib/inventory";

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllInventory();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (barcode: string, description: string, quantity: number) => {
    const sortOrder = await getNextSortOrder();
    await addInventoryItem({ barcode, description, quantity, sortOrder });
    await refresh();
  };

  const editItem = async (id: number, updates: { barcode?: string; description?: string; quantity?: number }) => {
    await updateInventoryItem(id, updates);
    await refresh();
  };

  const deleteItem = async (id: number) => {
    await deleteInventoryItem(id);
    await refresh();
  };

  const removeQty = async (barcode: string, amount: number) => {
    await removeQuantity(barcode, amount);
    await refresh();
  };

  const search = async (query: string) => {
    if (!query) {
      await refresh();
      return;
    }
    const data = await searchInventory(query);
    setItems(data);
  };

  const reorder = async (updates: { id: number; sortOrder: number }[]) => {
    await updateSortOrder(updates);
    await refresh();
  };

  return { items, loading, addItem, editItem, deleteItem, removeQty, search, reorder, refresh };
}
