import { LayoutDashboard, Package, ScrollText, ScanBarcode, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export type Page = "dashboard" | "stock" | "log" | "scan" | "settings";

const navItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { page: "stock", label: "Stock", icon: Package },
  { page: "log", label: "Activity Log", icon: ScrollText },
  { page: "scan", label: "Scan", icon: ScanBarcode },
];

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <div className="flex h-full w-56 flex-col border-r bg-muted/40 p-4">
      <h2 className="mb-6 text-lg font-semibold">StorageManagement</h2>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ page, label, icon: Icon }) => (
          <Button
            key={page}
            variant={currentPage === page ? "secondary" : "ghost"}
            className="justify-start gap-2"
            onClick={() => onPageChange(page)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </nav>
      <Separator className="my-2" />
      <Button
        variant={currentPage === "settings" ? "secondary" : "ghost"}
        className="justify-start gap-2"
        onClick={() => onPageChange("settings")}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>
    </div>
  );
}
