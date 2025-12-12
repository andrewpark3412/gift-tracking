import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type WrappingGift = {
  id: string;
  person_id: string;
  description: string;
  price: number;
  notes: string | null;
};

export type WrappingGroup = {
  personId: string;
  personName: string;
  gifts: WrappingGift[];
};

type UseWrappingDashboardResult = {
  groups: WrappingGroup[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markGiftWrapped: (giftId: string) => Promise<void>;
};

export function useWrappingDashboard(
  listId: string | null
): UseWrappingDashboardResult {
  const [groups, setGroups] = useState<WrappingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!listId) {
      setGroups([]);
      return;
    }

    setLoading(true);
    setError(null);

    // 1) Get people for this list
    const { data: peopleData, error: peopleError } = await supabase
      .from("people")
      .select("id, name")
      .eq("list_id", listId);

    if (peopleError) {
      console.error("[Wrapping] Error loading people", peopleError);
      setError(peopleError.message);
      setLoading(false);
      return;
    }

    const people =
      (peopleData ?? []) as { id: string; name: string }[];

    if (people.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const personIds = people.map((p) => p.id);
    const peopleById = new Map<string, { id: string; name: string }>();
    people.forEach((p) => peopleById.set(p.id, p));

    // 2) Get all purchased-but-not-wrapped gifts for those people
    const { data: giftsData, error: giftsError } = await supabase
      .from("gifts")
      .select("id, person_id, description, price, notes, status, is_wrapped")
      .in("person_id", personIds)
      .eq("status", "purchased")
      .eq("is_wrapped", false);

    if (giftsError) {
      console.error("[Wrapping] Error loading gifts", giftsError);
      setError(giftsError.message);
      setLoading(false);
      return;
    }

    const gifts = (giftsData ?? []) as {
      id: string;
      person_id: string;
      description: string;
      price: number;
      notes: string | null;
      status: string;
      is_wrapped: boolean;
    }[];

    const groupsMap = new Map<string, WrappingGroup>();

    gifts.forEach((g) => {
      const person = peopleById.get(g.person_id);
      if (!person) return;

      if (!groupsMap.has(g.person_id)) {
        groupsMap.set(g.person_id, {
          personId: person.id,
          personName: person.name,
          gifts: [],
        });
      }

      const group = groupsMap.get(g.person_id)!;
      group.gifts.push({
        id: g.id,
        person_id: g.person_id,
        description: g.description,
        price: Number(g.price) || 0,
        notes: g.notes,
      });
    });

    const result = Array.from(groupsMap.values()).sort((a, b) =>
      a.personName.localeCompare(b.personName)
    );

    setGroups(result);
    setLoading(false);
  }, [listId]);

  useEffect(() => {
    load();
  }, [load]);

  const markGiftWrapped = useCallback(async (giftId: string) => {
    const { error: updateError } = await supabase
      .from("gifts")
      .update({ is_wrapped: true })
      .eq("id", giftId);

    if (updateError) {
      console.error("[Wrapping] Error marking gift wrapped", updateError);
      setError(updateError.message);
      return;
    }

    // Optimistically remove that gift from local state
    setGroups((prev) => {
      const updated: WrappingGroup[] = [];
      for (const group of prev) {
        const remainingGifts = group.gifts.filter(
          (g) => g.id !== giftId
        );
        if (remainingGifts.length > 0) {
          updated.push({
            ...group,
            gifts: remainingGifts,
          });
        }
      }
      return updated;
    });
  }, []);

  return { groups, loading, error, refresh: load, markGiftWrapped };
}
