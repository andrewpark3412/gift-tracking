import type { List, ListVisibility } from "../../types";

interface ListsSectionProps {
  lists: List[];
  loading: boolean;
  error: string | null;
  selectedListId: string | null;
  onSelectList: (list: List) => void;
  onCreateList: (params: { name: string; year: number; visibility: ListVisibility }) => Promise<void>;
  onToggleVisibility: (id: string, currentVisibility: ListVisibility) => Promise<void>;
  onDuplicateList: (list: List) => Promise<void>;
  onDeleteList: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function ListsSection({
  lists,
  loading,
  error,
  selectedListId,
  onSelectList,
  onCreateList,
  onToggleVisibility,
  onDuplicateList,
  onDeleteList,
  onRefresh,
}: ListsSectionProps) {
  const currentYear = new Date().getFullYear();
  const [newListName, setNewListName] = useState(`Christmas ${currentYear}`);
  const [newListYear, setNewListYear] = useState<number>(currentYear);
  const [newListVisibility, setNewListVisibility] = useState<ListVisibility>("household");
  const [newListError, setNewListError] = useState<string | null>(null);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewListError(null);

    if (!newListName.trim()) {
      setNewListError("List name is required.");
      return;
    }
    if (!newListYear) {
      setNewListError("Year is required.");
      return;
    }

    await onCreateList({
      name: newListName.trim(),
      year: newListYear,
      visibility: newListVisibility,
    });
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Year Lists</h2>
        <button
          onClick={onRefresh}
          className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <form onSubmit={handleCreateList} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">List name</label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Year</label>
          <input
            type="number"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={newListYear}
            onChange={(e) => setNewListYear(Number(e.target.value) || currentYear)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Visibility</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={newListVisibility}
            onChange={(e) => setNewListVisibility(e.target.value as ListVisibility)}
          >
            <option value="household">Household</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
          >
            Add List
          </button>
        </div>
      </form>

      {newListError && <p className="text-xs text-red-600 mb-2">{newListError}</p>}
      {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}
      {loading && <p className="text-sm text-slate-600">Loading lists…</p>}

      {!loading && lists.length === 0 && (
        <p className="text-sm text-slate-600">
          No lists yet. Create your first one above (e.g., &quot;Christmas {currentYear}&quot;).
        </p>
      )}

      <ul className="space-y-2">
        {lists.map((list) => (
          <li
            key={list.id}
            className={`border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
              selectedListId === list.id
                ? "bg-emerald-50 border-emerald-300"
                : "bg-white hover:bg-slate-50/80 border-slate-200"
            }`}
            onClick={() => onSelectList(list)}
          >
            <div>
              <p className="font-medium flex items-center gap-2">
                <span>{list.name}</span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {list.year}
                </span>
                {selectedListId === list.id && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Active
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Visibility:{" "}
                <span
                  className={
                    list.visibility === "household"
                      ? "font-medium text-emerald-700"
                      : "font-medium text-slate-600"
                  }
                >
                  {list.visibility === "household" ? "Household list" : "Private list"}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
                onClick={() => onToggleVisibility(list.id, list.visibility)}
              >
                Toggle visibility
              </button>
              <button
                type="button"
                className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
                onClick={() => onDuplicateList(list)}
              >
                Duplicate next year
              </button>
              <button
                type="button"
                className="text-[11px] px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50"
                onClick={() => {
                  if (window.confirm(`Delete list "${list.name}" and all its people/gifts?`)) {
                    onDeleteList(list.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { useState } from "react";
