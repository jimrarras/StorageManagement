import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InventoryItem } from "@/lib/inventory";
import type { Location } from "@/lib/locations";

interface TransferDialogProps {
  open: boolean;
  onClose: () => void;
  onTransfer: (
    barcode: string,
    fromLocationId: number,
    toLocationId: number,
    quantity: number
  ) => Promise<void>;
  item: InventoryItem | null;
  locations: Location[];
}

export function TransferDialog({
  open,
  onClose,
  onTransfer,
  item,
  locations,
}: TransferDialogProps) {
  const [toLocationId, setToLocationId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (open) {
      setToLocationId(null);
      setQuantity(1);
      setError(null);
    }
  }, [open]);

  const otherLocations = locations.filter((l) => l.id !== item?.locationId);

  const handleTransfer = async () => {
    if (!item || toLocationId == null) return;
    setError(null);
    setTransferring(true);
    try {
      await onTransfer(item.barcode, item.locationId, toLocationId, quantity);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTransferring(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    } else {
      setToLocationId(null);
      setQuantity(1);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Item</DialogTitle>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                {item.barcode} — Available: {item.quantity}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Destination Location</Label>
              <Select
                value={toLocationId != null ? String(toLocationId) : ""}
                onValueChange={(v) => setToLocationId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {otherLocations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-qty">Quantity</Label>
              <Input
                id="transfer-qty"
                type="number"
                min={1}
                max={item.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-24"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={
                  toLocationId == null ||
                  quantity < 1 ||
                  quantity > item.quantity ||
                  transferring
                }
              >
                Transfer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
