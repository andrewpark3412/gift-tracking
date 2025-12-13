import { useState } from "react";
import type { Person } from "../../types";

interface PersonRowProps {
  person: Person;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCompleted: () => Promise<void>;
  onUpdate: (updates: { name: string; budget: number | null }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function PersonRow({
  person,
  isSelected,
  onSelect,
  onToggleCompleted,
  onUpdate,
  onDelete,
}: PersonRowProps) {
  const completed = person.is_manually_completed;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const [editBudget, setEditBudget] = useState(person.budget?.toString() || "");

  if (isEditing) {
    return (
      <li
        className={`border rounded-xl px-4 py-3 transition-colors ${
          isSelected
            ? "bg-emerald-50 border-emerald-300"
            : "bg-white border-slate-200"
        } ${completed ? "border-l-4 border-l-emerald-500" : ""}`}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Budget</label>
              <input
                type="number"
                step="0.01"
                placeholder="Optional"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              onClick={async () => {
                if (!editName.trim()) return;
                const budget = editBudget.trim() ? parseFloat(editBudget) : null;
                await onUpdate({
                  name: editName.trim(),
                  budget: budget !== null && !isNaN(budget) ? budget : null,
                });
                setIsEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-100"
              onClick={() => {
                setEditName(person.name);
                setEditBudget(person.budget?.toString() || "");
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
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
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
