import type { Household } from "../../types";

interface HeaderProps {
  household: Household | null;
  onSignOut: () => Promise<void>;
}

export function Header({ household, onSignOut }: HeaderProps) {
  return (
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
            {household && (
              <p className="text-[11px] text-slate-400">
                Household: <span className="font-medium">{household.name}</span>
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-600 text-slate-200 hover:bg-slate-800"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
