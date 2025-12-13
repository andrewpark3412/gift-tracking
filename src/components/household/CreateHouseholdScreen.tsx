import { useState } from "react";

interface CreateHouseholdScreenProps {
  onCreateHousehold: (name: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  householdError: string | null;
}

export function CreateHouseholdScreen({
  onCreateHousehold,
  onSignOut,
  householdError,
}: CreateHouseholdScreenProps) {
  const [newHouseholdName, setNewHouseholdName] = useState("Park Family");
  const [creatingHouseholdError, setCreatingHouseholdError] =
    useState<string | null>(null);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingHouseholdError(null);
    if (!newHouseholdName.trim()) {
      setCreatingHouseholdError("Household name is required.");
      return;
    }
    await onCreateHousehold(newHouseholdName.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">
          🎄 Christmas Gift Tracker
        </h1>
        <p className="text-sm text-slate-600 text-center">
          Welcome! Let&apos;s create your household so you can share lists
          with your family.
        </p>

        <form onSubmit={handleCreateHousehold} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Household name
            </label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
            />
          </div>

          {creatingHouseholdError && (
            <p className="text-sm text-red-600 text-center">
              {creatingHouseholdError}
            </p>
          )}
          {householdError && (
            <p className="text-sm text-red-600 text-center">
              {householdError}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
          >
            Create Household
          </button>
        </form>

        <button
          type="button"
          onClick={onSignOut}
          className="w-full text-xs text-slate-600 mt-2"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
