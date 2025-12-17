import { useState } from "react";

interface AddPersonFormProps {
  onAdd: (params: { name: string; budget?: number | null }) => Promise<void>;
}

export function AddPersonForm({ onAdd }: AddPersonFormProps) {
  const [name, setName] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    let budget: number | null = null;
    if (budgetInput.trim() !== "") {
      const parsed = Number(budgetInput);
      if (Number.isNaN(parsed) || parsed < 0) {
        setError("Budget must be a non-negative number.");
        return;
      }
      budget = parsed;
    }

    await onAdd({ name: name.trim(), budget });

    setName("");
    setBudgetInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end"
    >
      <div>
        <label className="block text-xs font-medium mb-1">Person name</label>
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mom, Dad, Wife, Kids..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          Budget (optional)
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>
      <div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700 cursor-pointer"
        >
          Add Person
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </form>
  );
}
