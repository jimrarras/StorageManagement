import { Card, AreaChart } from "@tremor/react";
import { Button } from "@/components/ui/button";
import type { DailyMovement } from "@/lib/analytics";

interface StockMovementChartProps {
  data: DailyMovement[];
  days: number;
  onDaysChange: (days: number) => void;
}

const dayOptions = [30, 60, 90];

export function StockMovementChart({ data, days, onDaysChange }: StockMovementChartProps) {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Stock Movement</h3>
        <div className="flex gap-1">
          {dayOptions.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? "secondary" : "ghost"}
              onClick={() => onDaysChange(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>
      <AreaChart
        data={data}
        index="date"
        categories={["added", "removed"]}
        colors={["emerald", "rose"]}
        valueFormatter={(v) => String(v)}
        showLegend
        showAnimation
        className="h-64"
      />
    </Card>
  );
}
