import { type ColumnDef } from "@tanstack/react-table";
import type { ActivityEntry } from "@/lib/activity";
import { Badge } from "@/components/ui/badge";

const actionColors: Record<string, string> = {
  ADD: "bg-green-100 text-green-800",
  REMOVE: "bg-red-100 text-red-800",
  EDIT: "bg-blue-100 text-blue-800",
  DELETE: "bg-gray-100 text-gray-800",
};

export const activityColumns: ColumnDef<ActivityEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "Date/Time",
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
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue<string>("action");
      return <Badge className={actionColors[action] ?? ""}>{action}</Badge>;
    },
    size: 100,
  },
  {
    accessorKey: "quantityChange",
    header: "Qty Change",
    cell: ({ row }) => {
      const change = row.getValue<number | null>("quantityChange");
      if (change == null) return "—";
      return change > 0 ? `+${change}` : `${change}`;
    },
    size: 100,
  },
];
