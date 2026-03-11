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
import { statusLabel } from "@/lib/utils";

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
        Κανένα είδος δεν έπεσε κάτω από το όριο σε αυτήν την περίοδο.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Barcode</TableHead>
          <TableHead>Περιγραφή</TableHead>
          <TableHead>Τοποθεσία</TableHead>
          <TableHead className="text-right">Φορές Κάτω</TableHead>
          <TableHead className="text-right">Ημέρες Κάτω</TableHead>
          <TableHead className="text-right">Τρέχουσα Ποσ.</TableHead>
          <TableHead>Κατάσταση</TableHead>
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
                {statusLabel(row.status)}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
