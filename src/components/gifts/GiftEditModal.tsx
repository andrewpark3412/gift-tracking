import React from "react";
import type { Gift, GiftStatus } from "../../types";

interface GiftEditModalProps {
  isOpen: boolean;
  gift: Gift | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Gift>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function GiftEditModal({ isOpen, gift, onClose, onUpdate, onDelete }: GiftEditModalProps) {
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [status, setStatus] = React.useState<GiftStatus>("idea");
  const [isWrapped, setIsWrapped] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (gift) {
      setDescription(gift.description);
      setPrice(String(gift.price ?? 0));
      setStatus(gift.status);
      setIsWrapped(Boolean(gift.is_wrapped));
      setNotes(gift.notes || "");
    } else {
      setDescription("");
      setPrice("");
      setStatus("idea");
      setIsWrapped(false);
      setNotes("");
    }
  }, [gift]);

  if (!isOpen || !gift) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const priceNum = parseFloat(price);
      await onUpdate(gift.id, {
        description: description.trim(),
        price: isNaN(priceNum) ? 0 : priceNum,
        status,
        is_wrapped: isWrapped,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error("Error saving gift", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!gift) return;
    if (!window.confirm("Delete this gift?")) return;
    setSaving(true);
    try {
      await onDelete(gift.id);
      onClose();
    } catch (err) {
      console.error("Error deleting gift", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Gift</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✖
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                step="0.01"
                className="w-full border rounded-md px-3 py-2"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as GiftStatus)}
              >
                <option value="idea">Idea</option>
                <option value="purchased">Purchased</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={isWrapped} onChange={(e) => setIsWrapped(e.target.checked)} />
              <span className="text-sm">Wrapped</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="w-full border rounded-md px-3 py-2" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleDelete} disabled={saving} className="px-4 py-2 rounded-lg border border-red-500 text-red-600 hover:bg-red-50 cursor-pointer">
              Delete
            </button>
            <div className="flex-1" />
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 rounded-lg border cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-emerald-600 text-white cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
