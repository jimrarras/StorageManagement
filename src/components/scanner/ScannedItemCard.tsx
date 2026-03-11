import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import type { InventoryItem } from "@/lib/inventory";

interface ScannedItemCardProps {
  item: InventoryItem;
  onAdd: (barcode: string, amount: number) => void;
  onRemove: (barcode: string, amount: number) => void;
}

export function ScannedItemCard({ item, onAdd, onRemove }: ScannedItemCardProps) {
  const [amount, setAmount] = useState(1);

  return (
    <div className="rounded-lg border p-6 space-y-4 max-w-md mx-auto">
      <div>
        <p className="text-sm text-muted-foreground">Barcode</p>
        <p className="text-lg font-mono">{item.barcode}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Description</p>
        <p className="text-lg">{item.description}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Current Stock</p>
        <p className="text-3xl font-bold">{item.quantity}</p>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <Button onClick={() => onAdd(item.barcode, amount)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
        <Button onClick={() => onRemove(item.barcode, amount)} variant="destructive">
          <Minus className="mr-1 h-4 w-4" /> Remove
        </Button>
      </div>
    </div>
  );
}
