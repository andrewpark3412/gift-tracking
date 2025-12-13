import type { List, Person } from "../../types";
import type { ListTotals } from "../../hooks/useListTotals";
import { AddPersonForm } from "../people/AddPersonForm";
import { PersonRow } from "../people/PersonRow";
import { ListSummary } from "../lists/ListSummary";

interface PeopleSectionProps {
  list: List;
  people: Person[];
  loading: boolean;
  error: string | null;
  selectedPersonId: string | null;
  viewMode: "people" | "wrapping";
  listTotals: ListTotals | null;
  listTotalsLoading: boolean;
  listTotalsError: string | null;
  onSelectPerson: (person: Person) => void;
  onAddPerson: (params: { name: string; budget?: number | null }) => Promise<void>;
  onUpdatePerson: (id: string, updates: Partial<Pick<Person, "is_manually_completed">>) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onSetViewMode: (mode: "people" | "wrapping") => void;
  onRefresh: () => Promise<void>;
}

export function PeopleSection({
  list,
  people,
  loading,
  error,
  selectedPersonId,
  viewMode,
  listTotals,
  listTotalsLoading,
  listTotalsError,
  onSelectPerson,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onSetViewMode,
  onRefresh,
}: PeopleSectionProps) {
  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">
            {viewMode === "people" ? "People" : "Wrapping view"} – {list.name}
          </h2>
          <p className="text-xs text-slate-500">Year: {list.year}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-[11px]">
            <button
              type="button"
              onClick={() => onSetViewMode("people")}
              className={`px-2 py-1 rounded-full ${
                viewMode === "people"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
              }`}
            >
              People
            </button>
            <button
              type="button"
              onClick={() => onSetViewMode("wrapping")}
              className={`px-2 py-1 rounded-full ${
                viewMode === "wrapping"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
              }`}
            >
              Wrapping
            </button>
          </div>
          <button
            onClick={onRefresh}
            className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <ListSummary
        listName={list.name}
        totals={listTotals}
        loading={listTotalsLoading}
        error={listTotalsError}
      />

      {viewMode === "people" && (
        <>
          <AddPersonForm onAdd={onAddPerson} />

          {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}
          {loading && <p className="text-sm text-slate-600">Loading people…</p>}

          {!loading && people.length === 0 && (
            <p className="text-sm text-slate-600">
              No people added yet. Use the form above to add someone
              (e.g., &quot;Mom&quot;, &quot;Dad&quot;, &quot;Kids&quot;).
            </p>
          )}

          <ul className="mt-3 space-y-2">
            {people.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                isSelected={selectedPersonId === person.id}
                onSelect={() => onSelectPerson(person)}
                onToggleCompleted={() =>
                  onUpdatePerson(person.id, {
                    is_manually_completed: !person.is_manually_completed,
                  })
                }
                onDelete={async () => {
                  if (window.confirm(`Delete ${person.name} and all their gifts?`)) {
                    await onDeletePerson(person.id);
                  }
                }}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
