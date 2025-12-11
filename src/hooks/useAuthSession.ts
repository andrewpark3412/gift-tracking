import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useAuthSession() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session", error);
      }
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
      setSessionChecked(true);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, sessionChecked };
}
