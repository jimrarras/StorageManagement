import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Button } from "./button";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 p-0.5"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Επιλογή χρώματος"
      >
        <span
          className="h-full w-full rounded-sm border"
          style={{ backgroundColor: value }}
        />
      </Button>
      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 rounded-lg border bg-background p-3 shadow-lg">
          <HexColorPicker color={value} onChange={onChange} />
          <input
            className="mt-2 w-full rounded border bg-background px-2 py-1 text-xs font-mono"
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
            }}
            maxLength={7}
          />
        </div>
      )}
    </div>
  );
}
