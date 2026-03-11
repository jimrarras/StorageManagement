import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LowStockHistoryRow } from "@/lib/reports";

interface LowStockHistoryProps {
  rows: LowStockHistoryRow[];
}

const statusStyles: Record<LowStockHistoryRow["status"], string> = {
  OK: "bg-green-100 text-green-800",
  Low: "bg-amber-100 text-amber-800",
  Depleted: "bg-red-100 text-red-800",
};

export function LowStockHistory({ rows }: LowStockHistoryProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No items went below threshold in this period.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Barcode</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Times Below</TableHead>
          <TableHead className="text-right">Days Below</TableHead>
          <TableHead className="text-right">Current Qty</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.barcode}-${row.locationId}`}>
            <TableCell className="font-mono">{row.barcode}</TableCell>
            <TableCell>{row.description}</TableCell>
            <TableCell className="text-muted-foreground">
              {row.locationName}
            </TableCell>
            <TableCell className="text-right font-mono">
              {row.timesBelowThreshold}
            </TableCell>
            <TableCell className="text-right font-mono">
              {row.totalDaysBelow}
            </TableCell>
            <TableCell className="text-right font-mono">
              {row.currentQty}
            </TableCell>
            <TableCell>
              <Badge className={statusStyles[row.status]}>
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
