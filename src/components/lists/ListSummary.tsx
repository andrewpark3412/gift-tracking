import type { ListTotals } from "../../hooks/useListTotals";

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
          ⚠️ {totals.overBudgetPeopleCount}{" "}
          {totals.overBudgetPeopleCount === 1 ? "person is" : "people are"} over budget
        </p>
      )}
    </div>
  );
}
