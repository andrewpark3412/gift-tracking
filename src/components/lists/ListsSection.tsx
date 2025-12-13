import { useState } from "react";
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
  onUpdateList: (id: string, updates: { name: string; year: number; visibility: ListVisibility }) => Promise<void>;
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
  onUpdateList,
  onRefresh,
}: ListsSectionProps) {
  const currentYear = new Date().getFullYear();
  const [newListName, setNewListName] = useState(`Christmas ${currentYear}`);
  const [newListYear, setNewListYear] = useState<number>(currentYear);
  const [newListVisibility, setNewListVisibility] = useState<ListVisibility>("household");
  const [newListError, setNewListError] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState<number>(currentYear);
  const [editVisibility, setEditVisibility] = useState<ListVisibility>("household");

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
          className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-slate-100 cursor-pointer"
          title="Refresh"
          aria-label="Refresh lists"
        >
          <span className="text-base">🔄</span>
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
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700 cursor-pointer"
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
        {lists.map((list) => {
          const isEditing = editingListId === list.id;

          return (
            <li
              key={list.id}
              className={`border rounded-xl px-4 py-3 transition-colors ${
                selectedListId === list.id
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white hover:bg-slate-50/80 border-slate-200"
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      <label className="block text-xs font-medium mb-1">Year</label>
                      <input
                        type="number"
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={editYear}
                        onChange={(e) => setEditYear(Number(e.target.value) || currentYear)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Visibility</label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        value={editVisibility}
                        onChange={(e) => setEditVisibility(e.target.value as ListVisibility)}
                      >
                        <option value="household">Household</option>
                        <option value="private">Private</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                      onClick={async () => {
                        if (!editName.trim()) return;
                        await onUpdateList(list.id, {
                          name: editName.trim(),
                          year: editYear,
                          visibility: editVisibility,
                        });
                        setEditingListId(null);
                      }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-100 cursor-pointer"
                      onClick={() => setEditingListId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* List info - clickable to select */}
                  <div className="cursor-pointer" onClick={() => onSelectList(list)}>
                    <p className="font-medium flex items-center gap-2 flex-wrap">
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

                  {/* Action buttons - separate row on mobile, inline on desktop */}
                  <div className="mt-3 pt-3 border-t md:mt-0 md:pt-0 md:border-t-0 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="text-[11px] px-2.5 py-1.5 border rounded-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      onClick={() => {
                        setEditingListId(list.id);
                        setEditName(list.name);
                        setEditYear(list.year);
                        setEditVisibility(list.visibility);
                      }}
                    >
                      <span>✏️</span>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="text-[11px] px-2.5 py-1.5 border rounded-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      onClick={() => onToggleVisibility(list.id, list.visibility)}
                      title="Toggle between household and private"
                    >
                      <span>{list.visibility === "household" ? "👥" : "🔒"}</span>
                      <span>Visibility</span>
                    </button>
                    <button
                      type="button"
                      className="text-[11px] px-2.5 py-1.5 border rounded-md hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      onClick={() => onDuplicateList(list)}
                      title="Duplicate to next year"
                    >
                      <span>➕</span>
                      <span>Duplicate</span>
                    </button>
                    <button
                      type="button"
                      className="text-[11px] px-2.5 py-1.5 border border-red-500 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-1 cursor-pointer"
                      onClick={() => {
                        if (window.confirm(`Delete list "${list.name}" and all its people/gifts?`)) {
                          onDeleteList(list.id);
                        }
                      }}
                    >
                      <span>🗑️</span>
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
