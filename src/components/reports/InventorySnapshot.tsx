import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SnapshotRow } from "@/lib/reports";

interface InventorySnapshotProps {
  rows: SnapshotRow[];
}

export function InventorySnapshot({ rows }: InventorySnapshotProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No inventory items found.
      </p>
    );
  }

  // Group rows by locationName
  const groups = new Map<string, SnapshotRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.locationName);
    if (existing) {
      existing.push(row);
    } else {
      groups.set(row.locationName, [row]);
    }
  }

  return (
    <div className="space-y-6">
      {[...groups.entries()].map(([locationName, items]) => (
        <div key={locationName} className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2">
            <h3 className="text-sm font-semibold">{locationName}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={`${row.barcode}-${row.locationId}`}>
                  <TableCell className="font-mono">{row.barcode}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell className="text-right font-mono">
                    {row.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(row.updatedAt).toLocaleDateString("el-GR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
