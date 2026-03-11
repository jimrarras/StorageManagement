import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Location } from "@/lib/locations";

interface LocationFilterProps {
  value: number | undefined;
  onChange: (locationId: number | undefined) => void;
  locations: Location[];
}

export function LocationFilter({
  value,
  onChange,
  locations,
}: LocationFilterProps) {
  return (
    <Select
      value={value != null ? String(value) : "all"}
      onValueChange={(v) => onChange(v === "all" ? undefined : Number(v))}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All Locations" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Locations</SelectItem>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={String(loc.id)}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
