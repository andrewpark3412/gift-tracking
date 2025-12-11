import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { List, ListVisibility, Person } from "../types";

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
  duplicateList: (
    sourceListId: string,
    opts?: { newName?: string; newYear?: number }
  ) => Promise<List | null>;
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

  const duplicateList = useCallback(
    async (
      sourceListId: string,
      opts?: { newName?: string; newYear?: number }
    ): Promise<List | null> => {
      const source = lists.find((l) => l.id === sourceListId);
      if (!source) {
        console.error("duplicateList: source list not found");
        setError("Source list not found.");
        return null;
      }

      const nextYear = opts?.newYear ?? source.year + 1;

      // Try to smart-replace the year in the name; if not present, append
      const yearStr = String(source.year);
      let suggestedName = source.name.includes(yearStr)
        ? source.name.replace(yearStr, String(nextYear))
        : `${source.name} ${nextYear}`;

      const newName = opts?.newName ?? suggestedName;

      // 1) Create the new list
      const { data: createdList, error: createError } = await supabase
        .from("lists")
        .insert({
          household_id: source.household_id,
          owner_user_id: source.owner_user_id,
          name: newName,
          year: nextYear,
          visibility: source.visibility,
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Error duplicating list (create new list)", createError);
        setError(createError.message);
        return null;
      }

      const newList = createdList as List;

      // 2) Load people from the source list
      const { data: peopleData, error: peopleError } = await supabase
        .from("people")
        .select("*")
        .eq("list_id", source.id);

      if (peopleError) {
        console.error("Error loading people for duplicate", peopleError);
        setError(peopleError.message);
        // Still return the new list even if people copy fails
        setLists((prev) => [...prev, newList]);
        return newList;
      }

      const sourcePeople = (peopleData ?? []) as Person[];

      if (sourcePeople.length > 0) {
        const insertPayload = sourcePeople.map((p) => ({
          list_id: newList.id,
          name: p.name,
          budget: p.budget,
          is_manually_completed: false, // reset completion
        }));

        const { error: insertPeopleError } = await supabase
          .from("people")
          .insert(insertPayload);

        if (insertPeopleError) {
          console.error(
            "Error inserting duplicated people for new list",
            insertPeopleError
          );
          setError(insertPeopleError.message);
        }
      }

      // Update local lists state
      setLists((prev) => [...prev, newList]);

      return newList;
    },
    [lists]
  );

  return {
    lists,
    loading,
    error,
    refresh: loadLists,
    createList,
    updateList,
    deleteList,
    duplicateList,
  };
}
