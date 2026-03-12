import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Plus, Minus, Search } from "lucide-react";
import {
  getInventoryByBarcode,
  addInventoryItem,
  removeQuantity,
  getNextSortOrder,
  type InventoryItem,
} from "@/lib/inventory";
import { useLocations } from "@/hooks/useLocations";

type DialogState =
  | { step: "input" }
  | { step: "found"; item: InventoryItem }
  | { step: "pick_location"; items: InventoryItem[] }
  | { step: "not_found"; barcode: string };

interface BarcodeActionDialogProps {
  open: boolean;
  onClose: () => void;
}

export function BarcodeActionDialog({ open, onClose }: BarcodeActionDialogProps) {
  const { locations } = useLocations();
  const [state, setState] = useState<DialogState>({ step: "input" });
  const [barcode, setBarcode] = useState("");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // New item form state
  const [newDescription, setNewDescription] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [newLocationId, setNewLocationId] = useState(1);

  // Focus barcode input when dialog opens or resets to input step
  useEffect(() => {
    if (open && state.step === "input") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, state.step]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      resetToInput();
    }
  }, [open]);

  // Set default location
  useEffect(() => {
    if (locations.length > 0) {
      setNewLocationId(locations[0].id);
    }
  }, [locations]);

  function resetToInput() {
    setState({ step: "input" });
    setBarcode("");
    setAmount(1);
    setError(null);
    setFeedback(null);
    setNewDescription("");
    setNewQuantity(1);
  }

  async function handleLookup() {
    if (!barcode.trim()) return;
    setError(null);
    setFeedback(null);

    const items = await getInventoryByBarcode(barcode.trim());
    if (items.length === 0) {
      setState({ step: "not_found", barcode: barcode.trim() });
    } else if (items.length === 1) {
      setState({ step: "found", item: items[0] });
    } else {
      setState({ step: "pick_location", items });
    }
  }

  async function handleAdd(item: InventoryItem) {
    try {
      setError(null);
      const sortOrder = await getNextSortOrder();
      await addInventoryItem({
        barcode: item.barcode,
        description: item.description,
        quantity: amount,
        locationId: item.locationId,
        sortOrder,
      });
      setFeedback(`+${amount}`);
      window.dispatchEvent(new Event("inventory-changed"));
      // Refresh the item to get updated quantity
      const updated = await getInventoryByBarcode(item.barcode);
      const refreshed = updated.find((i) => i.locationId === item.locationId);
      if (refreshed) setState({ step: "found", item: refreshed });
      setTimeout(() => setFeedback(null), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRemove(item: InventoryItem) {
    try {
      setError(null);
      await removeQuantity(item.barcode, amount, item.locationId);
      setFeedback(`-${amount}`);
      window.dispatchEvent(new Event("inventory-changed"));
      const updated = await getInventoryByBarcode(item.barcode);
      const refreshed = updated.find((i) => i.locationId === item.locationId);
      if (refreshed) setState({ step: "found", item: refreshed });
      setTimeout(() => setFeedback(null), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleCreateNew() {
    if (!newDescription.trim()) return;
    try {
      setError(null);
      if (state.step !== "not_found") return;
      const sortOrder = await getNextSortOrder();
      await addInventoryItem({
        barcode: state.barcode,
        description: newDescription.trim(),
        quantity: newQuantity,
        locationId: newLocationId,
        sortOrder,
      });
      setFeedback("Δημιουργήθηκε!");
      window.dispatchEvent(new Event("inventory-changed"));
      setTimeout(() => {
        resetToInput();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const locationName = (id: number) =>
    locations.find((l) => l.id === id)?.name ?? "Άγνωστη";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Γρήγορη Σάρωση</DialogTitle>
          <DialogDescription>Σαρώστε ή πληκτρολογήστε barcode για γρήγορη προσθήκη/αφαίρεση αποθέματος.</DialogDescription>
        </DialogHeader>

        {/* Barcode input — always visible */}
        {state.step === "input" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Σαρώστε ή πληκτρολογήστε barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                autoFocus
              />
              <Button type="submit" size="sm" disabled={!barcode.trim()}>
                <Search className="mr-1 h-4 w-4" /> Αναζήτηση
              </Button>
            </div>
          </form>
        )}

        {/* Found item — show details + add/remove */}
        {state.step === "found" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Barcode</p>
              <p className="font-mono">{state.item.barcode}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Περιγραφή</p>
              <p>{state.item.description}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Τρέχον Απόθεμα</p>
              <p className="text-3xl font-bold">
                {state.item.quantity}
                <span
                  className={`ml-2 text-lg transition-opacity duration-300 ${feedback ? "opacity-100" : "opacity-0"} ${feedback?.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                >
                  {feedback ?? ""}
                </span>
              </p>
            </div>
            <div className="flex items-end gap-3">
              <div>
                <Label>Ποσότητα</Label>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-24"
                />
              </div>
              <Button onClick={() => handleAdd(state.item)}>
                <Plus className="mr-1 h-4 w-4" /> Προσθήκη
              </Button>
              <Button onClick={() => handleRemove(state.item)} variant="destructive" disabled={state.item.quantity === 0}>
                <Minus className="mr-1 h-4 w-4" /> Αφαίρεση
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={resetToInput}>
              Νέα σάρωση
            </Button>
          </div>
        )}

        {/* Multiple locations — pick one */}
        {state.step === "pick_location" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Αυτό το barcode υπάρχει σε πολλές τοποθεσίες. Επιλέξτε μία:
            </p>
            {state.items.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => setState({ step: "found", item })}
              >
                <span>{locationName(item.locationId)}</span>
                <span className="text-muted-foreground">Ποσ.: {item.quantity}</span>
              </Button>
            ))}
            <Button variant="outline" className="w-full" onClick={resetToInput}>
              Ακύρωση
            </Button>
          </div>
        )}

        {/* Not found — create new item */}
        {state.step === "not_found" && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Νέο Είδος — Barcode Δεν Βρέθηκε</p>
            <div>
              <Label>Barcode</Label>
              <Input value={state.barcode} disabled />
            </div>
            <div>
              <Label>Περιγραφή</Label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label>Ποσότητα</Label>
              <Input
                type="number"
                min={0}
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="w-24"
              />
            </div>
            {locations.length > 1 && (
              <div>
                <Label>Τοποθεσία</Label>
                <Select value={String(newLocationId)} onValueChange={(v) => setNewLocationId(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={String(loc.id)}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetToInput}>Ακύρωση</Button>
              <Button onClick={handleCreateNew}>Αποθήκευση</Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {feedback && state.step !== "found" && (
          <p className="text-sm text-green-600">{feedback}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
