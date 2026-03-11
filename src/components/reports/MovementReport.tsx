import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MovementRow } from "@/lib/reports";

interface MovementReportProps {
  rows: MovementRow[];
}

function fmt(value: number, sign: "+" | "-"): string {
  return value === 0 ? "\u2014" : `${sign}${value}`;
}

export function MovementReport({ rows }: MovementReportProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Δεν καταγράφηκαν κινήσεις σε αυτήν την περίοδο.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Barcode</TableHead>
          <TableHead>Περιγραφή</TableHead>
          <TableHead className="text-right">Προσθήκες</TableHead>
          <TableHead className="text-right">Αφαιρέσεις</TableHead>
          <TableHead className="text-right">Εισερχόμενες Μεταφορές</TableHead>
          <TableHead className="text-right">Εξερχόμενες Μεταφορές</TableHead>
          <TableHead className="text-right">Καθαρή Μεταβολή</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.barcode}>
            <TableCell className="font-mono">{row.barcode}</TableCell>
            <TableCell>{row.description}</TableCell>
            <TableCell className="text-right font-mono text-green-600">
              {fmt(row.totalAdded, "+")}
            </TableCell>
            <TableCell className="text-right font-mono text-red-600">
              {fmt(row.totalRemoved, "-")}
            </TableCell>
            <TableCell className="text-right font-mono text-purple-600">
              {fmt(row.transfersIn, "+")}
            </TableCell>
            <TableCell className="text-right font-mono text-purple-600">
              {fmt(row.transfersOut, "-")}
            </TableCell>
            <TableCell
              className={`text-right font-mono font-bold ${
                row.netChange > 0
                  ? "text-green-600"
                  : row.netChange < 0
                    ? "text-red-600"
                    : ""
              }`}
            >
              {row.netChange > 0
                ? `+${row.netChange}`
                : row.netChange === 0
                  ? "0"
                  : row.netChange}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
