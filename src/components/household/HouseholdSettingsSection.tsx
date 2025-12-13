import { supabase } from "../../lib/supabaseClient";
import { InviteForm } from "./InviteForm";
import type { HouseholdInvite } from "../../types";
import type { HouseholdMemberRow } from "../../hooks/useHouseholdMembers";

interface HouseholdSettingsSectionProps {
  invites: HouseholdInvite[];
  invitesLoading: boolean;
  invitesError: string | null;
  members: HouseholdMemberRow[];
  membersLoading: boolean;
  membersError: string | null;
  currentUserId: string | null;
  onCreateInvite: (email: string) => Promise<HouseholdInvite>;
  onRevokeInvite: (id: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveHousehold: () => Promise<void>;
  onRefreshInvites: () => Promise<void>;
  onRefreshMembers: () => Promise<void>;
}

export function HouseholdSettingsSection({
  invites,
  invitesLoading,
  invitesError,
  members,
  membersLoading,
  membersError,
  currentUserId,
  onCreateInvite,
  onRevokeInvite,
  onRemoveMember,
  onLeaveHousehold,
  onRefreshInvites,
  onRefreshMembers,
}: HouseholdSettingsSectionProps) {
  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Household</h2>
        <button
          onClick={onRefreshInvites}
          className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-slate-100 cursor-pointer"
          title="Refresh"
          aria-label="Refresh invites"
        >
          <span className="text-base">🔄</span>
        </button>
      </div>

      <InviteForm
        onCreate={async (email) => {
          const inv = await onCreateInvite(email);
          const link = `${window.location.origin}?invite=${inv.token}`;
          await navigator.clipboard.writeText(link);
          alert(`Invite link copied!\n\n${link}`);
        }}
      />

      {invitesError && <p className="text-xs text-red-600 mt-2">Error: {invitesError}</p>}

      <div className="mt-4">
        <p className="text-sm font-semibold mb-2">Pending invites</p>
        {invitesLoading && <p className="text-sm text-slate-600">Loading…</p>}
        {!invitesLoading && pendingInvites.length === 0 && (
          <p className="text-sm text-slate-600">No pending invites.</p>
        )}

        <ul className="space-y-2">
          {pendingInvites.map((i) => {
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
                        await onRevokeInvite(i.id);
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
            onClick={onRefreshMembers}
            className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-slate-100 cursor-pointer"
            title="Refresh"
            aria-label="Refresh members"
          >
            <span className="text-base">🔄</span>
          </button>
        </div>

        {membersError && <p className="text-xs text-red-600 mb-2">Error: {membersError}</p>}
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
                        await onLeaveHousehold();
                        window.location.reload();
                      }
                      return;
                    }

                    if (confirm(`Remove ${m.email ?? "this user"} from the household?`)) {
                      await onRemoveMember(m.user_id);
                    }
                  }}
                >
                  {m.user_id === currentUserId ? "Leave" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
