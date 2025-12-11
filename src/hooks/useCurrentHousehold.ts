import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Household } from "../types";

type UseCurrentHouseholdResult = {
  currentHousehold: Household | null;
  loading: boolean;
  error: string | null;
  createHousehold: (name: string) => Promise<void>;
};

export function useCurrentHousehold(
  userId: string | null
): UseCurrentHouseholdResult {
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);

  const loadHousehold = useCallback(async () => {
    if (!userId) {
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1) Find household membership for this user
    const { data: membershipRows, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipError) {
      console.error("Error loading household membership", membershipError);
      setError(membershipError.message);
      setLoading(false);
      return;
    }

    if (!membershipRows?.household_id) {
      // no household yet
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    const householdId = membershipRows.household_id as string;

    // 2) Load that household
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
  }, [userId]);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  const createHousehold = useCallback(
    async (name: string) => {
      if (!userId) {
        setError("No user ID available.");
        return;
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
        return;
      }

      const household = createdHousehold as Household;

      // 2) Add membership row for this user
      const { error: memberError } = await supabase
        .from("household_members")
        .insert({
          household_id: household.id,
          user_id: userId,
        });

      if (memberError) {
        console.error("Error creating household membership", memberError);
        setError(memberError.message);
        setLoading(false);
        return;
      }

      setCurrentHousehold(household);
      setLoading(false);
    },
    [userId]
  );

  return { currentHousehold, loading, error, createHousehold };
}
