import { useState } from "react";
import type { GiftStatus } from "../../types";

interface AddGiftFormProps {
  onAdd: (params: {
    description: string;
    price: number;
    status: GiftStatus;
    isWrapped?: boolean;
    notes?: string | null;
  }) => Promise<void>;
}

export function AddGiftForm({ onAdd }: AddGiftFormProps) {
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [status, setStatus] = useState<GiftStatus>("idea");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    const price = Number(priceInput || "0");
    if (Number.isNaN(price) || price < 0) {
      setError("Price must be a non-negative number.");
      return;
    }

    await onAdd({
      description: description.trim(),
      price,
      status,
      isWrapped: false,
      notes: notes.trim() || null,
    });

    setDescription("");
    setPriceInput("");
    setStatus("idea");
    setNotes("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 mb-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium mb-1">
            Gift description
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="LEGO set, book, sweater..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="e.g. 29.99"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as GiftStatus)}
          >
            <option value="idea">Idea</option>
            <option value="purchased">Purchased</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Store, link, size, color..."
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
          >
            Save gift
          </button>
        </div>
      </div>
    </form>
  );
}
