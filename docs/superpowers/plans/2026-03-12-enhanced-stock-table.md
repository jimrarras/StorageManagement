# Enhanced Stock Table Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add checkbox multi-select with bulk delete, inline row editing with Save/Cancel, and polished visual states to the inventory table.

**Architecture:** The table already uses TanStack Table with `meta` for passing context to cell renderers. We extend `meta` with selection, check, and edit state. A new `EditableCell` component handles view/edit mode per cell. A new `BulkActionBar` renders the floating pill bar. `InventoryTable` manages all state and passes it through meta. `StockPage` wires the bulk delete flow and removes old toolbar buttons.

**Tech Stack:** React 19, TypeScript, TanStack Table, shadcn/ui (Checkbox, Input, Button), lucide-react, Tailwind CSS 4, dnd-kit (existing)

**Spec:** `docs/superpowers/specs/2026-03-12-enhanced-stock-table-design.md`

---

## Chunk 1: Foundation — EditableCell, Checkbox component, and column definitions

### Task 1: Generate shadcn Checkbox and create EditableCell component

**Files:**
- Generate: `src/components/ui/checkbox.tsx` (via shadcn CLI)
- Create: `src/components/inventory/EditableCell.tsx`

- [ ] **Step 1: Generate the shadcn Checkbox component**

Run:
```bash
pnpm dlx shadcn@latest add checkbox
```

Expected: `src/components/ui/checkbox.tsx` is created.

- [ ] **Step 2: Create `EditableCell.tsx`**

```tsx
import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

interface EditableCellProps {
  value: string | number;
  field: "barcode" | "description" | "quantity";
  type: "text" | "number";
  rowId: number;
  editingId: number | null;
  editValues: { barcode: string; description: string; quantity: number } | null;
  onEditValueChange: (field: "barcode" | "description" | "quantity", value: string | number) => void;
  viewContent?: ReactNode;
}

export function EditableCell({
  value,
  field,
  type,
  rowId,
  editingId,
  editValues,
  onEditValueChange,
  viewContent,
}: EditableCellProps) {
  if (editingId !== rowId || !editValues) {
    return <>{viewContent ?? value}</>;
  }

  const currentValue = editValues[field];
  const isEmpty = type === "text" && String(currentValue).trim() === "";
  const isInvalidNumber = type === "number" && (Number(currentValue) < 0 || !Number.isFinite(Number(currentValue)) || !Number.isInteger(Number(currentValue)));
  const hasError = isEmpty || isInvalidNumber;

  return (
    <Input
      type={type}
      value={currentValue}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? 1 : undefined}
      onChange={(e) => {
        const val = type === "number" ? Number(e.target.value) : e.target.value;
        onEditValueChange(field, val);
      }}
      aria-invalid={hasError || undefined}
      autoFocus={field === "barcode"}
    />
  );
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/checkbox.tsx src/components/inventory/EditableCell.tsx
git commit -m "feat(table): add Checkbox component and EditableCell for inline editing"
```

---

### Task 2: Rewrite columns.tsx with checkbox, actions, and editable cells

**Files:**
- Modify: `src/components/inventory/columns.tsx`

The new columns definition reads all state from `table.options.meta`. It defines the `InventoryTableMeta` type here since columns is the primary consumer. The columns array includes: checkbox, drag, barcode (editable), location (read-only), description (editable with color), quantity (editable), and actions (edit/save/cancel).

- [ ] **Step 1: Rewrite `columns.tsx`**

Replace the entire file with:

```tsx
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
```

- [ ] **Step 2: Verify build**

Run:
```bash
npx tsc --noEmit
```

Expected: Errors related to `InventoryTable` not yet passing the new meta fields. This is expected — Task 3 will fix it.

- [ ] **Step 3: Commit**

```bash
git add src/components/inventory/columns.tsx
git commit -m "feat(table): rewrite columns with checkbox, inline edit cells, and actions"
```

---

## Chunk 2: Table state management and row rendering

### Task 3: Rewrite InventoryTable with selection, check, and edit state

**Files:**
- Modify: `src/components/inventory/InventoryTable.tsx`

This is the biggest change. The component manages: `checkedIds` (Set), `editingId` (number | null), `editValues` (object | null). It builds the `InventoryTableMeta` and passes it as `meta` to TanStack Table. Row rendering uses `group/row` class for hover-based pencil visibility.

