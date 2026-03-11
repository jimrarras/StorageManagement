import { useState } from "react";
import { Sidebar, type Page } from "./Sidebar";

export function AppLayout() {
  const [currentPage, setCurrentPage] = useState<Page>("stock");

  return (
    <div className="flex h-screen">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto p-6">
        {currentPage === "stock" && <div>Stock Page (TODO)</div>}
        {currentPage === "log" && <div>Activity Log Page (TODO)</div>}
        {currentPage === "scan" && <div>Scanner Page (TODO)</div>}
        {currentPage === "settings" && <div>Settings Page (TODO)</div>}
      </main>
    </div>
  );
}
