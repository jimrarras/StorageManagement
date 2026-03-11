import { type ColumnDef } from "@tanstack/react-table";
import type { InventoryItem } from "@/lib/inventory";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

function getReagentColor(description: string): string | null {
  if (description.includes("perCP")) return "bg-orange-600 text-white";
  if (description.includes("FITC")) return "bg-green-800 text-white";
  // Check PE with word boundary — match "PE", "PE-Cy5", "PE/Cy7" but not "SPECIMEN"
  if (/\bPE\b/.test(description)) return "bg-red-600 text-white";
  return null;
}

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
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const desc = row.getValue<string>("description");
      const colorClass = getReagentColor(desc);
      return (
        <span className={cn("px-2 py-1 rounded", colorClass)}>
          {desc}
        </span>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    size: 80,
  },
];
