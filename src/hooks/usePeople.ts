import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { offlineInsert, offlineUpdate, offlineDelete } from "../lib/offlineSupabase";
import type { Person } from "../types";

type UsePeopleResult = {
  people: Person[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPerson: (params: { name: string; budget?: number | null }) => Promise<void>;
  updatePerson: (
    id: string,
    updates: Partial<Pick<Person, "name" | "budget" | "is_manually_completed">>
  ) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
};

export function usePeople(listId: string | null): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(!!listId);
  const [error, setError] = useState<string | null>(null);

  const loadPeople = useCallback(async () => {
    if (!listId) {
      setPeople([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: peopleError } = await supabase
      .from("people")
      .select("*")
      .eq("list_id", listId)
      .order("name", { ascending: true });

    if (peopleError) {
      console.error("Error loading people", peopleError);
      setError(peopleError.message);
      setLoading(false);
      return;
    }

    setPeople((data ?? []) as Person[]);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  const createPerson = useCallback(
    async (params: { name: string; budget?: number | null }) => {
      if (!listId) {
        setError("Cannot create person without list.");
        return;
      }

      const personData = {
        list_id: listId,
        name: params.name,
        budget: params.budget ?? null,
        is_manually_completed: false,
      };

      const { data, error: insertError } = await offlineInsert<Person>("people", personData);

      if (insertError) {
        console.error("Error creating person", insertError);
        setError(insertError.message);
        return;
      }

      if (data) {
        setPeople((prev) => [...prev, data]);
      }
    },
    [listId]
  );

  const updatePerson = useCallback(
    async (
      id: string,
      updates: Partial<Pick<Person, "name" | "budget" | "is_manually_completed">>
    ) => {
      // Optimistically update UI
      setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

      const { error: updateError } = await offlineUpdate<Person>("people", id, updates);

      if (updateError) {
        console.error("Error updating person", updateError);
        setError(updateError.message);
        // Revert on error if online
        if (navigator.onLine) {
          loadPeople();
        }
        return;
      }
    },
    [loadPeople]
  );

  const deletePerson = useCallback(async (id: string) => {
    // Optimistically remove from UI
    setPeople((prev) => prev.filter((p) => p.id !== id));

    const { error: deleteError } = await offlineDelete("people", id);

    if (deleteError) {
      console.error("Error deleting person", deleteError);
      setError(deleteError.message);
      // Revert on error if online
      if (navigator.onLine) {
        loadPeople();
      }
      return;
    }
  }, [loadPeople]);

  return {
    people,
    loading,
    error,
    refresh: loadPeople,
    createPerson,
    updatePerson,
    deletePerson,
  };
}
