import { useCallback, useEffect, useState } from "react";
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
  updateGift: (id: string, updates: Partial<Gift>) => Promise<void>;
  deleteGift: (id: string) => Promise<void>;
};

export function useGifts(personId: string): UseGiftsResult {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState<boolean>(!!personId);
  const [error, setError] = useState<string | null>(null);

  const loadGifts = useCallback(async () => {
    if (!personId) {
      setGifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: giftsError } = await supabase
      .from("gifts")
      .select("*")
      .eq("person_id", personId)
      .order("created_at", { ascending: true });

    if (giftsError) {
      console.error("Error loading gifts", giftsError);
      setError(giftsError.message);
      setLoading(false);
      return;
    }

    setGifts((data ?? []) as Gift[]);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  const createGift = useCallback(
    async (params: {
      description: string;
      price: number;
      status: GiftStatus;
      isWrapped?: boolean;
      notes?: string | null;
    }) => {
      if (!personId) {
        setError("Cannot create gift without person.");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("gifts")
        .insert({
          person_id: personId,
          description: params.description,
          price: params.price,
          status: params.status,
          is_wrapped: params.isWrapped ?? false,
          notes: params.notes ?? null,
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("Error creating gift", insertError);
        setError(insertError.message);
        return;
      }

      const newGift = data as Gift;
      setGifts((prev) => [...prev, newGift]);
    },
    [personId]
  );

  const updateGift = useCallback(async (id: string, updates: Partial<Gift>) => {
    const { data, error: updateError } = await supabase
      .from("gifts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Error updating gift", updateError);
      setError(updateError.message);
      return;
    }

    const updated = data as Gift;
    setGifts((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }, []);

  const deleteGift = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from("gifts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting gift", deleteError);
      setError(deleteError.message);
      return;
    }

    setGifts((prev) => prev.filter((g) => g.id !== id));
  }, []);

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
