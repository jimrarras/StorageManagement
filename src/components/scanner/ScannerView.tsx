import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface ScannerViewProps {
  onScan: (barcode: string) => void;
  active: boolean;
}

export function ScannerView({ onScan, active }: ScannerViewProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    hasScannedRef.current = false;

    const scanner = new Html5Qrcode("scanner-region");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 150 } },
        (decodedText) => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {}
      )
      .catch((err) => setError(`Camera error: ${err}`));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [active, onScan]);

  return (
    <div>
      <div id="scanner-region" className="mx-auto max-w-md" />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
