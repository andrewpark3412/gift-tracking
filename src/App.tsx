import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import { useAuthSession } from "./hooks/useAuthSession";
import { useHouseholds } from "./hooks/useHouseholds";
import { useCurrentHousehold } from "./hooks/useCurrentHousehold";
import { useHouseholdInvites } from "./hooks/useHouseholdInvites";
import { useHouseholdMembers } from "./hooks/useHouseholdMembers";
import { useLists } from "./hooks/useLists";
import { useListTotals } from "./hooks/useListTotals";
import { usePeople } from "./hooks/usePeople";
import { useWrappingDashboard } from "./hooks/useWrappingDashboard";

import { AuthScreen } from "./components/auth/AuthScreen";
import { LoadingScreen } from "./components/common/LoadingScreen";
import { Header } from "./components/common/Header";
import { EnvBadge } from "./components/common/EnvBadge";
import { InstallBanner } from "./components/common/InstallBanner";
import { UpdatePrompt } from "./components/common/UpdatePrompt";
import { CreateHouseholdScreen } from "./components/household/CreateHouseholdScreen";
import { CreateHouseholdModal } from "./components/household/CreateHouseholdModal";
import { AcceptInviteScreen } from "./components/household/AcceptInviteScreen";
import { HouseholdSettingsSection } from "./components/household/HouseholdSettingsSection";
import { ListsSection } from "./components/lists/ListsSection";
import { PeopleSection } from "./components/people/PeopleSection";
import { GiftsSection } from "./components/gifts/GiftsSection";
import { WrappingNightMode } from "./components/wrapping/WrappingNightMode";

import type {
  List,
  ListVisibility,
  Person,
} from "./types";

