import type { ListTotals, PersonBudgetSummary } from "../../hooks/useListTotals";

interface ListSummaryProps {
  listName: string;
  totals: ListTotals | null;
  loading: boolean;
  error: string | null;
}

export function ListSummary({ listName, totals, loading, error }: ListSummaryProps) {
  if (loading) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <p>Calculating list totals…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!totals) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <p className="font-medium mb-1">List summary for {listName}</p>
      <p>People: {totals.peopleCount}</p>
      <p>Total spent: ${totals.totalSpent.toFixed(2)}</p>
      
      {totals.remainingBudget !== null ? (
        <p>
          Total budget: ${totals.totalBudget.toFixed(2)} • Remaining:{" "}
          <span className={totals.remainingBudget < 0 ? "text-red-600 font-semibold" : "font-semibold"}>
            ${totals.remainingBudget.toFixed(2)}
          </span>
        </p>
      ) : (
        <p>No budgets set yet for this list.</p>
      )}

      {totals.overBudgetPeopleCount > 0 && (
        <p className="text-red-600">
          Over budget: {totals.overBudgetPeopleCount}{" "}
          {totals.overBudgetPeopleCount === 1 ? "person" : "people"}
        </p>
      )}

      {totals.perPerson && totals.perPerson.length > 0 && (
        <>
          <div className="mt-2 h-px bg-slate-200/70" />
          <p className="mt-2 mb-1 text-[11px] font-semibold text-slate-600">
            Per-person budgets
          </p>
          <ul className="space-y-1.5">
            {totals.perPerson
              .filter((p: PersonBudgetSummary) => p.budget !== null || p.spent > 0)
              .map((p: PersonBudgetSummary) => {
                const budget = p.budget ?? 0;
                const spent = p.spent;
                const percentUsed =
                  budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : null;

                return (
                  <li key={p.personId}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-medium text-slate-700">{p.name}</span>
                      <span className="text-slate-500">
                        {budget > 0 ? (
                          <>
                            ${spent.toFixed(2)} / ${budget.toFixed(2)}{" "}
                            {percentUsed !== null && (
                              <span className="ml-1 text-[10px] text-slate-500">
                                ({percentUsed}%)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="italic text-slate-400">
                            ${spent.toFixed(2)} (no budget)
                          </span>
                        )}
                      </span>
                    </div>
                    {budget > 0 && (
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.overBudget ? "bg-red-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${percentUsed ?? 0}%` }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </div>
  );
}
