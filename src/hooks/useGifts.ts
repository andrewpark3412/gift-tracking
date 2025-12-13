import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { offlineInsert, offlineUpdate, offlineDelete } from "../lib/offlineSupabase";
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

      const giftData = {
        person_id: personId,
        description: params.description,
        price: params.price,
        status: params.status,
        is_wrapped: params.isWrapped ?? false,
        notes: params.notes ?? null,
      };

      const { data, error: insertError } = await offlineInsert<Gift>("gifts", giftData);

      if (insertError) {
        console.error("Error creating gift", insertError);
        setError(insertError.message);
        return;
      }

      if (data) {
        setGifts((prev) => [...prev, data]);
      }
    },
    [personId]
  );

  const updateGift = useCallback(async (id: string, updates: Partial<Gift>) => {
    // Optimistically update UI first
    setGifts((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));

    const { error: updateError } = await offlineUpdate<Gift>("gifts", id, updates);

    if (updateError) {
      console.error("Error updating gift", updateError);
      setError(updateError.message);
      // Revert optimistic update on error if online
      if (navigator.onLine) {
        loadGifts();
      }
      return;
    }
  }, [loadGifts]);

  const deleteGift = useCallback(async (id: string) => {
    // Optimistically remove from UI
    setGifts((prev) => prev.filter((g) => g.id !== id));

    const { error: deleteError } = await offlineDelete("gifts", id);

    if (deleteError) {
      console.error("Error deleting gift", deleteError);
      setError(deleteError.message);
      // Revert optimistic delete on error if online
      if (navigator.onLine) {
        loadGifts();
      }
      return;
    }
  }, [loadGifts]);

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
