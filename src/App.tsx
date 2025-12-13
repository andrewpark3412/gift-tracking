import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useAuthSession } from "./hooks/useAuthSession";
import { useCurrentHousehold } from "./hooks/useCurrentHousehold";
import { useHouseholdInvites } from "./hooks/useHouseholdInvites";
import { useHouseholdMembers } from "./hooks/useHouseholdMembers";
import { useLists } from "./hooks/useLists";
import { useListTotals } from "./hooks/useListTotals";
import { usePeople } from "./hooks/usePeople";
import { useGifts } from "./hooks/useGifts";
import { useWrappingDashboard } from "./hooks/useWrappingDashboard";

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
  const [viewMode, setViewMode] = useState<"people" | "wrapping">("people");

  const inviteToken = new URLSearchParams(window.location.search).get("invite");

  // Household
  const {
    loading: householdLoading,
    error: householdError,
    currentHousehold,
    createHousehold,
  } = useCurrentHousehold(userId);

  const {
    members,
    loading: membersLoading,
    error: membersError,
    refresh: refreshMembers,
    removeMember,
    leaveHousehold,
  } = useHouseholdMembers(currentHousehold?.id ?? null);

    const {
      invites,
      loading: invitesLoading,
      error: invitesError,
      createInvite,
      revokeInvite,
      refresh: refreshInvites,
    } = useHouseholdInvites(currentHousehold?.id ?? null);

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
    duplicateList,
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

    const {
      groups: wrappingGroups,
      loading: wrappingLoading,
      error: wrappingError,
      refresh: refreshWrapping,
      markGiftWrapped,
    } = useWrappingDashboard(selectedListId);

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
    await upsertProfile();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const inviteToken = new URLSearchParams(window.location.search).get("invite");

    const redirectTo =
      inviteToken
        ? `${window.location.origin}?invite=${encodeURIComponent(inviteToken)}`
        : window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      console.error("Sign up error", error);
      setAuthError(error.message);
      return;
    }

    console.log("Sign up data", data);
    await upsertProfile();
    if (!data.session) {
      setAuthError(
        "Check your email to confirm your account, then return to this page to finish joining the household."
      );
      return;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const upsertProfile = async () => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id || !user.email) return;

    await supabase.from("profiles").upsert({
      user_id: user.id,
      email: user.email,
    });
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

  const handleDuplicateList = async (list: List) => {
    const nextYear = list.year + 1;

    // Try to auto-suggest a good new name
    const yearStr = String(list.year);
    let suggestedName = list.name.includes(yearStr)
      ? list.name.replace(yearStr, String(nextYear))
      : `${list.name} ${nextYear}`;

    const confirmMsg = `Create a ${nextYear} list by copying people (and budgets) from "${list.name}" to "${suggestedName}"?\n\nGifts will NOT be copied.`;
    const proceed = window.confirm(confirmMsg);
    if (!proceed) return;

    const newList = await duplicateList(list.id, {
      newName: suggestedName,
      newYear: nextYear,
    });

    if (!newList) return;

    // Auto-select the new list in the UI
    setSelectedListId(newList.id);
    setSelectedList(newList);
    setSelectedPersonId(null);
    setSelectedPerson(null);
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

    // If user has an invite token in URL, show accept flow
  if (inviteToken) {
    return (
      <AcceptInviteScreen
        token={inviteToken}
        onDone={() => {
          // remove query param (simple)
          window.history.replaceState({}, "", window.location.pathname);
          // refresh household info by reloading page (simplest + reliable)
          window.location.reload();
        }}
      />
    );
  }

  // Logged in with a household → main UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40">
              <span className="text-xl">🎄</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-50">
                Christmas Gift Tracker
              </h1>
              {currentHousehold && (
                <p className="text-[11px] text-slate-400">
                  Household: <span className="font-medium">{currentHousehold.name}</span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800"
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
                className={`border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${
                  selectedListId === list.id
                    ? "bg-emerald-50 border-emerald-300"
                    : "bg-white hover:bg-slate-50/80 border-slate-200"
                }`}
                onClick={() => {
                  setSelectedListId(list.id);
                  setSelectedList(list);
                  setSelectedPersonId(null);
                  setSelectedPerson(null);
                  setViewMode("people");
                }}
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
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
                    onClick={() =>
                      handleToggleVisibility(list.id, list.visibility)
                    }
                  >
                    Toggle visibility
                  </button>
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
                    onClick={() => handleDuplicateList(list)}
                  >
                    Duplicate next year
                  </button>
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50"
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
                  {viewMode === "people" ? "People" : "Wrapping view"} –{" "}
                  {selectedList.name}
                </h2>
                <p className="text-xs text-slate-500">
                  Year: {selectedList.year}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full bg-slate-100 p-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setViewMode("people")}
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
                    onClick={() => setViewMode("wrapping")}
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
                  onClick={async () => {
                    await refreshPeople();
                    await refreshListTotals();
                    await refreshWrapping();
                  }}
                  className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* List summary */}
            <div className="mb-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              {listTotalsLoading && <p>Calculating list totals…</p>}
              {listTotalsError && (
                <p className="text-red-600">Error: {listTotalsError}</p>
              )}
              {!listTotalsLoading && !listTotalsError && selectedListTotals && (
                <>
                  <p className="font-medium mb-1">
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
                        {selectedListTotals.remainingBudget.toFixed(2)}
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

                  {selectedListTotals.perPerson &&
                    selectedListTotals.perPerson.length > 0 && (
                      <>
                        <div className="mt-2 h-px bg-slate-200/70" />
                        <p className="mt-2 mb-1 text-[11px] font-semibold text-slate-600">
                          Per-person budgets
                        </p>
                        <ul className="space-y-1.5">
                          {selectedListTotals.perPerson
                            .filter(
                              (p) =>
                                p.budget !== null || p.spent > 0
                            )
                            .map((p) => {
                              const budget = p.budget ?? 0;
                              const spent = p.spent;
                              const percentUsed =
                                budget > 0
                                  ? Math.min(
                                      100,
                                      Math.round((spent / budget) * 100)
                                    )
                                  : null;

                              return (
                                <li key={p.personId}>
                                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                                    <span className="font-medium text-slate-700">
                                      {p.name}
                                    </span>
                                    <span className="text-slate-500">
                                      {budget > 0 ? (
                                        <>
                                          ${spent.toFixed(2)} / $
                                          {budget.toFixed(2)}{" "}
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
                                          p.overBudget
                                            ? "bg-red-500"
                                            : "bg-emerald-500"
                                        }`}
                                        style={{
                                          width: `${percentUsed ?? 0}%`,
                                        }}
                                      />
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                        </ul>
                      </>
                    )}
                </>
              )}
            </div>

            <AddPersonForm onAdd={handleCreatePerson} />

            {viewMode === "people" && (
              <>
                <AddPersonForm onAdd={handleCreatePerson} />

                {peopleError && (
                  <p className="text-xs text-red-600 mb-2">
                    Error: {peopleError}
                  </p>
                )}

                {peopleLoading && (
                  <p className="text-sm text-slate-600">
                    Loading people…
                  </p>
                )}

                {!peopleLoading && people.length === 0 && (
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
                      onSelect={() => {
                        setSelectedPersonId(person.id);
                        setSelectedPerson(person);
                      }}
                      onToggleCompleted={() =>
                        handleUpdatePerson(person.id, {
                          is_manually_completed:
                            !person.is_manually_completed,
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
              </>
            )}
          </section>
        )}

        {viewMode === "wrapping" && selectedList && (
          <WrappingDashboard
            groups={wrappingGroups}
            loading={wrappingLoading}
            error={wrappingError}
            onRefresh={async () => {
              await refreshWrapping();
              await refreshListTotals();
            }}
            onGiftWrapped={async () => {
              await refreshListTotals();
            }}
            selectedListName={selectedList.name}
            markGiftWrapped={markGiftWrapped}
          />
        )}

        {/* Gifts section for selected person */}
        {viewMode === "people" && selectedPerson && (
          <GiftsSection
            key={selectedPerson.id}
            person={selectedPerson}
            onTotalsChanged={refreshListTotals}
          />
        )}

        <section className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Household</h2>
            <button
              onClick={refreshInvites}
              className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>

          <InviteForm
            onCreate={async (email) => {
              const inv = await createInvite(email);
              const link = `${window.location.origin}?invite=${inv.token}`;
              await navigator.clipboard.writeText(link);
              alert(`Invite link copied!\n\n${link}`);
            }}
          />

          {invitesError && (
            <p className="text-xs text-red-600 mt-2">Error: {invitesError}</p>
          )}

          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Pending invites</p>
            {invitesLoading && <p className="text-sm text-slate-600">Loading…</p>}
            {!invitesLoading && invites.filter(i => i.status === "pending").length === 0 && (
              <p className="text-sm text-slate-600">No pending invites.</p>
            )}

            <ul className="space-y-2">
              {invites
                .filter((i) => i.status === "pending")
                .map((i) => {
                  const link = `${window.location.origin}?invite=${i.token}`;
                  return (
                    <li key={i.id} className="border rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{i.invited_email}</p>
                        <p className="text-xs text-slate-500">
                          Expires: {new Date(i.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 border rounded-full hover:bg-slate-50"
                          onClick={async () => {
                            await navigator.clipboard.writeText(link);
                            alert("Invite link copied!");
                          }}
                        >
                          Copy link
                        </button>
                        <button
                          className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50"
                          onClick={async () => {
                            if (confirm("Revoke this invite?")) {
                              await revokeInvite(i.id);
                            }
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Members</p>
              <button
                onClick={refreshMembers}
                className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>

            {membersError && (
              <p className="text-xs text-red-600 mb-2">Error: {membersError}</p>
            )}

            {membersLoading && <p className="text-sm text-slate-600">Loading…</p>}

            {!membersLoading && members.length === 0 && (
              <p className="text-sm text-slate-600">No members found.</p>
            )}

            <ul className="space-y-2">
              {members.map((m) => (
                <li
                  key={m.user_id}
                  className="border rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{m.email ?? m.user_id}</p>
                    {m.created_at && (
                      <p className="text-xs text-slate-500">
                        Joined: {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs px-2 py-1 border border-red-500 text-red-600 rounded-full hover:bg-red-50"
                      onClick={async () => {
                        const { data } = await supabase.auth.getUser();
                        const me = data.user?.id;

                        if (m.user_id === me) {
                          if (confirm("Leave this household? You may lose access to household lists.")) {
                            await leaveHousehold();
                            window.location.reload();
                          }
                          return;
                        }

                        if (confirm(`Remove ${m.email ?? "this user"} from the household?`)) {
                          await removeMember(m.user_id);
                        }
                      }}
                    >
                      {/** label changes if you are that member */}
                      {m.user_id === userId ? "Leave" : "Remove"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
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
  const isIdea = gift.status === "idea";
  const isPurchased = gift.status === "purchased";

  return (
    <li className="border rounded-xl px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
      <div>
        <p className="font-medium flex items-center gap-2">
          <span className={isIdea ? "text-slate-700" : "text-slate-900"}>
            {gift.description}
          </span>
          <span
            className={
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] " +
              (isIdea
                ? "bg-slate-100 text-slate-700"
                : "bg-emerald-100 text-emerald-700")
            }
          >
            {isIdea ? "Idea" : "Purchased"}
          </span>
          {isPurchased && gift.is_wrapped && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
              <span>🎁</span>
              <span>Wrapped</span>
            </span>
          )}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Price: ${Number(gift.price).toFixed(2)}
        </p>
        {gift.notes && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            Notes: {gift.notes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
          onClick={onToggleStatus}
        >
          {isIdea ? "Mark purchased" : "Mark idea"}
        </button>
        {isPurchased && (
          <button
            type="button"
            className="text-[11px] px-2 py-1 border rounded-full hover:bg-slate-100"
            onClick={onToggleWrapped}
          >
            {gift.is_wrapped ? "Unwrap" : "Mark wrapped"}
          </button>
        )}
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

/* ---------- WrappingDashboard ---------- */

type WrappingDashboardProps = {
  groups: import("./hooks/useWrappingDashboard").WrappingGroup[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void> | void;
  onGiftWrapped?: () => Promise<void> | void;
  selectedListName: string;
  markGiftWrapped: (giftId: string) => Promise<void>;
};

function WrappingDashboard({
  groups,
  loading,
  error,
  onRefresh,
  onGiftWrapped,
  selectedListName,
  markGiftWrapped,
}: WrappingDashboardProps) {
  const totalGifts = groups.reduce(
    (sum, group) => sum + group.gifts.length,
    0
  );

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Wrapping dashboard – {selectedListName}
          </p>
          <p className="text-[11px] text-slate-500">
            Showing all <span className="font-semibold">purchased</span> gifts
            that are <span className="font-semibold">not wrapped yet</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onRefresh && onRefresh()}
          className="text-[11px] px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 mb-2">Error: {error}</p>
      )}

      {loading && (
        <p className="text-sm text-slate-600">Loading wrapping data…</p>
      )}

      {!loading && totalGifts === 0 && (
        <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          All purchased gifts are wrapped. 🎁 You’re good to go!
        </p>
      )}

      {!loading && totalGifts > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">
            Total unwrapped purchased gifts:{" "}
            <span className="font-semibold">{totalGifts}</span>
          </p>

          {groups.map((group) => (
            <div
              key={group.personId}
              className="border border-slate-200 rounded-xl bg-white px-4 py-3"
            >
              <p className="text-sm font-semibold mb-1">
                {group.personName}
              </p>
              <ul className="space-y-2">
                {group.gifts.map((gift) => (
                  <li
                    key={gift.id}
                    className="flex items-center justify-between text-sm border border-dashed border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {gift.description}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Price: ${gift.price.toFixed(2)}
                      </p>
                      {gift.notes && (
                        <p className="text-[11px] text-slate-500">
                          Notes: {gift.notes}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-[11px] px-3 py-1 rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
                      onClick={async () => {
                        await markGiftWrapped(gift.id);
                        if (onGiftWrapped) {
                          await onGiftWrapped();
                        }
                      }}
                    >
                      Mark wrapped
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
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

function AcceptInviteScreen({
  token,
  onDone,
}: {
  token: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string>("");

  const accept = async () => {
    setStatus("loading");
    setMessage("");

    const { data, error } = await supabase.rpc("accept_household_invite", {
      p_token: token,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage("Invite accepted! Redirecting…");
    setTimeout(() => onDone(), 800);
  };

  useEffect(() => {
    accept();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white shadow-md rounded-2xl p-6 max-w-md w-full">
        <h1 className="text-lg font-semibold mb-2">Household Invite</h1>
        {status === "loading" && (
          <p className="text-sm text-slate-600">Accepting invite…</p>
        )}
        {status === "success" && (
          <p className="text-sm text-emerald-700">{message}</p>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-red-600 mb-3">Error: {message}</p>
            <button
              className="text-sm px-3 py-2 rounded-md bg-slate-900 text-white"
              onClick={() => onDone()}
            >
              Go back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InviteForm({ onCreate }: { onCreate: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      await onCreate(trimmed);
      setEmail("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to create invite");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-2 items-start md:items-end">
      <div className="flex-1 w-full">
        <label className="block text-xs font-medium mb-1">Invite by email</label>
        <input
          className="w-full border rounded-md px-3 py-2 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="spouse@example.com"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create invite (copy link)"}
      </button>
    </form>
  );
}

export default App;
