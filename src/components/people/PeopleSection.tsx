import React from "react";
import { supabase } from "../../lib/supabaseClient";
import { offlineUpdate, offlineDelete } from "../../lib/offlineSupabase";
import type { Gift } from "../../types";
import { GiftEditModal } from "../gifts/GiftEditModal";
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

  // Fetch gifts for all people in one query for performance
  const [giftsMap, setGiftsMap] = React.useState<Record<string, Gift[]>>({});

  const loadGiftsForPeople = React.useCallback(async () => {
    if (!people || people.length === 0) {
      setGiftsMap({});
      return;
    }

    // start loading gifts

    try {
      const personIds = people.map((p) => p.id);
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .in("person_id", personIds)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading gifts for people", error);
        setGiftsMap({});
      } else {
        const map: Record<string, Gift[]> = {};
        (data ?? []).forEach((g: Gift) => {
          if (!map[g.person_id]) map[g.person_id] = [];
          map[g.person_id].push(g);
        });
        setGiftsMap(map);
      }
    } catch (err: any) {
      console.error("Unexpected error loading gifts", err);
      setGiftsMap({});
    }
  }, [people]);

  React.useEffect(() => {
    loadGiftsForPeople();
  }, [loadGiftsForPeople]);

  // Modal state for editing a gift
  const [editingGift, setEditingGift] = React.useState<Gift | null>(null);

  const handleUpdateGift = async (id: string, updates: Partial<Gift>) => {
    // optimistic update
    setGiftsMap((prev) => {
      const next = { ...prev };
      for (const pid of Object.keys(next)) {
        next[pid] = next[pid].map((g) => (g.id === id ? { ...g, ...updates } : g));
      }
      return next;
    });

    const { data, error } = await offlineUpdate<Gift>("gifts", id, updates);
    if (error) {
      console.error("Error updating gift", error);
      // reload gifts on error
      await loadGiftsForPeople();
      throw error;
    }

    // merge returned data if available
    if (data) {
      setGiftsMap((prev) => {
        const next = { ...prev };
        for (const pid of Object.keys(next)) {
          next[pid] = next[pid].map((g) => (g.id === id ? data : g));
        }
        return next;
      });
    }
  };

  const handleDeleteGift = async (id: string) => {
    // optimistic remove
    setGiftsMap((prev) => {
      const next: Record<string, Gift[]> = {};
      for (const pid of Object.keys(prev)) {
        next[pid] = prev[pid].filter((g) => g.id !== id);
      }
      return next;
    });

    const { error } = await offlineDelete("gifts", id);
    if (error) {
      console.error("Error deleting gift", error);
      await loadGiftsForPeople();
      throw error;
    }
  };

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
          className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-slate-100 cursor-pointer"
          title="Refresh"
          aria-label="Refresh people"
        >
          <span className="text-base">🔄</span>
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
              gifts={giftsMap[person.id] || []}
              onOpenGift={(g) => setEditingGift(g)}
            />
          ))}
        </ul>
      </div>
      <GiftEditModal
        isOpen={!!editingGift}
        gift={editingGift}
        onClose={() => setEditingGift(null)}
        onUpdate={async (id, updates) => {
          await handleUpdateGift(id, updates);
        }}
        onDelete={async (id) => {
          await handleDeleteGift(id);
        }}
      />
    </section>
  );
}
