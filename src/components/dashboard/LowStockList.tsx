import { Card } from "@tremor/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  id: number;
  barcode: string;
  description: string;
  quantity: number;
  locationId: number;
}

interface LowStockListProps {
  items: LowStockItem[];
  locationMap?: Map<number, string>;
  onItemClick?: (barcode: string) => void;
}

export function LowStockList({ items, locationMap, onItemClick }: LowStockListProps) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="font-semibold">Είδη σε Χαμηλό Απόθεμα</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Όλα τα είδη έχουν επαρκές απόθεμα.</p>
      ) : (
        <div className="max-h-64 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Περιγραφή</TableHead>
                <TableHead>Τοποθεσία</TableHead>
                <TableHead className="w-20 text-right">Ποσ.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className={onItemClick ? "cursor-pointer" : ""}
                  onClick={() => onItemClick?.(item.barcode)}
                >
                  <TableCell className="text-sm">{item.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {locationMap?.get(item.locationId) ?? "\u2014"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-bold text-red-600">
                    {item.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
