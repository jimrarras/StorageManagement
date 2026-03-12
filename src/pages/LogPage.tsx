import { useEffect } from "react";
import { ActivityTable } from "@/components/activity/ActivityTable";
import { useActivity } from "@/hooks/useActivity";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { exportActivityXlsx } from "@/lib/export";

interface LogPageProps {
  searchQuery: string;
}

export function LogPage({ searchQuery }: LogPageProps) {
  const { entries, loading, hasMore, search, loadMore } = useActivity();

  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Φόρτωση...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Κινήσεις</h1>
        <Button size="sm" variant="outline" onClick={() => exportActivityXlsx(entries)}>
          <FileSpreadsheet className="mr-1 h-4 w-4" /> Εξαγωγή XLSX
        </Button>
      </div>
      <ActivityTable data={entries} />
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Φόρτωση Περισσότερων
          </Button>
        </div>
      )}
    </div>
  );
}
