import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useAuthSession } from "./hooks/useAuthSession";
import { useCurrentHousehold } from "./hooks/useCurrentHousehold";
import { useLists } from "./hooks/useLists";
import { useListTotals } from "./hooks/useListTotals";
import { usePeople } from "./hooks/usePeople";
import { useGifts } from "./hooks/useGifts";

import type {
  List,
  ListVisibility,
  Person,
  Gift,
  GiftStatus,
} from "./types";

function App() {
  const { userId, sessionChecked } = useAuthSession();

  // Auth UI state
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Household
  const {
    loading: householdLoading,
    error: householdError,
    currentHousehold,
    createHousehold,
  } = useCurrentHousehold(userId);

  const [newHouseholdName, setNewHouseholdName] = useState("Park Family");
  const [creatingHouseholdError, setCreatingHouseholdError] =
    useState<string | null>(null);

  // Lists for household
  const {
    lists,
    loading: listsLoading,
    error: listsError,
    createList,
    updateList,
    deleteList,
    refresh: refreshLists,
  } = useLists(currentHousehold?.id ?? null, userId);

  // Selected list
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<List | null>(null);

  const {
    totals: selectedListTotals,
    loading: listTotalsLoading,
    error: listTotalsError,
    refresh: refreshListTotals,
  } = useListTotals(selectedListId);

  // People for selected list
  const {
    people,
    loading: peopleLoading,
    error: peopleError,
    createPerson,
    updatePerson,
    deletePerson,
    refresh: refreshPeople,
  } = usePeople(selectedListId);

  const handleCreatePerson = async (params: { name: string; budget?: number | null }) => {
    await createPerson(params);
    await refreshListTotals();
  };

  const handleUpdatePerson = async (
    id: string,
    updates: Partial<Pick<Person, "name" | "budget" | "is_manually_completed">>
  ) => {
    await updatePerson(id, updates);
    await refreshListTotals();
  };

  const handleDeletePerson = async (id: string) => {
    await deletePerson(id);
    await refreshListTotals();
  };

  // Selected person (for gifts)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Gift-related state will live in the GiftsSection component via useGifts

  // New list form
  const currentYear = new Date().getFullYear();
  const [newListName, setNewListName] = useState(`Christmas ${currentYear}`);
  const [newListYear, setNewListYear] = useState<number>(currentYear);
  const [newListVisibility, setNewListVisibility] =
    useState<ListVisibility>("household");
  const [newListError, setNewListError] = useState<string | null>(null);

  // Auth handlers
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      console.error("Sign in error", error);
      setAuthError(error.message);
      return;
    }

    console.log("Signed in as", data.user?.id);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      console.error("Sign up error", error);
      setAuthError(error.message);
      return;
    }

    console.log("Sign up data", data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Household creation handlers
  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingHouseholdError(null);
    if (!newHouseholdName.trim()) {
      setCreatingHouseholdError("Household name is required.");
      return;
    }
    await createHousehold(newHouseholdName.trim());
  };

  // List handlers
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

    await createList({
      name: newListName.trim(),
      year: newListYear,
      visibility: newListVisibility,
    });
  };

  const handleToggleVisibility = async (
    id: string,
    currentVisibility: ListVisibility
  ) => {
    const next: ListVisibility =
      currentVisibility === "household" ? "private" : "household";
    await updateList(id, { visibility: next });
  };

  // Session check
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full">
          <p className="text-center text-slate-600">Checking session…</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">
            🎄 Christmas Gift Tracker
          </h1>
          <p className="text-sm text-slate-600 text-center">
            Sign in or create an account.
          </p>

          <form
            onSubmit={creatingAccount ? handleSignUp : handleSignIn}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {authError && (
              <p className="text-sm text-red-600 text-center">{authError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
            >
              {creatingAccount ? "Sign Up" : "Sign In"}
            </button>
          </form>

          <button
            type="button"
            className="w-full text-xs text-slate-600 mt-2"
            onClick={() => setCreatingAccount((prev) => !prev)}
          >
            {creatingAccount
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    );
  }

  // Logged in but no household
  if (!householdLoading && !currentHousehold) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">
            🎄 Christmas Gift Tracker
          </h1>
          <p className="text-sm text-slate-600 text-center">
            Welcome! Let&apos;s create your household so you can share lists
            with your family.
          </p>

          <form onSubmit={handleCreateHousehold} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Household name
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
              />
            </div>

            {creatingHouseholdError && (
              <p className="text-sm text-red-600 text-center">
                {creatingHouseholdError}
              </p>
            )}
            {householdError && (
              <p className="text-sm text-red-600 text-center">
                {householdError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
            >
              Create Household
            </button>
          </form>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full text-xs text-slate-600 mt-2"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Logged in with a household → main UI
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              🎄 Christmas Gift Tracker
            </h1>
            {currentHousehold && (
              <p className="text-xs text-slate-500">
                Household: {currentHousehold.name}
              </p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Lists */}
        <section className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Year Lists</h2>
            <button
              onClick={refreshLists}
              className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          <form
            onSubmit={handleCreateList}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 items-end"
          >
            <div>
              <label className="block text-xs font-medium mb-1">
                List name
              </label>
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
                onChange={(e) =>
                  setNewListYear(Number(e.target.value) || currentYear)
                }
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Visibility
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={newListVisibility}
                onChange={(e) =>
                  setNewListVisibility(e.target.value as ListVisibility)
                }
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

          {newListError && (
            <p className="text-xs text-red-600 mb-2">{newListError}</p>
          )}
          {listsError && (
            <p className="text-xs text-red-600 mb-2">Error: {listsError}</p>
          )}

          {listsLoading && (
            <p className="text-sm text-slate-600">Loading lists…</p>
          )}

          {!listsLoading && lists.length === 0 && (
            <p className="text-sm text-slate-600">
              No lists yet. Create your first one above (e.g., &quot;Christmas{" "}
              {currentYear}&quot;).
            </p>
          )}

          <ul className="space-y-2">
            {lists.map((list) => (
              <li
                key={list.id}
                className={`border rounded-md px-4 py-2 flex items-center justify-between cursor-pointer ${
                  selectedListId === list.id
                    ? "bg-emerald-50 border-emerald-300"
                    : ""
                }`}
                onClick={() => {
                  setSelectedListId(list.id);
                  setSelectedList(list);
                  setSelectedPersonId(null);
                  setSelectedPerson(null);
                }}
              >
                <div>
                  <p className="font-medium">{list.name}</p>
                  <p className="text-xs text-slate-500">
                    Year: {list.year} • Visibility:{" "}
                    <span className="font-medium">
                      {list.visibility === "household"
                        ? "Household"
                        : "Private"}
                    </span>
                  </p>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="text-xs px-2 py-1 border rounded-md hover:bg-slate-50"
                    onClick={() =>
                      handleToggleVisibility(list.id, list.visibility)
                    }
                  >
                    Toggle visibility
                  </button>
                  <button
                    type="button"
                    className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete list "${list.name}" and all its people/gifts?`
                        )
                      ) {
                        deleteList(list.id);
                        if (selectedListId === list.id) {
                          setSelectedListId(null);
                          setSelectedList(null);
                          setSelectedPersonId(null);
                          setSelectedPerson(null);
                        }
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

        {/* People section for selected list */}
        {selectedList && (
          <section className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl font-semibold">
                  People – {selectedList.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Year: {selectedList.year}
                </p>
              </div>
              <button
                onClick={async () => {
                  await refreshPeople();
                  await refreshListTotals();
                }}
                className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>

                        {/* List summary */}
            <div className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {listTotalsLoading && <p>Calculating list totals…</p>}
              {listTotalsError && (
                <p className="text-red-600">Error: {listTotalsError}</p>
              )}
              {!listTotalsLoading && !listTotalsError && selectedListTotals && (
                <>
                  <p className="font-medium">
                    List summary for {selectedList.name}
                  </p>
                  <p>
                    People: {selectedListTotals.peopleCount}
                  </p>
                  <p>
                    Total spent: $
                    {selectedListTotals.totalSpent.toFixed(2)}
                  </p>
                  {selectedListTotals.remainingBudget !== null ? (
                    <p>
                      Total budget: $
                      {selectedListTotals.totalBudget.toFixed(2)} • Remaining:{" "}
                      <span
                        className={
                          selectedListTotals.remainingBudget < 0
                            ? "text-red-600 font-semibold"
                            : "font-semibold"
                        }
                      >
                        $
                        {selectedListTotals.remainingBudget.toFixed(
                          2
                        )}
                      </span>
                    </p>
                  ) : (
                    <p>No budgets set yet for this list.</p>
                  )}
                  {selectedListTotals.overBudgetPeopleCount > 0 && (
                    <p className="text-red-600">
                      Over budget:{" "}
                      {selectedListTotals.overBudgetPeopleCount}{" "}
                      {selectedListTotals.overBudgetPeopleCount === 1
                        ? "person"
                        : "people"}
                    </p>
                  )}
                </>
              )}
            </div>

            <AddPersonForm onAdd={handleCreatePerson} />

            {peopleError && (
              <p className="text-xs text-red-600 mb-2">Error: {peopleError}</p>
            )}

            {peopleLoading && (
              <p className="text-sm text-slate-600">Loading people…</p>
            )}

            {!peopleLoading && people.length === 0 && (
              <p className="text-sm text-slate-600">
                No people added yet. Use the form above to add someone (e.g.,
                &quot;Mom&quot;, &quot;Dad&quot;, &quot;Kids&quot;).
              </p>
            )}

            <ul className="mt-3 space-y-2">
              {people.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  isSelected={selectedPersonId === person.id}
                  onSelect={() => {
                    setSelectedPersonId(person.id);
                    setSelectedPerson(person);
                  }}
                  onToggleCompleted={() =>
                    handleUpdatePerson(person.id, {
                      is_manually_completed: !person.is_manually_completed,
                    })
                  }
                  onDelete={async () => {
                    if (
                      window.confirm(
                        `Delete ${person.name} and all their gifts?`
                      )
                    ) {
                      await handleDeletePerson(person.id);
                      if (selectedPersonId === person.id) {
                        setSelectedPersonId(null);
                        setSelectedPerson(null);
                      }
                    }
                  }}
                />
              ))}
            </ul>
          </section>
        )}

        {/* Gifts section for selected person */}
        {selectedPerson && (
          <GiftsSection
            key={selectedPerson.id}
            person={selectedPerson}
            onTotalsChanged={refreshListTotals}
          />
        )}
      </main>
      <EnvBadge />
      <InstallBanner />
    </div>
  );
}

/* ---------- AddPersonForm ---------- */

type AddPersonFormProps = {
  onAdd: (params: { name: string; budget?: number | null }) => Promise<void>;
};

function AddPersonForm({ onAdd }: AddPersonFormProps) {
  const [name, setName] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    let budget: number | null = null;
    if (budgetInput.trim() !== "") {
      const parsed = Number(budgetInput);
      if (Number.isNaN(parsed) || parsed < 0) {
        setError("Budget must be a non-negative number.");
        return;
      }
      budget = parsed;
    }

    await onAdd({ name: name.trim(), budget });

    setName("");
    setBudgetInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end"
    >
      <div>
        <label className="block text-xs font-medium mb-1">Person name</label>
        <input
          type="text"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mom, Dad, Danae, Kids..."
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">
          Budget (optional)
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={budgetInput}
          onChange={(e) => setBudgetInput(e.target.value)}
          placeholder="e.g. 100"
        />
      </div>
      <div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
        >
          Add Person
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </form>
  );
}

/* ---------- PersonRow ---------- */

type PersonRowProps = {
  person: Person;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCompleted: () => Promise<void>;
  onDelete: () => Promise<void>;
};

function PersonRow({
  person,
  isSelected,
  onSelect,
  onToggleCompleted,
  onDelete,
}: PersonRowProps) {
  return (
    <li
      className={`border rounded-md px-4 py-2 flex items-center justify-between ${
        isSelected ? "bg-emerald-50 border-emerald-300" : ""
      }`}
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
          {person.is_manually_completed && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Completed
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          Budget:{" "}
          {person.budget != null
            ? `$${person.budget.toFixed(2)}`
            : "No budget set"}
        </p>
        <p className="text-xs text-slate-400 italic">
          Click name to manage gifts and see totals.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-xs px-2 py-1 border rounded-md hover:bg-slate-50"
          onClick={onToggleCompleted}
        >
          {person.is_manually_completed ? "Mark not complete" : "Mark completed"}
        </button>
        <button
          type="button"
          className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

/* ---------- GiftsSection ---------- */

type GiftsSectionProps = {
  person: Person;
  onTotalsChanged?: () => Promise<void> | void;
};

function GiftsSection({ person, onTotalsChanged }: GiftsSectionProps) {
  const {
    gifts,
    loading,
    error,
    refresh,
    createGift,
    updateGift,
    deleteGift,
  } = useGifts(person.id);

  // Totals: only purchased gifts count as "spent"
  const totals = gifts.reduce(
    (acc, gift) => {
      const price = Number(gift.price) || 0;
      if (gift.status === "purchased") {
        acc.totalSpent += price;
        acc.purchasedCount += 1;
      } else {
        acc.ideaCount += 1;
      }
      if (!gift.is_wrapped && gift.status === "purchased") {
        acc.unwrappedPurchasedCount += 1;
      }
      return acc;
    },
    {
      totalSpent: 0,
      ideaCount: 0,
      purchasedCount: 0,
      unwrappedPurchasedCount: 0,
    }
  );

  const remainingBudget =
    person.budget != null ? person.budget - totals.totalSpent : null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">Gifts – {person.name}</h2>
          <p className="text-xs text-slate-500">
            Budget:{" "}
            {person.budget != null
              ? `$${person.budget.toFixed(2)}`
              : "No budget set"}
          </p>
          <p className="text-xs text-slate-500">
            Spent: ${totals.totalSpent.toFixed(2)}{" "}
            {remainingBudget != null && (
              <>
                • Remaining:{" "}
                <span
                  className={
                    remainingBudget < 0
                      ? "text-red-600 font-semibold"
                      : "font-semibold"
                  }
                >
                  ${remainingBudget.toFixed(2)}
                </span>
              </>
            )}
          </p>
          <p className="text-xs text-slate-500">
            Idea gifts: {totals.ideaCount} • Purchased:{" "}
            {totals.purchasedCount} • Purchased but not wrapped:{" "}
            {totals.unwrappedPurchasedCount}
          </p>
        </div>
        <button
          onClick={async () => {
            await refresh();
            if (onTotalsChanged) await onTotalsChanged();
          }}
          className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      <AddGiftForm
        onAdd={async (params) => {
          await createGift(params);
          if (onTotalsChanged) await onTotalsChanged();
        }}
      />

      {error && <p className="text-xs text-red-600 mb-2">Error: {error}</p>}

      {loading && <p className="text-sm text-slate-600">Loading gifts…</p>}

      {!loading && gifts.length === 0 && (
        <p className="text-sm text-slate-600">
          No gifts yet. Add ideas and mark them purchased as you go.
        </p>
      )}

      <ul className="mt-3 space-y-2">
        {gifts.map((gift) => (
          <GiftRow
            key={gift.id}
            gift={gift}
            onToggleStatus={async () => {
              await updateGift(gift.id, {
                status: gift.status === "idea" ? "purchased" : "idea",
              });
              if (onTotalsChanged) await onTotalsChanged();
            }}
            onToggleWrapped={async () => {
              await updateGift(gift.id, { is_wrapped: !gift.is_wrapped });
              if (onTotalsChanged) await onTotalsChanged();
            }}
            onDelete={async () => {
              await deleteGift(gift.id);
              if (onTotalsChanged) await onTotalsChanged();
            }}
          />
        ))}
      </ul>
    </section>
  );
}

/* ---------- AddGiftForm ---------- */

type AddGiftFormProps = {
  onAdd: (params: {
    description: string;
    price: number;
    status: GiftStatus;
    isWrapped?: boolean;
    notes?: string | null;
  }) => Promise<void>;
};

function AddGiftForm({ onAdd }: AddGiftFormProps) {
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [status, setStatus] = useState<GiftStatus>("idea");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    const price = Number(priceInput || "0");
    if (Number.isNaN(price) || price < 0) {
      setError("Price must be a non-negative number.");
      return;
    }

    await onAdd({
      description: description.trim(),
      price,
      status,
      isWrapped: false,
      notes: notes.trim() || null,
    });

    setDescription("");
    setPriceInput("");
    setStatus("idea");
    setNotes("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 mb-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium mb-1">
            Gift description
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="LEGO set, book, sweater..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Price</label>
          <input
            type="number"
            min={0}
            step="0.01"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="e.g. 29.99"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Status</label>
          <select
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as GiftStatus)}
          >
            <option value="idea">Idea</option>
            <option value="purchased">Purchased</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Store, link, size, color..."
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div>
          <button
            type="submit"
            className="w-full bg-emerald-600 text-white text-sm font-medium rounded-md py-2 hover:bg-emerald-700"
          >
            Save gift
          </button>
        </div>
      </div>
    </form>
  );
}

/* ---------- GiftRow ---------- */

type GiftRowProps = {
  gift: Gift;
  onToggleStatus: () => Promise<void>;
  onToggleWrapped: () => Promise<void>;
  onDelete: () => Promise<void>;
};

function GiftRow({ gift, onToggleStatus, onToggleWrapped, onDelete }: GiftRowProps) {
  return (
    <li className="border rounded-md px-4 py-2 flex items-center justify-between">
      <div>
        <p className="font-medium flex items-center gap-2">
          {gift.description}
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {gift.status === "idea" ? "Idea" : "Purchased"}
          </span>
          {gift.status === "purchased" && gift.is_wrapped && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Wrapped
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          Price: ${Number(gift.price).toFixed(2)}
        </p>
        {gift.notes && (
          <p className="text-xs text-slate-500">Notes: {gift.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-xs px-2 py-1 border rounded-md hover:bg-slate-50"
          onClick={onToggleStatus}
        >
          {gift.status === "idea" ? "Mark purchased" : "Mark idea"}
        </button>
        {gift.status === "purchased" && (
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded-md hover:bg-slate-50"
            onClick={onToggleWrapped}
          >
            {gift.is_wrapped ? "Unwrap" : "Mark wrapped"}
          </button>
        )}
        <button
          type="button"
          className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function EnvBadge() {
  const mode = import.meta.env.MODE; // "development", "production", "test", etc.

  // Hide in production; show in dev/preview
  if (mode === "production") return null;

  const label = mode.toUpperCase();
  const colorClass =
    mode === "development" ? "bg-amber-500" : "bg-sky-500";

  return (
    <div className={`fixed top-2 right-2 z-50 px-2 py-1 text-[10px] rounded-full ${colorClass} text-white shadow`}>
      {label}
    </div>
  );
}

import { useEffect } from "react";
import { usePWAInstallPrompt } from "./hooks/usePWAInstallPrompt";

/* ---------- InstallBanner ---------- */

function InstallBanner() {
  const { isInstallable, isStandalone, promptInstall } =
    usePWAInstallPrompt();

  const [delayPassed, setDelayPassed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedFlag =
      window.localStorage.getItem("gt_install_banner_dismissed") === "1";
    setDismissed(dismissedFlag);

    const timer = setTimeout(() => {
      setDelayPassed(true);
      console.log("[PWA] InstallBanner delay passed");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log(
      "[PWA] banner state ->",
      "delayPassed:",
      delayPassed,
      "dismissed:",
      dismissed,
      "isStandalone:",
      isStandalone,
      "isInstallable:",
      isInstallable
    );
  }, [delayPassed, dismissed, isStandalone, isInstallable]);

  if (!delayPassed || dismissed || isStandalone) {
    return null;
  }

  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem("gt_install_banner_dismissed", "1");
    } catch {
      // ignore
    }
  };

  // If the browser fired beforeinstallprompt → show "Install" button.
  // If not, we still show an "How to install" card so you can install manually.
  return (
    <div className="fixed bottom-3 inset-x-0 px-4 z-40 pointer-events-none">
      <div className="pointer-events-auto max-w-xl mx-auto bg-slate-900 text-white rounded-2xl shadow-lg p-3 flex items-center gap-3">
        <div className="flex-1 text-xs">
          {isInstallable ? (
            <>
              <p className="font-semibold text-sm mb-0.5">
                Install Christmas Gift Tracker
              </p>
              <p className="opacity-80">
                Add this app to your home screen for quick access and a
                full-screen experience.
              </p>
            </>
          ) : isIOS ? (
            <>
              <p className="font-semibold text-sm mb-0.5">
                Add Gift Tracker to Home Screen
              </p>
              <p className="opacity-80">
                Tap the <span className="font-semibold">Share</span> button
                in Safari, then choose{" "}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-sm mb-0.5">
                Install Christmas Gift Tracker
              </p>
              <p className="opacity-80">
                In your browser menu, choose{" "}
                <span className="font-semibold">
                  &ldquo;Install app&rdquo; / &ldquo;Add to Home screen&rdquo;
                </span>{" "}
                to pin this app for quick access.
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1 rounded-full border border-slate-500 text-slate-200 text-[10px] hover:bg-slate-800"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
