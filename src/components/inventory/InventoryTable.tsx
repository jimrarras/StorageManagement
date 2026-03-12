import { useMemo } from "react";
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
import { columns } from "./columns";
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
  onRowDoubleClick: (item: InventoryItem) => void;
  onReorder: (updates: { id: number; sortOrder: number }[]) => void;
  locationMap?: Map<number, string>;
  getItemColor?: (description: string) => string | null;
  selectedId?: number | null;
}

function SortableRow({
  row,
  onRowClick,
  onRowDoubleClick,
  isSelected,
}: {
  row: Row<InventoryItem>;
  onRowClick: (item: InventoryItem) => void;
  onRowDoubleClick: (item: InventoryItem) => void;
  isSelected?: boolean;
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
      className={`cursor-pointer ${isSelected ? "bg-muted" : ""}`}
      onClick={() => onRowClick(row.original)}
      onDoubleClick={() => onRowDoubleClick(row.original)}
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
  onRowDoubleClick,
  onReorder,
  locationMap,
  getItemColor,
  selectedId,
}: InventoryTableProps) {
  const meta = useMemo(() => ({ locationMap, getItemColor }), [locationMap, getItemColor]);

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

  const rows = table.getRowModel().rows;

  const tableContent = (
    <div className="rounded-md border">
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
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`cursor-pointer ${selectedId === row.original.id ? "bg-muted" : ""}`}
                  onClick={() => onRowClick(row.original)}
                  onDoubleClick={() => onRowDoubleClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <SortableContext
                items={data.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {rows.map((row) => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    onRowClick={onRowClick}
                    onRowDoubleClick={onRowDoubleClick}
                    isSelected={selectedId === row.original.id}
                  />
                ))}
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
