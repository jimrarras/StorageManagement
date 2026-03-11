import { useState, useEffect, useCallback } from "react";
import {
  getAllLocations,
  addLocation,
  renameLocation,
  deleteLocation,
  type Location,
} from "@/lib/locations";

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getAllLocations();
    setLocations(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (name: string) => {
    await addLocation(name);
    await refresh();
  };

  const rename = async (id: number, name: string) => {
    await renameLocation(id, name);
    await refresh();
  };

  const remove = async (id: number) => {
    await deleteLocation(id);
    await refresh();
  };

  return { locations, loading, refresh, add, rename, remove };
}
