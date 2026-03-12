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
