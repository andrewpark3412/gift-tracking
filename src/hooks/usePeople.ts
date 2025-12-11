import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Person } from "../types";

type UsePeopleResult = {
  people: Person[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createPerson: (params: { name: string; budget?: number | null }) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Pick<Person, "name" | "budget" | "is_manually_completed">>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
};

export function usePeople(listId: string | null): UsePeopleResult {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPeople = async () => {
    if (!listId) {
      setPeople([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("people")
      .select<Person[]>("id, list_id, name, budget, is_manually_completed, created_at, updated_at")
      .eq("list_id", listId)
      .order("name", { ascending: true });

    setLoading(false);

    if (error) {
      console.error("Error loading people", error);
      setError(error.message);
      return;
    }

    setPeople(data ?? []);
  };

  const createPerson = async (params: { name: string; budget?: number | null }) => {
    if (!listId) return;

    setError(null);

    const { data, error } = await supabase
      .from("people")
      .insert({
        list_id: listId,
        name: params.name,
        budget: params.budget ?? null,
      })
      .select<Person[]>("id, list_id, name, budget, is_manually_completed, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error creating person", error);
      setError(error.message);
      return;
    }

    if (data) {
      setPeople((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const updatePerson = async (
    id: string,
    updates: Partial<Pick<Person, "name" | "budget" | "is_manually_completed">>
  ) => {
    setError(null);

    const { data, error } = await supabase
      .from("people")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select<Person[]>("id, list_id, name, budget, is_manually_completed, created_at, updated_at")
      .single();

    if (error) {
      console.error("Error updating person", error);
      setError(error.message);
      return;
    }

    if (data) {
      setPeople((prev) => prev.map((p) => (p.id === id ? data : p)));
    }
  };

  const deletePerson = async (id: string) => {
    setError(null);

    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting person", error);
      setError(error.message);
      return;
    }

    setPeople((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    if (listId) {
      loadPeople();
    } else {
      setPeople([]);
    }
  }, [listId]);

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
