import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface AcceptInviteScreenProps {
  token: string;
  onDone: () => void;
}

export function AcceptInviteScreen({ token, onDone }: AcceptInviteScreenProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  const accept = async () => {
    setStatus("loading");
    setMessage("");

    const { error } = await supabase.rpc("accept_household_invite", {
      p_token: token,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Invite accepted! Redirecting…");
    setTimeout(() => onDone(), 800);
  };

  useEffect(() => {
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white shadow-md rounded-2xl p-6 max-w-md w-full">
        <h1 className="text-lg font-semibold mb-2">Household Invite</h1>
        {status === "loading" && (
          <p className="text-sm text-slate-600">Accepting invite…</p>
        )}
        {status === "success" && (
          <p className="text-sm text-emerald-700">{message}</p>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-red-600 mb-3">Error: {message}</p>
            <button
              className="text-sm px-3 py-2 rounded-md bg-slate-900 text-white"
              onClick={() => onDone()}
            >
              Go back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
