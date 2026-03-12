import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  onDelete: () => void;
  onDeselectAll: () => void;
}

export function BulkActionBar({ count, onDelete, onDeselectAll }: BulkActionBarProps) {
  return (
    <div
      className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg transition-all duration-200 ${
        count > 0 ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      }`}
    >
      <span className="text-sm font-medium whitespace-nowrap">
        {count} επιλεγμένα
      </span>
      <div className="h-4 border-r" />
      <Button
        size="sm"
        variant="destructive"
        onClick={onDelete}
      >
        <Trash2 className="mr-1 h-4 w-4" /> Διαγραφή
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={onDeselectAll}
        aria-label="Αποεπιλογή όλων"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
