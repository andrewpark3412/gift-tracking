import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Household } from "../types";

const ACTIVE_HOUSEHOLD_KEY = "active_household_id";

type HouseholdMembership = {
  household: Household;
  role: "owner" | "admin" | "member";
};

type UseHouseholdsResult = {
  households: HouseholdMembership[];
  activeHouseholdId: string | null;
  loading: boolean;
  error: string | null;
  setActiveHousehold: (householdId: string) => void;
  refresh: () => Promise<void>;
};

export function useHouseholds(userId: string | null): UseHouseholdsResult {
  const [households, setHouseholds] = useState<HouseholdMembership[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<string | null>(null);

  const loadHouseholds = useCallback(async () => {
    if (!userId) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch all household memberships for this user with household details
    const { data: membershipRows, error: membershipError } = await supabase
      .from("household_members")
      .select("household_id, role, households(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (membershipError) {
      console.error("[useHouseholds] Error loading memberships", membershipError);
      setError(membershipError.message);
      setLoading(false);
      return;
    }

    if (!membershipRows || membershipRows.length === 0) {
      setHouseholds([]);
      setActiveHouseholdId(null);
      localStorage.removeItem(ACTIVE_HOUSEHOLD_KEY);
      setLoading(false);
      return;
    }

    // Transform the data
    const memberships: HouseholdMembership[] = membershipRows
      .filter((row: any) => row.households) // Ensure household data exists
      .map((row: any) => ({
        household: row.households as Household,
        role: row.role as "owner" | "admin" | "member",
      }));

    setHouseholds(memberships);

    // Determine active household
    const storedActiveId = localStorage.getItem(ACTIVE_HOUSEHOLD_KEY);
    
    // Check if stored ID is still valid
    const isStoredIdValid = memberships.some(
      (m) => m.household.id === storedActiveId
    );

    if (isStoredIdValid) {
      setActiveHouseholdId(storedActiveId);
    } else {
      // Default to first household if stored ID is invalid or missing
      const firstHouseholdId = memberships[0]?.household.id || null;
      setActiveHouseholdId(firstHouseholdId);
      if (firstHouseholdId) {
        localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, firstHouseholdId);
      }
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  const setActiveHousehold = useCallback((householdId: string) => {
    setActiveHouseholdId(householdId);
    localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, householdId);
  }, []);

  const refresh = useCallback(async () => {
    await loadHouseholds();
  }, [loadHouseholds]);

  return {
    households,
    activeHouseholdId,
    loading,
    error,
    setActiveHousehold,
    refresh,
  };
}