- [ ] **Step 1: Rewrite `InventoryTable.tsx`**

Replace the entire file with:

```tsx
import { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type Row,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columns, type InventoryTableMeta } from "./columns";
import type { InventoryItem } from "@/lib/inventory";

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

interface InventoryTableProps {
  data: InventoryItem[];
  isFiltering: boolean;
  disableDrag?: boolean;
  onRowClick: (item: InventoryItem) => void;
  onReorder: (updates: { id: number; sortOrder: number }[]) => void;
  onEditSave: (id: number, updates: { barcode: string; description: string; quantity: number }) => Promise<void>;
  locationMap?: Map<number, string>;
  getItemColor?: (description: string) => string | null;
  selectedId?: number | null;
  checkedIds: Set<number>;
  onCheckedIdsChange: (ids: Set<number>) => void;
}

function getRowClassName(
  id: number,
  selectedId: number | null | undefined,
  checkedIds: Set<number>,
  editingId: number | null,
) {
  const classes = ["cursor-pointer group/row"];
  if (editingId === id) {
    classes.push("ring-1 ring-primary/30");
  } else if (selectedId === id) {
    classes.push("bg-accent border-l-3 border-l-primary");
  } else if (checkedIds.has(id)) {
    classes.push("bg-accent/30");
  }
  return classes.join(" ");
}

function SortableRow({
  row,
  onRowClick,
  className,
  editingId,
}: {
  row: Row<InventoryItem>;
  onRowClick: (item: InventoryItem) => void;
  className: string;
  editingId: number | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: row.original.id,
    disabled: editingId !== null,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={className}
      onClick={() => onRowClick(row.original)}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          {...(cell.column.id === "drag" ? { ...listeners, ...attributes } : {})}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function InventoryTable({
  data,
  isFiltering,
  disableDrag,
  onRowClick,
  onReorder,
  onEditSave,
  locationMap,
  getItemColor,
  selectedId,
  checkedIds,
  onCheckedIdsChange,
}: InventoryTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{
    barcode: string;
    description: string;
    quantity: number;
  } | null>(null);

  const showDragHandle = !isFiltering && !disableDrag;

  const onStartEdit = useCallback((id: number) => {
    const item = data.find((i) => i.id === id);
    if (!item) return;
    setEditingId(id);
    setEditValues({
      barcode: item.barcode,
      description: item.description,
      quantity: item.quantity,
    });
  }, [data]);

  const onCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues(null);
  }, []);

  const onSaveEdit = useCallback(async () => {
    if (editingId === null || !editValues) return;
    if (!editValues.barcode.trim() || !editValues.description.trim()) return;
    if (!Number.isFinite(editValues.quantity) || editValues.quantity < 0 || !Number.isInteger(editValues.quantity)) return;
    try {
      await onEditSave(editingId, {
        barcode: editValues.barcode.trim(),
        description: editValues.description.trim(),
        quantity: editValues.quantity,
      });
      setEditingId(null);
      setEditValues(null);
    } catch {
      // StockPage already shows the error via setErrorMsg; keep row in edit mode
    }
  }, [editingId, editValues, onEditSave]);

  const onEditValueChange = useCallback((field: "barcode" | "description" | "quantity", value: string | number) => {
    setEditValues((prev) => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const onToggleCheck = useCallback((id: number) => {
    const next = new Set(checkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onCheckedIdsChange(next);
  }, [checkedIds, onCheckedIdsChange]);

  const allChecked = data.length > 0 && data.every((item) => checkedIds.has(item.id));

  const onToggleAllChecked = useCallback(() => {
    if (allChecked) {
      onCheckedIdsChange(new Set());
    } else {
      onCheckedIdsChange(new Set(data.map((item) => item.id)));
    }
  }, [allChecked, data, onCheckedIdsChange]);

  const meta: InventoryTableMeta = useMemo(() => ({
    locationMap,
    getItemColor,
    selectedId: selectedId ?? null,
    checkedIds,
    onToggleCheck,
    onToggleAllChecked,
    allChecked,
    editingId,
    editValues,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditValueChange,
    showDragHandle,
  }), [
    locationMap, getItemColor, selectedId, checkedIds, onToggleCheck,
    onToggleAllChecked, allChecked, editingId, editValues, onStartEdit,
    onCancelEdit, onSaveEdit, onEditValueChange, showDragHandle,
  ]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = data.findIndex((item) => item.id === active.id);
    const newIndex = data.findIndex((item) => item.id === over.id);

    const reordered = arrayMove(data, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({
      id: item.id,
      sortOrder: index + 1,
    }));

    onReorder(updates);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingId === null) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancelEdit();
    }
  };

  const rows = table.getRowModel().rows;

  const renderRow = (row: Row<InventoryItem>) => {
    const className = getRowClassName(row.original.id, selectedId, checkedIds, editingId);
    return (
      <TableRow
        key={row.id}
        className={className}
        onClick={() => onRowClick(row.original)}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  };

  const tableContent = (
    <div className="rounded-md border" onKeyDown={handleKeyDown}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length ? (
            isFiltering || disableDrag ? (
              rows.map(renderRow)
            ) : (
              <SortableContext
                items={data.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {rows.map((row) => {
                  const className = getRowClassName(row.original.id, selectedId, checkedIds, editingId);
                  return (
                    <SortableRow
                      key={row.id}
                      row={row}
                      onRowClick={onRowClick}
                      className={className}
                      editingId={editingId}
                    />
                  );
                })}
              </SortableContext>
            )
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-muted-foreground h-24">
                Δεν βρέθηκαν είδη.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isFiltering || disableDrag) {
    return tableContent;
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {tableContent}
    </DndContext>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npx tsc --noEmit
```

