import type { Person } from "../../types";

interface PersonRowProps {
  person: Person;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCompleted: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function PersonRow({
  person,
  isSelected,
  onSelect,
  onToggleCompleted,
  onDelete,
}: PersonRowProps) {
  const completed = person.is_manually_completed;

  return (
    <li
      className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
        isSelected
          ? "bg-emerald-50 border-emerald-300"
          : "bg-white hover:bg-slate-50 border-slate-200"
      } ${completed ? "border-l-4 border-l-emerald-500" : ""}`}
    >
      <div>
        <p className="font-medium flex items-center gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="underline-offset-2 hover:underline"
          >
            {person.name}
          </button>
          {completed && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              <span>✅</span>
              <span>Completed</span>
            </span>
          )}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Budget:{" "}
          {person.budget != null ? (
            <span className="font-medium">
              ${person.budget.toFixed(2)}
            </span>
          ) : (
            <span className="italic text-slate-400">No budget set</span>
          )}
        </p>
        <p className="text-[11px] text-slate-400 italic mt-0.5">
          Tap name to manage gifts and see totals.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
          onClick={onToggleCompleted}
        >
          {completed ? "Mark not complete" : "Mark completed"}
        </button>
        <button
          type="button"
          className="text-[11px] px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
