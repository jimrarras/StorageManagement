import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { importInventoryCsv, importReportCsv } from "@/lib/csv-import";
import { getLowStockThreshold, setLowStockThreshold } from "@/lib/settings";
import { useLocations } from "@/hooks/useLocations";
import { Upload, MapPin, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useColorRules } from "@/hooks/useColorRules";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRuleRow({
  rule,
  isEditing,
  editKeyword,
  editColor,
  onEditKeyword,
  onEditColor,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  rule: { id: number; keyword: string; color: string; sortOrder: number };
  isEditing: boolean;
  editKeyword: string;
  editColor: string;
  onEditKeyword: (v: string) => void;
  onEditColor: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <span {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Σύρετε για αναδιάταξη">
        <GripVertical className="h-4 w-4" />
      </span>
      {isEditing ? (
        <>
          <Input
            value={editKeyword}
            onChange={(e) => onEditKeyword(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
          />
          <ColorPicker value={editColor} onChange={onEditColor} />
          <Button size="sm" onClick={onSaveEdit}>Αποθήκευση</Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{rule.keyword}</span>
          <span
            className="h-6 w-6 rounded border"
            style={{ backgroundColor: rule.color }}
          />
          <Button size="icon" variant="ghost" onClick={onStartEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

export function SettingsPage() {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(5);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const loadedRef = useRef(false);

  const { locations, add: addLoc, rename: renameLoc, remove: removeLoc } = useLocations();
  const [newLocationName, setNewLocationName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const { rules: colorRules, add: addRule, update: updateRule, remove: removeRule, reorder: reorderRules } = useColorRules();
  const [newKeyword, setNewKeyword] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editingRuleKeyword, setEditingRuleKeyword] = useState("");
  const [editingRuleColor, setEditingRuleColor] = useState("");
  const [ruleError, setRuleError] = useState<string | null>(null);

  useEffect(() => {
    getLowStockThreshold()
      .then((val) => {
        setThreshold(val);
        loadedRef.current = true;
      })
      .catch(console.error);
  }, []);

  // Debounce threshold persistence (skip until initial load completes)
  useEffect(() => {
    if (!loadedRef.current) return;
    if (!Number.isFinite(threshold) || threshold < 0) return;
    const timer = setTimeout(async () => {
      await setLowStockThreshold(threshold);
      setThresholdSaved(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [threshold]);

  // Clear "Saved." after 2 seconds
  useEffect(() => {
    if (!thresholdSaved) return;
    const timer = setTimeout(() => setThresholdSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [thresholdSaved]);

  const handleImportInventory = async () => {
    try {
      const count = await importInventoryCsv();
      setImportStatus(`Εισήχθησαν ${count} είδη αποθέματος.`);
    } catch (err) {
      setImportStatus(`Αποτυχία εισαγωγής: ${err}`);
    }
  };

  const handleImportReport = async () => {
    try {
      const count = await importReportCsv();
      setImportStatus(`Εισήχθησαν ${count} εγγραφές δραστηριότητας.`);
    } catch (err) {
      setImportStatus(`Αποτυχία εισαγωγής: ${err}`);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    setLocationError(null);
    try {
      await addLoc(newLocationName.trim());
      setNewLocationName("");
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRenameLocation = async (id: number) => {
    if (!editingName.trim()) return;
    setLocationError(null);
    try {
      await renameLoc(id, editingName.trim());
      setEditingId(null);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteLocation = async (id: number) => {
    setLocationError(null);
    try {
      await removeLoc(id);
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Ρυθμίσεις</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Εισαγωγή CSV (Μετάπτωση)</h2>
        <p className="text-sm text-muted-foreground">
          Εισαγωγή δεδομένων από την παλιά εφαρμογή. Αυτή είναι μια εφάπαξ ενέργεια.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleImportInventory}>
            <Upload className="mr-1 h-4 w-4" /> Εισαγωγή Inventory.csv
          </Button>
          <Button variant="outline" onClick={handleImportReport}>
            <Upload className="mr-1 h-4 w-4" /> Εισαγωγή Report.csv
          </Button>
        </div>
        {importStatus && (
          <p className={`text-sm ${importStatus.startsWith("Αποτυχία") ? "text-red-600" : "text-green-600"}`}>
            {importStatus}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Ρυθμίσεις Πίνακα Ελέγχου</h2>
        <div className="space-y-2">
          <Label htmlFor="threshold">Όριο Χαμηλού Αποθέματος</Label>
          <p className="text-sm text-muted-foreground">
            Τα είδη με ποσότητα ίση ή κάτω από αυτόν τον αριθμό θα εμφανίζονται στις ειδοποιήσεις Χαμηλού Αποθέματος.
          </p>
          <Input
            id="threshold"
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n) && n >= 0) setThreshold(n);
            }}
            className="w-24"
          />
          {thresholdSaved && <p className="text-sm text-green-600">Αποθηκεύτηκε.</p>}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Τοποθεσίες</h2>
        <p className="text-sm text-muted-foreground">
          Διαχείριση τοποθεσιών αποθήκευσης. Τα είδη μπορούν να παρακολουθούνται ανά τοποθεσία.
        </p>

        <div className="space-y-2">
          {locations.map((loc) => (
            <div key={loc.id} className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {editingId === loc.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameLocation(loc.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleRenameLocation(loc.id)}
                  >
                    Αποθήκευση
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{loc.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(loc.id);
                      setEditingName(loc.name);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  {loc.id !== 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteLocation(loc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Νέο όνομα τοποθεσίας..."
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddLocation();
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAddLocation}>
            <Plus className="mr-1 h-4 w-4" /> Προσθήκη
          </Button>
        </div>

        {locationError && (
          <p className="text-sm text-red-600">{locationError}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Κανόνες Χρωμάτων</h2>
        <p className="text-sm text-muted-foreground">
          Ορίστε χρώματα βάσει λέξεων-κλειδιών στην περιγραφή. Ο πρώτος κανόνας που ταιριάζει εφαρμόζεται.
        </p>

        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = colorRules.findIndex((r) => r.id === active.id);
            const newIndex = colorRules.findIndex((r) => r.id === over.id);
            const reordered = arrayMove(colorRules, oldIndex, newIndex);
            reorderRules(reordered.map((r, i) => ({ id: r.id, sortOrder: i + 1 })));
          }}
        >
          <SortableContext items={colorRules.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {colorRules.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">Δεν υπάρχουν κανόνες. Προσθέστε έναν κανόνα παρακάτω.</p>
              )}
              {colorRules.map((rule) => (
                <SortableRuleRow
                  key={rule.id}
                  rule={rule}
                  isEditing={editingRuleId === rule.id}
                  editKeyword={editingRuleKeyword}
                  editColor={editingRuleColor}
                  onEditKeyword={setEditingRuleKeyword}
                  onEditColor={setEditingRuleColor}
                  onStartEdit={() => {
                    setEditingRuleId(rule.id);
                    setEditingRuleKeyword(rule.keyword);
                    setEditingRuleColor(rule.color);
                  }}
                  onSaveEdit={async () => {
                    if (!editingRuleKeyword.trim()) return;
                    setRuleError(null);
                    try {
                      await updateRule(rule.id, { keyword: editingRuleKeyword.trim(), color: editingRuleColor });
                      setEditingRuleId(null);
                    } catch (err) {
                      setRuleError(err instanceof Error ? err.message : String(err));
                    }
                  }}
                  onCancelEdit={() => setEditingRuleId(null)}
                  onDelete={async () => {
                    setRuleError(null);
                    try {
                      await removeRule(rule.id);
                    } catch (err) {
                      setRuleError(err instanceof Error ? err.message : String(err));
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="flex gap-2">
          <Input
            placeholder="Λέξη-κλειδί..."
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (!newKeyword.trim()) return;
                setRuleError(null);
                addRule(newKeyword.trim(), newColor)
                  .then(() => setNewKeyword(""))
                  .catch((err) => setRuleError(err instanceof Error ? err.message : String(err)));
              }
            }}
            className="flex-1"
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Button
            size="sm"
            onClick={async () => {
              if (!newKeyword.trim()) return;
              setRuleError(null);
              try {
                await addRule(newKeyword.trim(), newColor);
                setNewKeyword("");
              } catch (err) {
                setRuleError(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Προσθήκη
          </Button>
        </div>

        {ruleError && (
          <p className="text-sm text-red-600">{ruleError}</p>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Σχετικά</h2>
        <p className="text-sm text-muted-foreground">
          Διαχείριση Αποθήκης — Παρακολούθηση αποθέματος για τη Μονάδα Μοριακής Βιολογίας, ΠΓΝΙ Ιωαννίνων.
        </p>
        <p className="text-sm text-muted-foreground">
          Άδεια χρήσης CC BY-NC-SA 4.0
        </p>
      </div>
    </div>
  );
}
