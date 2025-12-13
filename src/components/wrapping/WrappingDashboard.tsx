import type { WrappingGroup } from "../../hooks/useWrappingDashboard";

interface WrappingDashboardProps {
  groups: WrappingGroup[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void> | void;
  onGiftWrapped?: () => Promise<void> | void;
  selectedListName: string;
  markGiftWrapped: (giftId: string) => Promise<void>;
}

export function WrappingDashboard({
  groups,
  loading,
  error,
  onRefresh,
  onGiftWrapped,
  selectedListName,
  markGiftWrapped,
}: WrappingDashboardProps) {
  const totalGifts = groups.reduce(
    (sum, group) => sum + group.gifts.length,
    0
  );

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Wrapping dashboard – {selectedListName}
          </p>
          <p className="text-[11px] text-slate-500">
            Showing all <span className="font-semibold">purchased</span> gifts
            that are <span className="font-semibold">not wrapped yet</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh && onRefresh()}
          className="text-[11px] px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 mb-2">Error: {error}</p>
      )}

      {loading && (
        <p className="text-sm text-slate-600">Loading wrapping data…</p>
      )}

      {!loading && totalGifts === 0 && (
        <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          All purchased gifts are wrapped. 🎁 You're good to go!
        </p>
      )}

      {!loading && totalGifts > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Total unwrapped purchased gifts:{" "}
            <span className="font-semibold">{totalGifts}</span>
          </p>

          {groups.map((group) => (
            <div
              key={group.personId}
              className="border border-slate-200 rounded-xl bg-white px-4 py-3"
            >
              <p className="text-sm font-semibold mb-1">
                {group.personName}
              </p>
              <ul className="space-y-2">
                {group.gifts.map((gift) => (
                  <li
                    key={gift.id}
                    className="flex items-center justify-between text-sm border border-dashed border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {gift.description}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Price: ${gift.price.toFixed(2)}
                      </p>
                      {gift.notes && (
                        <p className="text-[11px] text-slate-500">
                          Notes: {gift.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-[11px] px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
                      onClick={async () => {
                        await markGiftWrapped(gift.id);
                        if (onGiftWrapped) {
                          await onGiftWrapped();
                        }
                      }}
                    >
                      Mark wrapped
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
