import { useState, useEffect, useCallback, useRef } from "react";
import { getAllActivity, searchActivity, type ActivityEntry } from "@/lib/activity";

const PAGE_LIMIT = 500;

export function useActivity() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const queryRef = useRef("");

  const refresh = useCallback(async () => {
    setLoading(true);
    offsetRef.current = 0;
    queryRef.current = "";
    const data = await getAllActivity(PAGE_LIMIT, 0);
    setEntries(data);
    setHasMore(data.length === PAGE_LIMIT);
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
    setLoading(true);
    offsetRef.current = 0;
    queryRef.current = query;
    const data = await searchActivity(query, PAGE_LIMIT, 0);
    setEntries(data);
    setHasMore(data.length === PAGE_LIMIT);
    setLoading(false);
  };

  const loadMore = async () => {
    const newOffset = offsetRef.current + PAGE_LIMIT;
    offsetRef.current = newOffset;
    const data = queryRef.current
      ? await searchActivity(queryRef.current, PAGE_LIMIT, newOffset)
      : await getAllActivity(PAGE_LIMIT, newOffset);
    setEntries((prev) => [...prev, ...data]);
    setHasMore(data.length === PAGE_LIMIT);
  };

  return { entries, loading, hasMore, search, refresh, loadMore };
}
