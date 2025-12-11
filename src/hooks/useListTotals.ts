import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { GiftStatus } from "../types";

type ListTotals = {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number | null; // null if no budgets set at all
  peopleCount: number;
  overBudgetPeopleCount: number;
};

type UseListTotalsResult = {
  totals: ListTotals | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type PersonLite = {
  id: string;
  budget: number | null;
};

type GiftLite = {
  person_id: string;
  price: number;
  status: GiftStatus;
};

export function useListTotals(listId: string | null): UseListTotalsResult {
  const [totals, setTotals] = useState<ListTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTotals = async () => {
    if (!listId) {
      setTotals(null);
      return;
    }

    setLoading(true);
    setError(null);

    // 1) Load people for this list (id + budget)
    const { data: people, error: peopleError } = await supabase
      .from("people")
      .select<PersonLite[]>("id, budget")
      .eq("list_id", listId);

    if (peopleError) {
      console.error("Error loading people for totals", peopleError);
      setError(peopleError.message);
      setLoading(false);
      return;
    }

    const personIds = (people ?? []).map((p) => p.id);
    const peopleById = new Map<string, PersonLite>();
    (people ?? []).forEach((p) => peopleById.set(p.id, p));

    // If no people, totals are just zeros
    if (personIds.length === 0) {
      setTotals({
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: null,
        peopleCount: 0,
        overBudgetPeopleCount: 0,
      });
      setLoading(false);
      return;
    }

    // 2) Load gifts for these people
    const { data: gifts, error: giftsError } = await supabase
      .from("gifts")
      .select<GiftLite[]>("person_id, price, status")
      .in("person_id", personIds);

    if (giftsError) {
      console.error("Error loading gifts for totals", giftsError);
      setError(giftsError.message);
      setLoading(false);
      return;
    }

    // 3) Compute totals in JS
    let totalBudget = 0;
    let anyBudgetSet = false;

    const spentByPerson = new Map<string, number>();

    (people ?? []).forEach((p) => {
      if (p.budget != null) {
        anyBudgetSet = true;
        totalBudget += Number(p.budget) || 0;
      }
      spentByPerson.set(p.id, 0);
    });

    (gifts ?? []).forEach((g) => {
      if (g.status === "purchased") {
        const current = spentByPerson.get(g.person_id) ?? 0;
        spentByPerson.set(
          g.person_id,
          current + (Number(g.price) || 0)
        );
      }
    });

    let totalSpent = 0;
    let overBudgetPeopleCount = 0;

    spentByPerson.forEach((spent, personId) => {
      totalSpent += spent;
      const person = peopleById.get(personId);
      if (person && person.budget != null && spent > person.budget) {
        overBudgetPeopleCount += 1;
      }
    });

    const remainingBudget =
      anyBudgetSet ? totalBudget - totalSpent : null;

    setTotals({
      totalBudget,
      totalSpent,
      remainingBudget,
      peopleCount: people?.length ?? 0,
      overBudgetPeopleCount,
    });

    setLoading(false);
  };

  useEffect(() => {
    loadTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  return {
    totals,
    loading,
    error,
    refresh: loadTotals,
  };
}
