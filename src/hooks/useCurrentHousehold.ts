import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Household, HouseholdMember } from "../types";

type UseCurrentHouseholdResult = {
  loading: boolean;
  error: string | null;
  currentHousehold: Household | null;
  createHousehold: (name: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useCurrentHousehold(userId: string | null): UseCurrentHouseholdResult {
  const [loading, setLoading] = useState(false);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHousehold = async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);

    // 1. Find household_members for this user
    const { data: memberships, error: membershipsError } = await supabase
      .from("household_members")
      .select<HouseholdMember[]>("id, household_id, user_id, role, created_at");

    if (membershipsError) {
      console.error("Error loading household memberships", membershipsError);
      setError(membershipsError.message);
      setLoading(false);
      return;
    }

    if (!memberships || memberships.length === 0) {
      // No household yet
      setCurrentHousehold(null);
      setLoading(false);
      return;
    }

    // For now, just use the first membership
    const first = memberships[0];

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select<Household[]>("id, name, created_by, created_at")
      .eq("id", first.household_id)
      .single();

    setLoading(false);

    if (householdError) {
      console.error("Error loading household", householdError);
      setError(householdError.message);
      return;
    }

    setCurrentHousehold(household);
  };

  const createHousehold = async (name: string) => {
    if (!userId) return;
    setError(null);
    setLoading(true);

    // 1. Create household
    const { data: newHousehold, error: householdError } = await supabase
      .from("households")
      .insert({
        name,
        created_by: userId,
      })
      .select<Household[]>("id, name, created_by, created_at")
      .single();

    if (householdError || !newHousehold) {
      setLoading(false);
      if (householdError) {
        console.error("Error creating household", householdError);
        setError(householdError.message);
      } else {
        setError("Unknown error creating household");
      }
      return;
    }

    // 2. Create membership row for current user as owner
    const { error: memberError } = await supabase.from("household_members").insert({
      household_id: newHousehold.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      console.error("Error creating household member", memberError);
      setError(memberError.message);
      setLoading(false);
      return;
    }

    setCurrentHousehold(newHousehold);
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      loadHousehold();
    } else {
      setCurrentHousehold(null);
    }
  }, [userId]);

  return {
    loading,
    error,
    currentHousehold,
    createHousehold,
    refresh: loadHousehold,
  };
}
