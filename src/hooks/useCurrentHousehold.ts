import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Household } from "../types";

type UseCurrentHouseholdResult = {
  currentHousehold: Household | null;
  loading: boolean;
  error: string | null;
  createHousehold: (name: string, userId: string) => Promise<Household | null>;
  refresh: () => Promise<void>;
};

export function useCurrentHousehold(
  householdId: string | null
): UseCurrentHouseholdResult {
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(!!householdId);
  const [error, setError] = useState<string | null>(null);

  const loadHousehold = useCallback(async () => {
    if (!householdId) {
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Load the specific household by ID
    const { data: householdRow, error: householdError } = await supabase
      .from("households")
      .select("*")
      .eq("id", householdId)
      .maybeSingle();

    if (householdError) {
      console.error("Error loading household", householdError);
      setError(householdError.message);
      setLoading(false);
      return;
    }

    setCurrentHousehold((householdRow ?? null) as Household | null);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  const createHousehold = useCallback(
    async (name: string, userId: string): Promise<Household | null> => {
      if (!userId) {
        setError("No user ID available.");
        return null;
      }

      setLoading(true);
      setError(null);

      // 1) Create household
      const { data: createdHousehold, error: createError } = await supabase
        .from("households")
        .insert({
          name,
          created_by: userId,
        })
        .select("*")
        .single();

      if (createError) {
        console.error("Error creating household", createError);
        setError(createError.message);
        setLoading(false);
        return null;
      }

      const household = createdHousehold as Household;

      // 2) Add membership row for this user as owner
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({
          household_id: household.id,
          user_id: userId,
          role: "owner",
        });

      if (memberError) {
        console.error("Error creating household membership", memberError);
        setError(memberError.message);
        setLoading(false);
        return null;
      }

      setCurrentHousehold(household);
      setLoading(false);
      return household;
    },
    []
  );

  const refresh = useCallback(async () => {
    await loadHousehold();
  }, [loadHousehold]);

  return { currentHousehold, loading, error, createHousehold, refresh };
}
