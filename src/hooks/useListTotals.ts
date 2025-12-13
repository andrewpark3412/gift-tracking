import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import type { GiftStatus } from "../types";

export type PersonBudgetSummary = {
  personId: string;
  name: string;
  budget: number | null;
  spent: number;
  remaining: number | null;
  overBudget: boolean;
};

export type ListTotals = {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number | null;
  peopleCount: number;
  overBudgetPeopleCount: number;
  perPerson: PersonBudgetSummary[];
};

type UseListTotalsResult = {
  totals: ListTotals | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

type PersonLite = {
  id: string;
  name: string;
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

  const loadTotals = useCallback(async () => {
    if (!listId) {
      setTotals(null);
      return;
    }

    setLoading(true);
    setError(null);

    // 1) Load people for this list (id, name, budget)
    const { data: peopleData, error: peopleError } = await supabase
      .from("people")
      .select("id, name, budget")
      .eq("list_id", listId);

    if (peopleError) {
      console.error("Error loading people for totals", peopleError);
      setError(peopleError.message);
      setLoading(false);
      return;
    }

    const people = (peopleData ?? []) as PersonLite[];
    const personIds = people.map((p) => p.id);
    const peopleById = new Map<string, PersonLite>();
    people.forEach((p) => peopleById.set(p.id, p));

    if (personIds.length === 0) {
      setTotals({
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: null,
        peopleCount: 0,
        overBudgetPeopleCount: 0,
        perPerson: [],
      });
      setLoading(false);
      return;
    }

    // 2) Load gifts for these people
    const { data: giftsData, error: giftsError } = await supabase
      .from("gifts")
      .select("person_id, price, status")
      .in("person_id", personIds);

    if (giftsError) {
      console.error("Error loading gifts for totals", giftsError);
      setError(giftsError.message);
      setLoading(false);
      return;
    }

    const gifts = (giftsData ?? []) as GiftLite[];

    // 3) Compute totals
    let totalBudget = 0;
    let anyBudgetSet = false;
    const spentByPerson = new Map<string, number>();

    people.forEach((p) => {
      if (p.budget != null) {
        anyBudgetSet = true;
        totalBudget += Number(p.budget) || 0;
      }
      spentByPerson.set(p.id, 0);
    });

    gifts.forEach((g) => {
      if (g.status === "purchased") {
        const current = spentByPerson.get(g.person_id) ?? 0;
        spentByPerson.set(g.person_id, current + (Number(g.price) || 0));
      }
    });

    let totalSpent = 0;
    let overBudgetPeopleCount = 0;

    const perPerson: PersonBudgetSummary[] = [];

    spentByPerson.forEach((spent, personId) => {
      totalSpent += spent;
      const person = peopleById.get(personId);
      if (!person) return;

      const budget = person.budget != null ? Number(person.budget) || 0 : null;
      const remaining =
        budget != null ? Number((budget - spent).toFixed(2)) : null;
      const overBudget = budget != null && spent > budget;

      if (overBudget) {
        overBudgetPeopleCount += 1;
      }

      perPerson.push({
        personId,
        name: person.name,
        budget: budget,
        spent: Number(spent.toFixed(2)),
        remaining,
        overBudget,
      });
    });

    // Sort per-person summaries by name
    perPerson.sort((a, b) => a.name.localeCompare(b.name));

    const remainingBudget = anyBudgetSet ? totalBudget - totalSpent : null;

    setTotals({
      totalBudget,
      totalSpent,
      remainingBudget:
        remainingBudget !== null
          ? Number(remainingBudget.toFixed(2))
          : null,
      peopleCount: people.length,
      overBudgetPeopleCount,
      perPerson,
    });

    setLoading(false);
  }, [listId]);

  useEffect(() => {
    loadTotals();
  }, [loadTotals]);

  return { totals, loading, error, refresh: loadTotals };
}
