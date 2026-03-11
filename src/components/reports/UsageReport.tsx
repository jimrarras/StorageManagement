import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UsageRow } from "@/lib/reports";

interface UsageReportProps {
  rows: UsageRow[];
}

function formatDepletion(days: number | null): string {
  if (days === null) return "N/A";
  if (days === 0) return "Depleted";
  return `${days} days`;
}

function depletionColor(days: number | null): string {
  if (days === null) return "text-muted-foreground";
  if (days === 0) return "text-red-600 font-bold";
  if (days <= 7) return "text-red-600";
  if (days <= 30) return "text-amber-600";
  return "";
}

export function UsageReport({ rows }: UsageReportProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No reagent usage recorded in this period.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Barcode</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Current Qty</TableHead>
          <TableHead className="text-right">Total Consumed</TableHead>
          <TableHead className="text-right">Avg Daily Usage</TableHead>
          <TableHead className="text-right">Est. Depletion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.barcode}>
            <TableCell className="font-mono">{row.barcode}</TableCell>
            <TableCell>{row.description}</TableCell>
            <TableCell className="text-right font-mono">
              {row.currentQty}
            </TableCell>
            <TableCell className="text-right font-mono">
              {row.totalConsumed}
            </TableCell>
            <TableCell className="text-right font-mono">
              {row.avgDailyUsage}
            </TableCell>
            <TableCell
              className={`text-right font-mono ${depletionColor(row.estDaysUntilDepletion)}`}
            >
              {formatDepletion(row.estDaysUntilDepletion)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
