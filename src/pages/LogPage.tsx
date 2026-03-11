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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <Button size="sm" variant="outline" onClick={() => exportActivityXlsx(entries)}>
          <FileSpreadsheet className="mr-1 h-4 w-4" /> Export XLSX
        </Button>
      </div>
      <ActivityTable data={entries} />
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
