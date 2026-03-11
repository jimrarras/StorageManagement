import { Button } from "@/components/ui/button";
import type { DatePreset } from "@/lib/reports";

const presets: { key: DatePreset; label: string }[] = [
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_30", label: "30 Days" },
  { key: "last_90", label: "90 Days" },
  { key: "this_year", label: "This Year" },
];

interface DateRangeBarProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}

export function DateRangeBar({ value, onChange }: DateRangeBarProps) {
  return (
    <div className="flex gap-1">
      {presets.map(({ key, label }) => (
        <Button
          key={key}
          size="sm"
          variant={value === key ? "secondary" : "ghost"}
          onClick={() => onChange(key)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
