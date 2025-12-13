import { useState } from "react";
import type { Gift, GiftStatus } from "../../types";

interface GiftRowProps {
  gift: Gift;
  onToggleStatus: () => Promise<void>;
  onToggleWrapped: () => Promise<void>;
  onUpdate: (updates: { description: string; price: number; status: GiftStatus; notes: string | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function GiftRow({ gift, onToggleStatus, onToggleWrapped, onUpdate, onDelete }: GiftRowProps) {
  const purchased = gift.status === "purchased";
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(gift.description);
  const [editPrice, setEditPrice] = useState(gift.price.toString());
  const [editStatus, setEditStatus] = useState<GiftStatus>(gift.status);
  const [editNotes, setEditNotes] = useState(gift.notes || "");

  if (isEditing) {
    return (
      <li
        className={`border rounded-xl px-4 py-3 ${
          purchased
            ? "bg-emerald-50 border-emerald-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as GiftStatus)}
              >
                <option value="idea">Idea</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notes (optional)</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm"
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Add any notes..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
              onClick={async () => {
                if (!editDescription.trim()) return;
                const price = parseFloat(editPrice);
                if (isNaN(price) || price < 0) return;
                await onUpdate({
                  description: editDescription.trim(),
                  price,
                  status: editStatus,
                  notes: editNotes.trim() || null,
                });
                setIsEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-100 cursor-pointer"
              onClick={() => {
                setEditDescription(gift.description);
                setEditPrice(gift.price.toString());
                setEditStatus(gift.status);
                setEditNotes(gift.notes || "");
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`border rounded-xl px-4 py-3 flex items-start justify-between ${
        purchased
          ? "bg-emerald-50 border-emerald-200"
          : "bg-slate-50 border-slate-200"
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p
            className={`font-medium ${
              purchased ? "text-emerald-900" : "text-slate-700"
            }`}
          >
            {gift.description}
          </p>
          {purchased && gift.is_wrapped && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
              🎁 Wrapped
            </span>
          )}
        </div>

        <p className="text-xs text-slate-600 mb-1">
          <span className="font-medium">${Number(gift.price).toFixed(2)}</span>{" "}
          •{" "}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
              purchased
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {purchased ? "✓ Purchased" : "💡 Idea"}
          </span>
        </p>

        {gift.notes && (
          <p className="text-[11px] text-slate-500 italic mt-1">
            {gift.notes}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1 ml-4">
        <button
          type="button"
          className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100 whitespace-nowrap cursor-pointer"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100 whitespace-nowrap cursor-pointer"
          onClick={onToggleStatus}
        >
          {purchased ? "→ Idea" : "→ Purchased"}
        </button>
        {purchased && (
          <button
            type="button"
            className={`text-[11px] px-2 py-1 border rounded-full whitespace-nowrap cursor-pointer ${
              gift.is_wrapped
                ? "border-slate-300 bg-slate-100 hover:bg-slate-200"
                : "border-emerald-500 text-emerald-700 hover:bg-emerald-50"
            }`}
            onClick={onToggleWrapped}
          >
            {gift.is_wrapped ? "Unwrap" : "Mark wrapped"}
          </button>
        )}
        <button
          type="button"
          className="text-[11px] px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50 whitespace-nowrap cursor-pointer"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
