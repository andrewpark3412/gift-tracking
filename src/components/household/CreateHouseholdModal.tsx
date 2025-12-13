import { useState } from "react";

interface CreateHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHousehold: (name: string) => Promise<void>;
  error: string | null;
}

export function CreateHouseholdModal({
  isOpen,
  onClose,
  onCreateHousehold,
  error,
}: CreateHouseholdModalProps) {
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!newHouseholdName.trim()) {
      setLocalError("Household name is required.");
      return;
    }

    setCreating(true);
    try {
      await onCreateHousehold(newHouseholdName.trim());
      setNewHouseholdName("");
      onClose();
    } catch (err) {
      console.error("Error creating household:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setNewHouseholdName("");
      setLocalError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-800 border border-slate-600/30 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-50">
            Create New Household
          </h2>
          <button
            onClick={handleClose}
            disabled={creating}
            className="text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Household Name
            </label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="e.g., Smith Family"
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
              disabled={creating}
              autoFocus
            />
          </div>

          {(localError || error) && (
            <p className="text-sm text-red-400">
              {localError || error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
