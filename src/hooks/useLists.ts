import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { List, ListVisibility } from "../types";

type UseListsResult = {
  lists: List[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createList: (params: { name: string; year: number; visibility: ListVisibility }) => Promise<void>;
  updateList: (id: string, updates: Partial<Pick<List, "name" | "year" | "visibility">>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
};

export function useLists(householdId: string | null, userId: string | null): UseListsResult {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLists = async () => {
    if (!householdId || !userId) {
      setLists([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("lists")
      .select<List[]>("id, household_id, owner_user_id, name, year, visibility, created_at, updated_at")
      .eq("household_id", householdId)
      .order("year", { ascending: false })
      .order("name", { ascending: true });

    setLoading(false);

    if (error) {
      console.error("Error loading lists", error);
      setError(error.message);
      return;
    }

    setLists(data ?? []);
  };

  const createList = async (params: { name: string; year: number; visibility: ListVisibility }) => {
    if (!householdId || !userId) return;

    setError(null);

    const { data, error } = await supabase
      .from("lists")
      .insert({
        household_id: householdId,
        owner_user_id: userId,
        name: params.name,
        year: params.year,
        visibility: params.visibility,
      })
      .select<List[]>("id, household_id, owner_user_id, name, year, visibility, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error creating list", error);
      setError(error.message);
      return;
    }

    if (data) {
      setLists((prev) => [data, ...prev]);
    }
  };

  const updateList = async (
    id: string,
    updates: Partial<Pick<List, "name" | "year" | "visibility">>
  ) => {
    setError(null);

    const { data, error } = await supabase
      .from("lists")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select<List[]>("id, household_id, owner_user_id, name, year, visibility, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error updating list", error);
      setError(error.message);
      return;
    }

    if (data) {
      setLists((prev) => prev.map((l) => (l.id === id ? data : l)));
    }
  };

  const deleteList = async (id: string) => {
    setError(null);

    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting list", error);
      setError(error.message);
      return;
    }

    setLists((prev) => prev.filter((l) => l.id !== id));
  };

  useEffect(() => {
    if (householdId && userId) {
      loadLists();
    } else {
      setLists([]);
    }
  }, [householdId, userId]);

  return {
    lists,
    loading,
    error,
    refresh: loadLists,
    createList,
    updateList,
    deleteList,
  };
}
