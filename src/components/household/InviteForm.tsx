import { useState } from "react";

interface InviteFormProps {
  onCreate: (email: string) => Promise<void>;
}

export function InviteForm({ onCreate }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      await onCreate(trimmed);
      setEmail("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create invite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-2 items-start md:items-end">
      <div className="flex-1 w-full">
        <label className="block text-xs font-medium mb-1">Invite by email</label>
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="spouse@example.com"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create invite (copy link)"}
      </button>
    </form>
  );
}
