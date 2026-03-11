import { useState, useEffect, useCallback } from "react";
import { getAllActivity, searchActivity, type ActivityEntry } from "@/lib/activity";

export function useActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllActivity();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const search = async (query: string) => {
    if (!query) {
      await refresh();
      return;
    }
    const data = await searchActivity(query);
    setEntries(data);
  };

  return { entries, loading, search, refresh };
}
