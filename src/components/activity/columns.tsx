import { type ColumnDef } from "@tanstack/react-table";
import type { ActivityEntry } from "@/lib/activity";
import { Badge } from "@/components/ui/badge";
import { actionLabel } from "@/lib/utils";

const actionColors: Record<string, string> = {
  ADD: "bg-green-100 text-green-800",
  REMOVE: "bg-red-100 text-red-800",
  EDIT: "bg-blue-100 text-blue-800",
  DELETE: "bg-gray-100 text-gray-800",
  TRANSFER: "bg-purple-100 text-purple-800",
};

export const activityColumns: ColumnDef<ActivityEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "Ημερομηνία/Ώρα",
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("createdAt"));
      return date.toLocaleString("el-GR");
    },
    size: 180,
  },
  {
    accessorKey: "barcode",
    header: "Barcode",
    size: 150,
  },
  {
    accessorKey: "action",
    header: "Ενέργεια",
    cell: ({ row }) => {
      const action = row.getValue<string>("action");
      return <Badge className={actionColors[action] ?? ""}>{actionLabel(action)}</Badge>;
    },
    size: 100,
  },
  {
    accessorKey: "quantityChange",
    header: "Μεταβολή Ποσ.",
    cell: ({ row }) => {
      const change = row.getValue<number | null>("quantityChange");
      if (change == null) return "—";
      return change > 0 ? `+${change}` : `${change}`;
    },
    size: 100,
  },
  {
    id: "location",
    header: "Τοποθεσία",
    cell: ({ row }) => {
      const entry = row.original;
      if (entry.action === "TRANSFER") {
        return `${entry.locationName ?? "?"} → ${entry.toLocationName ?? "?"}`;
      }
      return entry.locationName ?? "—";
    },
    size: 160,
  },
];
