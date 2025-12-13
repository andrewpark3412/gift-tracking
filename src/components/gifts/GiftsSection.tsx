import { useGifts } from "../../hooks/useGifts";
import { AddGiftForm } from "./AddGiftForm";
import { GiftRow } from "./GiftRow";
import { MobileBackButton } from "../common/MobileBackButton";
import type { Person } from "../../types";

interface GiftsSectionProps {
  person: Person;
  onTotalsChanged?: () => Promise<void> | void;
  onBack?: () => void;
}

export function GiftsSection({ person, onTotalsChanged, onBack }: GiftsSectionProps) {
  const {
    gifts,
    loading,
    error,
    refresh,
    createGift,
    updateGift,
    deleteGift,
  } = useGifts(person.id);

  // Totals: only purchased gifts count as "spent"
  const totals = gifts.reduce(
    (acc, gift) => {
      const price = Number(gift.price) || 0;
      if (gift.status === "purchased") {
        acc.totalSpent += price;
        acc.purchasedCount += 1;
      } else {
        acc.ideaCount += 1;
      }
      if (!gift.is_wrapped && gift.status === "purchased") {
        acc.unwrappedPurchasedCount += 1;
      }
      return acc;
    },
    {
      totalSpent: 0,
      ideaCount: 0,
      purchasedCount: 0,
      unwrappedPurchasedCount: 0,
    }
  );

  const remainingBudget =
    person.budget != null ? person.budget - totals.totalSpent : null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      {onBack && <MobileBackButton onClick={onBack} label="Back to People" />}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">Gifts – {person.name}</h2>
          <p className="text-xs text-slate-500">
            Budget:{" "}
            {person.budget != null
              ? `$${person.budget.toFixed(2)}`
              : "No budget set"}
          </p>
          <p className="text-xs text-slate-500">
            Spent: ${totals.totalSpent.toFixed(2)}{" "}
            {remainingBudget != null && (
              <>
                • Remaining:{" "}
                <span
                  className={
                    remainingBudget < 0
                      ? "text-red-600 font-semibold"
                      : "font-semibold"
                  }
                >
                  ${remainingBudget.toFixed(2)}
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-slate-500">
            Idea gifts: {totals.ideaCount} • Purchased:{" "}
            {totals.purchasedCount} • Purchased but not wrapped:{" "}
            {totals.unwrappedPurchasedCount}
          </p>
        </div>
        <button
          onClick={async () => {
            await refresh();
            if (onTotalsChanged) await onTotalsChanged();
          }}
          className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-slate-100 cursor-pointer"
          title="Refresh"
          aria-label="Refresh gifts"
        >
          <span className="text-base">🔄</span>
        </button>
      </div>

      <AddGiftForm
        onAdd={async (params) => {
          await createGift(params);
          if (onTotalsChanged) await onTotalsChanged();
        }}
      />

      {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}

      {loading && <p className="text-sm text-slate-600">Loading gifts…</p>}

      {!loading && gifts.length === 0 && (
        <p className="text-sm text-slate-600">
          No gifts yet. Add ideas and mark them purchased as you go.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {gifts.map((gift) => (
          <GiftRow
            key={gift.id}
            gift={gift}
            onToggleStatus={async () => {
              await updateGift(gift.id, {
                status: gift.status === "idea" ? "purchased" : "idea",
              });
              if (onTotalsChanged) await onTotalsChanged();
            }}
            onToggleWrapped={async () => {
              await updateGift(gift.id, { is_wrapped: !gift.is_wrapped });
              if (onTotalsChanged) await onTotalsChanged();
            }}
            onUpdate={async (updates) => {
              await updateGift(gift.id, updates);
              if (onTotalsChanged) await onTotalsChanged();
            }}
            onDelete={async () => {
              await deleteGift(gift.id);
              if (onTotalsChanged) await onTotalsChanged();
            }}
          />
        ))}
      </ul>
    </section>
  );
}
