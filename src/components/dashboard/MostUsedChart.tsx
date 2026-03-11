import { Card, BarList } from "@tremor/react";
import { TrendingDown } from "lucide-react";
import type { ReagentUsage } from "@/lib/analytics";

interface MostUsedChartProps {
  data: ReagentUsage[];
}

export function MostUsedChart({ data }: MostUsedChartProps) {
  const barData = data.map((item) => ({
    name: item.description,
    value: item.totalRemoved,
  }));

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-purple-600" />
        <h3 className="font-semibold">Most Used Reagents</h3>
      </div>
      {barData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No usage data yet.</p>
      ) : (
        <BarList data={barData} showAnimation className="mt-2" />
      )}
    </Card>
  );
}
