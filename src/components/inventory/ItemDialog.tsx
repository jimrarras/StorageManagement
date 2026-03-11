import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { barcode: string; description: string; quantity: number }) => void | Promise<void>;
  initialData?: { barcode: string; description: string; quantity: number };
  title: string;
}

export function ItemDialog({ open, onClose, onSubmit, initialData, title }: ItemDialogProps) {
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (initialData) {
      setBarcode(initialData.barcode);
      setDescription(initialData.description);
      setQuantity(initialData.quantity);
    } else {
      setBarcode("");
      setDescription("");
      setQuantity(1);
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode || !description || quantity < 0) return;
    onSubmit({ barcode, description, quantity });
    // Don't call onClose() here — parent controls dialog lifecycle
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
