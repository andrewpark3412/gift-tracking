import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type HouseholdMemberRow = {
  user_id: string;
  email: string | null;
  created_at: string | null;
};

export function useHouseholdMembers(householdId: string | null) {
  const [members, setMembers] = useState<HouseholdMemberRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setMembers([]);
      return;
    }

    setLoading(true);
    setError(null);

    // Select from household_members, and pull profile email via FK join
    const { data, error } = await supabase
      .from("household_members")
      .select("user_id, created_at, profiles(email)")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Members] load error", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as any[];

    setMembers(
      rows.map((r) => ({
        user_id: r.user_id,
        created_at: r.created_at ?? null,
        email: r.profiles?.email ?? null,
      }))
    );

    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeMember = useCallback(
    async (userId: string) => {
      if (!householdId) throw new Error("No household selected");

      const { error } = await supabase
        .from("household_members")
        .delete()
        .eq("household_id", householdId)
        .eq("user_id", userId);

      if (error) throw error;

      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    },
    [householdId]
  );

  const leaveHousehold = useCallback(async () => {
    if (!householdId) throw new Error("No household selected");
    const { data } = await supabase.auth.getUser();
    const me = data.user?.id;
    if (!me) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("household_members")
      .delete()
      .eq("household_id", householdId)
      .eq("user_id", me);

    if (error) throw error;
  }, [householdId]);

  return { members, loading, error, refresh, removeMember, leaveHousehold };
}
