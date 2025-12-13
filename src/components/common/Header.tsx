import type { Household } from "../../types";
import { HouseholdSwitcher } from "../household/HouseholdSwitcher";

type HouseholdMembership = {
  household: Household;
  role: "owner" | "admin" | "member";
};

interface HeaderProps {
  households: HouseholdMembership[];
  activeHouseholdId: string | null;
  onSwitchHousehold: (householdId: string) => void;
  onCreateHousehold: () => void;
  onSignOut: () => Promise<void>;
  onEnterWrappingMode?: () => void;
  isWrappingMode?: boolean;
  selectedListId?: string | null;
}

export function Header({
  households,
  activeHouseholdId,
  onSwitchHousehold,
  onCreateHousehold,
  onSignOut,
  onEnterWrappingMode,
  isWrappingMode,
  selectedListId,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40">
            <span className="text-xl">🎄</span>
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-50">
              Christmas Gift Tracker
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isWrappingMode && selectedListId && onEnterWrappingMode && (
            <button
              onClick={onEnterWrappingMode}
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm"
            >
              🎁 Wrapping Mode
            </button>
          )}
          <HouseholdSwitcher
            households={households}
            activeHouseholdId={activeHouseholdId}
            onSwitchHousehold={onSwitchHousehold}
            onCreateHousehold={onCreateHousehold}
          />
          <button
            onClick={onSignOut}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
