import { memo, type ReactNode } from "react";
import { Input } from "@/components/ui/input";

interface EditableCellProps {
  value: string | number;
  field: "barcode" | "description" | "quantity";
  type: "text" | "number";
  rowId: number;
  editingId: number | null;
  editValues: { barcode: string; description: string; quantity: number } | null;
  onEditValueChange: (field: "barcode" | "description" | "quantity", value: string | number) => void;
  viewContent?: ReactNode;
}

export const EditableCell = memo(function EditableCell({
  value,
  field,
  type,
  rowId,
  editingId,
  editValues,
  onEditValueChange,
  viewContent,
}: EditableCellProps) {
  if (editingId !== rowId || !editValues) {
    return <>{viewContent ?? value}</>;
  }

  const currentValue = editValues[field];
  const isEmpty = type === "text" && String(currentValue).trim() === "";
  const isInvalidNumber = type === "number" && (Number(currentValue) < 0 || !Number.isFinite(Number(currentValue)) || !Number.isInteger(Number(currentValue)));
  const hasError = isEmpty || isInvalidNumber;

  return (
    <Input
      type={type}
      value={currentValue}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? 1 : undefined}
      onChange={(e) => {
        const val = type === "number" ? Number(e.target.value) : e.target.value;
        onEditValueChange(field, val);
      }}
      aria-invalid={hasError || undefined}
      autoFocus={field === "barcode"}
    />
  );
});