function App() {
  const { userId, sessionChecked } = useAuthSession();

  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false);
  const [isWrappingNightMode, setIsWrappingNightMode] = useState(false);

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<"lists" | "people" | "gifts">("lists");
  const [isMobile, setIsMobile] = useState(false);

  // Track screen size for mobile layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const inviteToken = new URLSearchParams(window.location.search).get("invite");

  // Multi-household management
  const {
    households,
    activeHouseholdId,
    loading: householdsLoading,
    error: householdsError,
    setActiveHousehold,
    refresh: refreshHouseholds,
  } = useHouseholds(userId);

  // Current household details
  const {
    loading: householdLoading,
    error: householdError,
    currentHousehold,
    createHousehold,
  } = useCurrentHousehold(activeHouseholdId);

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

  // Reset state when switching households
  useEffect(() => {
    setSelectedListId(null);
    setSelectedList(null);
    setSelectedPersonId(null);
    setSelectedPerson(null);
    setMobileView("lists");
  }, [activeHouseholdId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSwitchHousehold = (householdId: string) => {
    setActiveHousehold(householdId);
  };

  const handleCreateNewHousehold = async (name: string) => {
    if (!userId) return;

    const newHousehold = await createHousehold(name, userId);
    if (newHousehold) {
      await refreshHouseholds();
      setActiveHousehold(newHousehold.id);
    }
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

    setSelectedListId(newList.id);
    setSelectedList(newList);
    setSelectedPersonId(null);
    setSelectedPerson(null);
  };

  const handleSelectList = (list: List) => {
    setSelectedListId(list.id);
    setSelectedList(list);
    setSelectedPersonId(null);
    setSelectedPerson(null);
    setMobileView("people");
  };

  const handleUpdateList = async (id: string, updates: { name: string; year: number; visibility: ListVisibility }) => {
    await updateList(id, updates);
    if (selectedListId === id) {
      // Update the selectedList state to reflect the changes
      const updated = lists.find((l) => l.id === id);
      if (updated) {
        setSelectedList({ ...updated, ...updates });
      }
    }
  };

  const handleDeleteList = async (id: string) => {
    await deleteList(id);
    if (selectedListId === id) {
      setSelectedListId(null);
      setSelectedList(null);
      setSelectedPersonId(null);
      setSelectedPerson(null);
    }
  };

  // Session check
  if (!sessionChecked) {
    return <LoadingScreen />;
  }

  // Not logged in
  if (!userId) {
    return <AuthScreen />;
  }

  // Logged in but no households at all
  if (!householdsLoading && households.length === 0) {
    return (
      <CreateHouseholdScreen
        onCreateHousehold={async (name) => {
          await handleCreateNewHousehold(name);
        }}
        onSignOut={handleSignOut}
        householdError={householdError || householdsError}
      />
    );
  }

  // Loading households
  if (householdsLoading || householdLoading) {
    return <LoadingScreen />;
  }

  // If user has an invite token in URL, show accept flow
  if (inviteToken) {
    return (
      <AcceptInviteScreen
        token={inviteToken}
        onDone={async (newHouseholdId) => {
          window.history.replaceState({}, "", window.location.pathname);

          // Refresh households and switch to the new one
          await refreshHouseholds();
          if (newHouseholdId) {
            setActiveHousehold(newHouseholdId);
          }

          // Force a small delay to ensure state updates
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }}
      />
    );
  }

  // Logged in with a household → main UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-slate-900">
      {isWrappingNightMode && selectedList ? (
        <WrappingNightMode
          groups={wrappingGroups}
          loading={wrappingLoading}
          error={wrappingError}
          selectedListName={selectedList.name}
          markGiftWrapped={markGiftWrapped}
          onExit={() => setIsWrappingNightMode(false)}
          onGiftWrapped={async () => {
            await refreshListTotals();
          }}
        />
      ) : (
        <>
          <Header
            households={households}
            activeHouseholdId={activeHouseholdId}
            onSwitchHousehold={handleSwitchHousehold}
            onCreateHousehold={() => setShowCreateHouseholdModal(true)}
            onSignOut={handleSignOut}
            onEnterWrappingMode={() => setIsWrappingNightMode(true)}
            isWrappingMode={isWrappingNightMode}
            selectedListId={selectedListId}
          />

      <CreateHouseholdModal
        isOpen={showCreateHouseholdModal}
        onClose={() => setShowCreateHouseholdModal(false)}
        onCreateHousehold={handleCreateNewHousehold}
        error={householdError}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Mobile: Show only lists view */}
        {isMobile && mobileView === "lists" && (
          <ListsSection
            lists={lists}
            loading={listsLoading}
            error={listsError}
            selectedListId={selectedListId}
            onSelectList={handleSelectList}
            onCreateList={createList}
            onToggleVisibility={handleToggleVisibility}
            onDuplicateList={handleDuplicateList}
            onDeleteList={handleDeleteList}
            onUpdateList={handleUpdateList}
            onRefresh={refreshLists}
          />
        )}

        {/* Mobile: Show only people view */}
        {isMobile && mobileView === "people" && selectedList && (
          <PeopleSection
            list={selectedList}
            people={people}
            loading={peopleLoading}
            error={peopleError}
            selectedPersonId={selectedPersonId}
            listTotals={selectedListTotals}
            listTotalsLoading={listTotalsLoading}
            listTotalsError={listTotalsError}
            onSelectPerson={(person) => {
              setSelectedPersonId(person.id);
              setSelectedPerson(person);
              setMobileView("gifts");
            }}
            onAddPerson={handleCreatePerson}
            onUpdatePerson={handleUpdatePerson}
            onDeletePerson={handleDeletePerson}
            onRefresh={async () => {
              await refreshPeople();
              await refreshListTotals();
            }}
            onBack={() => setMobileView("lists")}
          />
        )}

        {/* Mobile: Show only gifts view */}
        {isMobile && mobileView === "gifts" && selectedPerson && (
          <GiftsSection
            key={selectedPerson.id}
            person={selectedPerson}
            onTotalsChanged={refreshListTotals}
            onBack={() => setMobileView("people")}
          />
        )}

        {/* Desktop: Show lists always */}
        {!isMobile && (
          <ListsSection
            lists={lists}
            loading={listsLoading}
            error={listsError}
            selectedListId={selectedListId}
            onSelectList={handleSelectList}
            onCreateList={createList}
            onToggleVisibility={handleToggleVisibility}
            onDuplicateList={handleDuplicateList}
            onDeleteList={handleDeleteList}
            onUpdateList={handleUpdateList}
            onRefresh={refreshLists}
          />
        )}

        {/* Desktop: Show side-by-side people and gifts */}
        {!isMobile && selectedList && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="lg:sticky lg:top-6">
              <PeopleSection
                list={selectedList}
                people={people}
                loading={peopleLoading}
                error={peopleError}
                selectedPersonId={selectedPersonId}
                listTotals={selectedListTotals}
                listTotalsLoading={listTotalsLoading}
                listTotalsError={listTotalsError}
                onSelectPerson={(person) => {
                  setSelectedPersonId(person.id);
                  setSelectedPerson(person);
                }}
                onAddPerson={handleCreatePerson}
                onUpdatePerson={handleUpdatePerson}
                onDeletePerson={handleDeletePerson}
                onRefresh={async () => {
                  await refreshPeople();
                  await refreshListTotals();
                }}
              />
            </div>

            {selectedPerson && (
              <div>
                <GiftsSection
                  key={selectedPerson.id}
                  person={selectedPerson}
                  onTotalsChanged={refreshListTotals}
                />
              </div>
            )}

            {!selectedPerson && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center text-slate-500">
                <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Select a person to manage their gifts</p>
              </div>
            )}
          </div>
        )}

        <HouseholdSettingsSection
          invites={invites}
          invitesLoading={invitesLoading}
          invitesError={invitesError}
          members={members}
          membersLoading={membersLoading}
          membersError={membersError}
          currentUserId={userId}
          onCreateInvite={createInvite}
          onRevokeInvite={revokeInvite}
          onRemoveMember={removeMember}
          onLeaveHousehold={leaveHousehold}
          onRefreshInvites={refreshInvites}
          onRefreshMembers={refreshMembers}
        />
      </main>
      <EnvBadge />
      <InstallBanner />
      <UpdatePrompt />
        </>
      )}
    </div>
  );
}

export default App;
