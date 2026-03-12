import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { BarcodeActionDialog } from "./BarcodeActionDialog";

export function BarcodeActionButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F2" && !open) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        title="Γρήγορη Σάρωση (F2)"
      >
        <ScanBarcode className="h-6 w-6" />
      </Button>
      <BarcodeActionDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
