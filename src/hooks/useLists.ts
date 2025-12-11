import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { List, ListVisibility } from "../types";

type UseListsResult = {
  lists: List[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createList: (params: {
    name: string;
    year: number;
    visibility: ListVisibility;
  }) => Promise<void>;
  updateList: (id: string, updates: Partial<List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
};

export function useLists(
  householdId: string | null,
  userId: string | null
): UseListsResult {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState<boolean>(!!householdId);
  const [error, setError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    if (!householdId) {
      setLists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: listsError } = await supabase
      .from("lists")
      .select("*")
      .eq("household_id", householdId)
      .order("year", { ascending: false });

    if (listsError) {
      console.error("Error loading lists", listsError);
      setError(listsError.message);
      setLoading(false);
      return;
    }

    setLists((data ?? []) as List[]);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const createList = useCallback(
    async (params: {
      name: string;
      year: number;
      visibility: ListVisibility;
    }) => {
      if (!householdId || !userId) {
        setError("Cannot create list without household and user.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("lists")
        .insert({
          household_id: householdId,
          owner_user_id: userId,
          name: params.name,
          year: params.year,
          visibility: params.visibility,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating list", insertError);
        setError(insertError.message);
        return;
      }

      const newList = data as List;
      setLists((prev) => [...prev, newList]);
    },
    [householdId, userId]
  );

  const updateList = useCallback(
    async (id: string, updates: Partial<List>) => {
      const { data, error: updateError } = await supabase
        .from("lists")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (updateError) {
        console.error("Error updating list", updateError);
        setError(updateError.message);
        return;
      }

      const updated = data as List;
      setLists((prev) => prev.map((l) => (l.id === id ? updated : l)));
    },
    []
  );

  const deleteList = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from("lists")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting list", deleteError);
      setError(deleteError.message);
      return;
    }

    setLists((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { lists, loading, error, refresh: loadLists, createList, updateList, deleteList };
}