Expected: Errors in `StockPage.tsx` because the `InventoryTable` props interface changed (removed `onRowDoubleClick`, added `onEditSave`, `checkedIds`, `onCheckedIdsChange`). This is expected — Task 4 will fix it.

- [ ] **Step 3: Commit**

```bash
git add src/components/inventory/InventoryTable.tsx
git commit -m "feat(table): add selection, check, and inline edit state management"
```

---

## Chunk 3: BulkActionBar and StockPage integration

### Task 4: Create BulkActionBar component

**Files:**
- Create: `src/components/inventory/BulkActionBar.tsx`

- [ ] **Step 1: Create `BulkActionBar.tsx`**

```tsx
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onDeselectAll: () => void;
}

export function BulkActionBar({ count, onDelete, onDeselectAll }: BulkActionBarProps) {
  return (
    <div
      className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg transition-all duration-200 ${
        count > 0 ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <span className="text-sm font-medium whitespace-nowrap">
        {count} επιλεγμένα
      </span>
      <div className="h-4 border-r" />
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
      >
        <Trash2 className="mr-1 h-4 w-4" /> Διαγραφή
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={onDeselectAll}
        aria-label="Αποεπιλογή όλων"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
npx tsc --noEmit
```

Expected: Still has errors from StockPage (expected, Task 5 fixes it).

- [ ] **Step 3: Commit**

```bash
git add src/components/inventory/BulkActionBar.tsx
git commit -m "feat(table): add floating BulkActionBar component"
```

---

### Task 5: Rewrite StockPage to integrate all changes

**Files:**
- Modify: `src/pages/StockPage.tsx`

Changes:
- Remove `Pencil`, `Trash2` icon imports (no longer used in toolbar)
- Remove Edit and Delete toolbar buttons
- Remove `dialogMode === "edit"` branch — `ItemDialog` is Add-only
- Remove `onRowDoubleClick` prop
- Add `checkedIds` state, clear on filter/search change
- Add `BulkActionBar` with bulk delete via `deleteInventoryItem` directly
- Add `onEditSave` handler for inline edits
- Add `ConfirmDialog` for bulk delete confirmation

- [ ] **Step 1: Rewrite `StockPage.tsx`**

Replace the entire file with:

```tsx
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

  const handleBulkDelete = async () => {
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
          <Button size="sm" onClick={() => { setDialogOpen(true); setSelectedItem(null); }}>
            <Plus className="mr-1 h-4 w-4" /> Προσθήκη Είδους
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
```

- [ ] **Step 2: Verify build**

Run:
```bash
npx tsc --noEmit
```

Expected: Clean build, no errors.

- [ ] **Step 3: Verify the app starts**

Run:
```bash
pnpm dev
```

Expected: App loads, Stock page shows the table with checkboxes, pencil icons on hover, and inline editing works.

- [ ] **Step 4: Commit**

```bash
git add src/pages/StockPage.tsx src/components/inventory/BulkActionBar.tsx
git commit -m "feat(table): integrate bulk action bar and inline editing in StockPage"
```
