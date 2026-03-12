import { type ColumnDef } from "@tanstack/react-table";
import type { InventoryItem } from "@/lib/inventory";
import { contrastText } from "@/lib/utils";
import { GripVertical, Pencil, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EditableCell } from "./EditableCell";

export interface InventoryTableMeta {
  locationMap?: Map<number, string>;
  getItemColor?: (description: string) => string | null;
  selectedId: number | null;
  checkedIds: Set<number>;
  onToggleCheck: (id: number) => void;
  onToggleAllChecked: () => void;
  allChecked: boolean;
  editingId: number | null;
  editValues: { barcode: string; description: string; quantity: number } | null;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditValueChange: (field: "barcode" | "description" | "quantity", value: string | number) => void;
  showDragHandle: boolean;
}

function getMeta(table: { options: { meta?: unknown } }): InventoryTableMeta {
  return table.options.meta as InventoryTableMeta;
}

export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "select",
    header: ({ table }) => {
      const meta = getMeta(table);
      return (
        <Checkbox
          checked={meta.allChecked}
          onCheckedChange={() => meta.onToggleAllChecked()}
          aria-label="Επιλογή όλων"
        />
      );
    },
    size: 40,
    cell: ({ row, table }) => {
      const meta = getMeta(table);
      return (
        <Checkbox
          checked={meta.checkedIds.has(row.original.id)}
          onCheckedChange={() => meta.onToggleCheck(row.original.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Επιλογή ${row.original.barcode}`}
        />
      );
    },
  },
  {
    id: "drag",
    header: "",
    size: 40,
    cell: ({ table }) => {
      const meta = getMeta(table);
      if (!meta.showDragHandle) return null;
      return (
        <span className="cursor-grab active:cursor-grabbing text-muted-foreground" aria-label="Σύρετε για αναδιάταξη">
          <GripVertical className="h-4 w-4" />
        </span>
      );
    },
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    size: 150,
    cell: ({ row, table }) => {
      const meta = getMeta(table);
      return (
        <EditableCell
          value={row.original.barcode}
          field="barcode"
          type="text"
          rowId={row.original.id}
          editingId={meta.editingId}
          editValues={meta.editValues}
          onEditValueChange={meta.onEditValueChange}
        />
      );
    },
  },
  {
    accessorKey: "locationId",
    header: "Τοποθεσία",
    cell: ({ row, table }) => {
      const meta = getMeta(table);
      return meta.locationMap?.get(row.original.locationId) ?? "\u2014";
    },
    size: 120,
  },
  {
    accessorKey: "description",
    header: "Περιγραφή",
    cell: ({ row, table }) => {
      const meta = getMeta(table);
      const desc = row.original.description;
      const color = meta.getItemColor?.(desc) ?? null;
      const viewContent = color ? (
        <span className="px-2 py-1 rounded" style={{ backgroundColor: color, color: contrastText(color) }}>
          {desc}
        </span>
      ) : undefined;
      return (
        <EditableCell
          value={desc}
          field="description"
          type="text"
          rowId={row.original.id}
          editingId={meta.editingId}
          editValues={meta.editValues}
          onEditValueChange={meta.onEditValueChange}
          viewContent={viewContent}
        />
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Ποσότητα",
    size: 80,
    cell: ({ row, table }) => {
      const meta = getMeta(table);
      return (
        <EditableCell
          value={row.original.quantity}
          field="quantity"
          type="number"
          rowId={row.original.id}
          editingId={meta.editingId}
          editValues={meta.editValues}
          onEditValueChange={meta.onEditValueChange}
        />
      );
    },
  },
  {
    id: "actions",
    header: "",
    size: 80,
    cell: ({ row, table }) => {
      const meta = getMeta(table);
      const isEditing = meta.editingId === row.original.id;

      if (isEditing) {
        return (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-green-600 hover:text-green-700"
              onClick={(e) => { e.stopPropagation(); meta.onSaveEdit(); }}
              aria-label="Αποθήκευση"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); meta.onCancelEdit(); }}
              aria-label="Ακύρωση"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        );
      }

      return (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); meta.onStartEdit(row.original.id); }}
          aria-label="Επεξεργασία"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      );
    },
  },
];
