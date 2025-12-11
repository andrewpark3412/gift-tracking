import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Gift, GiftStatus } from "../types";

type UseGiftsResult = {
  gifts: Gift[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createGift: (params: {
    description: string;
    price: number;
    status: GiftStatus;
    isWrapped?: boolean;
    notes?: string | null;
  }) => Promise<void>;
  updateGift: (
    id: string,
    updates: Partial<Pick<Gift, "description" | "price" | "status" | "is_wrapped" | "notes">>
  ) => Promise<void>;
  deleteGift: (id: string) => Promise<void>;
};

export function useGifts(personId: string | null): UseGiftsResult {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGifts = async () => {
    if (!personId) {
      setGifts([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("gifts")
      .select<Gift[]>(
        "id, person_id, description, price, status, is_wrapped, notes, created_at, updated_at"
      )
      .eq("person_id", personId)
      .order("created_at", { ascending: true });

    setLoading(false);

    if (error) {
      console.error("Error loading gifts", error);
      setError(error.message);
      return;
    }

    setGifts(data ?? []);
  };

  const createGift = async (params: {
    description: string;
    price: number;
    status: GiftStatus;
    isWrapped?: boolean;
    notes?: string | null;
  }) => {
    if (!personId) return;

    setError(null);

    const { data, error } = await supabase
      .from("gifts")
      .insert({
        person_id: personId,
        description: params.description,
        price: params.price,
        status: params.status,
        is_wrapped: params.isWrapped ?? false,
        notes: params.notes ?? null,
      })
      .select<Gift[]>(
        "id, person_id, description, price, status, is_wrapped, notes, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("Error creating gift", error);
      setError(error.message);
      return;
    }

    if (data) {
      setGifts((prev) => [...prev, data]);
    }
  };

  const updateGift = async (
    id: string,
    updates: Partial<Pick<Gift, "description" | "price" | "status" | "is_wrapped" | "notes">>
  ) => {
    setError(null);

    const { data, error } = await supabase
      .from("gifts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select<Gift[]>(
        "id, person_id, description, price, status, is_wrapped, notes, created_at, updated_at"
      )
      .single();

    if (error) {
      console.error("Error updating gift", error);
      setError(error.message);
      return;
    }

    if (data) {
      setGifts((prev) => prev.map((g) => (g.id === id ? data : g)));
    }
  };

  const deleteGift = async (id: string) => {
    setError(null);

    const { error } = await supabase.from("gifts").delete().eq("id", id);

    if (error) {
      console.error("Error deleting gift", error);
      setError(error.message);
      return;
    }

    setGifts((prev) => prev.filter((g) => g.id !== id));
  };

  useEffect(() => {
    if (personId) {
      loadGifts();
    } else {
      setGifts([]);
    }
  }, [personId]);

  return {
    gifts,
    loading,
    error,
    refresh: loadGifts,
    createGift,
    updateGift,
    deleteGift,
  };
}
