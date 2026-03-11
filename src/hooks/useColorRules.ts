import { useState, useEffect, useCallback } from "react";
import {
  getAllColorRules,
  addColorRule,
  updateColorRule,
  deleteColorRule,
  reorderColorRules,
  type ColorRule,
} from "@/lib/color-rules";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function useColorRules() {
  const [rules, setRules] = useState<ColorRule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllColorRules();
    setRules(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getItemColor = useCallback(
    (description: string): string | null => {
      for (const rule of rules) {
        const regex = new RegExp("\\b" + escapeRegex(rule.keyword) + "\\b", "i");
        if (regex.test(description)) return rule.color;
      }
      return null;
    },
    [rules]
  );

  const add = async (keyword: string, color: string) => {
    await addColorRule(keyword, color);
    await refresh();
  };

  const update = async (id: number, data: { keyword?: string; color?: string }) => {
    await updateColorRule(id, data);
    await refresh();
  };

  const remove = async (id: number) => {
    await deleteColorRule(id);
    await refresh();
  };

  const reorder = async (updates: { id: number; sortOrder: number }[]) => {
    await reorderColorRules(updates);
    await refresh();
  };

  return { rules, loading, getItemColor, add, update, remove, reorder, refresh };
}
