import { Card } from "@tremor/react";
import { Package, AlertTriangle, TrendingUp, Archive } from "lucide-react";

interface KpiCardsProps {
  totalItems: number;
  totalQuantity: number;
  lowStockCount: number;
  itemsAddedThisMonth: number;
}

const kpis = [
  { key: "totalItems", label: "Μοναδικά Είδη", icon: Package, color: "text-blue-600" },
  { key: "totalQuantity", label: "Σύνολο σε Απόθεμα", icon: Archive, color: "text-green-600" },
  { key: "lowStockCount", label: "Χαμηλό Απόθεμα", icon: AlertTriangle, color: "text-amber-600" },
  { key: "itemsAddedThisMonth", label: "Προσθήκες Μήνα", icon: TrendingUp, color: "text-purple-600" },
] as const;

export function KpiCards({ totalItems, totalQuantity, lowStockCount, itemsAddedThisMonth }: KpiCardsProps) {
  const values: Record<string, number> = { totalItems, totalQuantity, lowStockCount, itemsAddedThisMonth };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {kpis.map(({ key, label, icon: Icon, color }) => (
        <Card key={key} className="p-4">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{values[key]}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
