import type { Gift } from "../../types";

interface GiftRowProps {
  gift: Gift;
  onToggleStatus: () => Promise<void>;
  onToggleWrapped: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function GiftRow({ gift, onToggleStatus, onToggleWrapped, onDelete }: GiftRowProps) {
  const purchased = gift.status === "purchased";

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
          className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100 whitespace-nowrap"
          onClick={onToggleStatus}
        >
          {purchased ? "→ Idea" : "→ Purchased"}
        </button>
        {purchased && (
          <button
            type="button"
            className={`text-[11px] px-2 py-1 border rounded-full whitespace-nowrap ${
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
          className="text-[11px] px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50 whitespace-nowrap"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
