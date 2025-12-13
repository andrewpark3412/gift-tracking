import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export function AuthScreen() {
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  const upsertProfile = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id || !user.email) return;

    await supabase.from("profiles").upsert({
      user_id: user.id,
      email: user.email,
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      console.error("Sign in error", error);
      setAuthError(error.message);
      return;
    }

    console.log("Signed in as", data.user?.id);
    await upsertProfile();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const inviteToken = new URLSearchParams(window.location.search).get("invite");

    const redirectTo =
      inviteToken
        ? `${window.location.origin}?invite=${encodeURIComponent(inviteToken)}`
        : window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Sign up error", error);
      setAuthError(error.message);
      return;
    }

    console.log("Sign up data", data);
    await upsertProfile();
    if (!data.session) {
      setAuthError(
        "Check your email to confirm your account, then return to this page to finish joining the household."
      );
      return;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">
          🎄 Christmas Gift Tracker
        </h1>
        <p className="text-sm text-slate-600 text-center">
          Sign in or create an account.
        </p>

        <form
          onSubmit={creatingAccount ? handleSignUp : handleSignIn}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {authError && (
            <p className="text-sm text-red-600 text-center">{authError}</p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
          >
            {creatingAccount ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          className="w-full text-xs text-slate-600 mt-2"
          onClick={() => setCreatingAccount((prev) => !prev)}
        >
          {creatingAccount
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
