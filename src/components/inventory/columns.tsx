import { type ColumnDef } from "@tanstack/react-table";
import type { InventoryItem } from "@/lib/inventory";
import { contrastText } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export const columns: ColumnDef<InventoryItem>[] = [
  {
    id: "drag",
    header: "",
    size: 40,
    cell: () => (
      <span className="cursor-grab active:cursor-grabbing text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </span>
    ),
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    size: 150,
  },
  {
    accessorKey: "locationId",
    header: "Τοποθεσία",
    cell: ({ row, table }) => {
      const locationMap = (table.options.meta as { locationMap?: Map<number, string> })?.locationMap;
      return locationMap?.get(row.original.locationId) ?? "\u2014";
    },
    size: 120,
  },
  {
    accessorKey: "description",
    header: "Περιγραφή",
    cell: ({ row, table }) => {
      const desc = row.getValue<string>("description");
      const getItemColor = (table.options.meta as { getItemColor?: (desc: string) => string | null })?.getItemColor;
      const color = getItemColor?.(desc) ?? null;
      if (!color) return desc;
      return (
        <span
          className="px-2 py-1 rounded"
          style={{ backgroundColor: color, color: contrastText(color) }}
        >
          {desc}
        </span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Ποσότητα",
    size: 80,
  },
];
