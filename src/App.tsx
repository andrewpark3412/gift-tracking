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
import { CreateHouseholdScreen } from "./components/household/CreateHouseholdScreen";
import { CreateHouseholdModal } from "./components/household/CreateHouseholdModal";
import { AcceptInviteScreen } from "./components/household/AcceptInviteScreen";
import { HouseholdSettingsSection } from "./components/household/HouseholdSettingsSection";
import { ListsSection } from "./components/lists/ListsSection";
import { PeopleSection } from "./components/people/PeopleSection";
import { GiftsSection } from "./components/gifts/GiftsSection";
import { WrappingDashboard } from "./components/wrapping/WrappingDashboard";

import type {
  List,
  ListVisibility,
  Person,
} from "./types";

function App() {
  const { userId, sessionChecked } = useAuthSession();

  const [viewMode, setViewMode] = useState<"people" | "wrapping">("people");
  const [showCreateHouseholdModal, setShowCreateHouseholdModal] = useState(false);

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
  
  // Reset state when switching households
  useEffect(() => {
    setSelectedListId(null);
    setSelectedList(null);
    setSelectedPersonId(null);
    setSelectedPerson(null);
    setViewMode("people");
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
    setViewMode("people");
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
      <Header 
        households={households}
        activeHouseholdId={activeHouseholdId}
        onSwitchHousehold={handleSwitchHousehold}
        onCreateHousehold={() => setShowCreateHouseholdModal(true)}
        onSignOut={handleSignOut} 
      />

      <CreateHouseholdModal
        isOpen={showCreateHouseholdModal}
        onClose={() => setShowCreateHouseholdModal(false)}
        onCreateHousehold={handleCreateNewHousehold}
        error={householdError}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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
          onRefresh={refreshLists}
        />

        {selectedList && (
          <PeopleSection
            list={selectedList}
            people={people}
            loading={peopleLoading}
            error={peopleError}
            selectedPersonId={selectedPersonId}
            viewMode={viewMode}
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
            onSetViewMode={setViewMode}
            onRefresh={async () => {
              await refreshPeople();
              await refreshListTotals();
              await refreshWrapping();
            }}
          />
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

        {viewMode === "people" && selectedPerson && (
          <GiftsSection
            key={selectedPerson.id}
            person={selectedPerson}
            onTotalsChanged={refreshListTotals}
          />
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
    </div>
  );
}

export default App;
