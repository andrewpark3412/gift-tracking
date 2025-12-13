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
      <div className="max-w-4xl mx-auto px-4 py-3">
        {/* Top row: logo + title + sign out */}
        <div className="flex items-center justify-between gap-3 mb-2 md:mb-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-emerald-500/20 border border-emerald-500/40 shrink-0">
              <span className="text-lg md:text-xl">🎄</span>
            </div>
            <h1 className="text-sm md:text-base font-semibold text-slate-50 truncate">
              Christmas Gift Tracker
            </h1>
          </div>
          <button
            onClick={onSignOut}
            className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800 shrink-0 cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <span className="text-lg">🚪</span>
          </button>
        </div>

        {/* Bottom row: household switcher + wrapping mode (mobile gets full width) */}
        <div className="flex items-center gap-2 md:gap-3 md:justify-end">
          {!isWrappingMode && selectedListId && onEnterWrappingMode && (
            <button
              onClick={onEnterWrappingMode}
              className="px-2.5 py-1.5 md:px-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-sm shrink-0 cursor-pointer"
            >
              🎁 <span className="hidden sm:inline">Wrapping Mode</span>
            </button>
          )}
          <HouseholdSwitcher
            households={households}
            activeHouseholdId={activeHouseholdId}
            onSwitchHousehold={onSwitchHousehold}
            onCreateHousehold={onCreateHousehold}
          />
        </div>
      </div>
    </header>
  );
}
