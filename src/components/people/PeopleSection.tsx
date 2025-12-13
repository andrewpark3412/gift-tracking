import React from "react";
import type { List, Person } from "../../types";
import type { ListTotals } from "../../hooks/useListTotals";
import { AddPersonForm } from "../people/AddPersonForm";
import { PersonRow } from "../people/PersonRow";
import { ListSummary } from "../lists/ListSummary";
import { MobileBackButton } from "../common/MobileBackButton";

interface PeopleSectionProps {
  list: List;
  people: Person[];
  loading: boolean;
  error: string | null;
  selectedPersonId: string | null;
  listTotals: ListTotals | null;
  listTotalsLoading: boolean;
  listTotalsError: string | null;
  onSelectPerson: (person: Person) => void;
  onAddPerson: (params: { name: string; budget?: number | null }) => Promise<void>;
  onUpdatePerson: (id: string, updates: Partial<Pick<Person, "name" | "budget" | "is_manually_completed">>) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onBack?: () => void;
}

export function PeopleSection({
  list,
  people,
  loading,
  error,
  selectedPersonId,
  listTotals,
  listTotalsLoading,
  listTotalsError,
  onSelectPerson,
  onAddPerson,
  onUpdatePerson,
  onDeletePerson,
  onRefresh,
  onBack,
}: PeopleSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredPeople = React.useMemo(() => {
    if (!searchQuery.trim()) return people;
    const query = searchQuery.toLowerCase();
    return people.filter(person => 
      person.name.toLowerCase().includes(query)
    );
  }, [people, searchQuery]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      {onBack && <MobileBackButton onClick={onBack} label="Back to Lists" />}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">
            People – {list.name}
          </h2>
          <p className="text-xs text-slate-500">Year: {list.year}</p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <ListSummary
        listName={list.name}
        totals={listTotals}
        loading={listTotalsLoading}
        error={listTotalsError}
      />

      <AddPersonForm onAdd={onAddPerson} />

      {people.length > 5 && (
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}
      {loading && <p className="text-sm text-slate-600">Loading people…</p>}

      {!loading && people.length === 0 && (
        <p className="text-sm text-slate-600">
          No people added yet. Use the form above to add someone
          (e.g., &quot;Mom&quot;, &quot;Dad&quot;, &quot;Kids&quot;).
        </p>
      )}

      {!loading && people.length > 0 && filteredPeople.length === 0 && (
        <p className="text-sm text-slate-600 mt-3">
          No people found matching &quot;{searchQuery}&quot;
        </p>
      )}

      <div className="mt-3 max-h-[600px] overflow-y-auto pr-2">
        <ul className="space-y-2">
          {filteredPeople.map((person) => (
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
              onUpdate={async (updates) => {
                await onUpdatePerson(person.id, updates);
              }}
              onDelete={async () => {
                if (window.confirm(`Delete ${person.name} and all their gifts?`)) {
                  await onDeletePerson(person.id);
                }
              }}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
