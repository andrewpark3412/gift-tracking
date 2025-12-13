import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { HouseholdInvite } from "../types";

export function useHouseholdInvites(householdId: string | null) {
  const [invites, setInvites] = useState<HouseholdInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!householdId) {
      setInvites([]);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("household_invites")
      .select("*")
      .eq("household_id", householdId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setInvites((data ?? []) as HouseholdInvite[]);
    setLoading(false);
  }, [householdId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createInvite = useCallback(
    async (email: string) => {
        if (!householdId) throw new Error("No household selected");
        setError(null);

        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) throw new Error("Not authenticated");

        const { data, error } = await supabase
        .from("household_invites")
        .insert({
            household_id: householdId,
            invited_email: email.trim(),
            invited_by: userId,
        })
        .select("*")
        .single();

        if (error) throw error;

        const newInvite = data as HouseholdInvite;
        setInvites((prev) => [newInvite, ...prev]);
        return newInvite;
    },
    [householdId]
    );

  const revokeInvite = useCallback(async (inviteId: string) => {
    setError(null);
    const { data, error } = await supabase
      .from("household_invites")
      .update({ status: "revoked" })
      .eq("id", inviteId)
      .select("*")
      .single();

    if (error) throw error;

    const updated = data as HouseholdInvite;
    setInvites((prev) => prev.map((i) => (i.id === inviteId ? updated : i)));
  }, []);

  return { invites, loading, error, refresh, createInvite, revokeInvite };
}
