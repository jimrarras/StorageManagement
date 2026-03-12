import { useState, useEffect } from "react";
import { Sidebar, type Page } from "./Sidebar";
import { SearchBar } from "./SearchBar";
import { DashboardPage } from "@/pages/DashboardPage";
import { StockPage } from "@/pages/StockPage";
import { LogPage } from "@/pages/LogPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { BarcodeActionButton } from "@/components/barcode/BarcodeActionButton";

export function AppLayout() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search on page change
  useEffect(() => {
    setSearchQuery("");
  }, [currentPage]);

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto p-6">
        {(currentPage === "stock" || currentPage === "log") && (
          <div className="mb-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={currentPage === "stock" ? "Αναζήτηση barcode ή περιγραφής..." : "Αναζήτηση barcode ή ημερομηνίας..."}
            />
          </div>
        )}
        {currentPage === "dashboard" && <DashboardPage />}
        {currentPage === "stock" && <StockPage searchQuery={searchQuery} />}
        {currentPage === "log" && <LogPage searchQuery={searchQuery} />}
        {currentPage === "reports" && <ReportsPage />}
        {currentPage === "settings" && <SettingsPage />}
      </main>
      <BarcodeActionButton />
    </div>
  );
}
