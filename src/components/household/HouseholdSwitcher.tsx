import { useState, useRef, useEffect } from "react";
import type { Household } from "../../types";

type HouseholdMembership = {
  household: Household;
  role: "owner" | "admin" | "member";
};

type HouseholdSwitcherProps = {
  households: HouseholdMembership[];
  activeHouseholdId: string | null;
  onSwitchHousehold: (householdId: string) => void;
  onCreateHousehold: () => void;
};

export function HouseholdSwitcher({
  households,
  activeHouseholdId,
  onSwitchHousehold,
  onCreateHousehold,
}: HouseholdSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeHousehold = households.find(
    (m) => m.household.id === activeHouseholdId
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (households.length === 0) {
    return null;
  }

  return (
    <div className="relative flex-1 md:flex-initial" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/30 transition-colors w-full md:w-auto text-xs md:text-sm cursor-pointer"
        aria-label="Switch household"
      >
        <span className="text-lg md:text-xl shrink-0">🏠</span>
        <span className="font-medium text-slate-100 truncate max-w-[120px] sm:max-w-[200px]">
          {activeHousehold?.household.name || "Select Household"}
        </span>
        <svg
          className={`w-3 h-3 md:w-4 md:h-4 text-slate-400 transition-transform shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-600/30 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Households list */}
          <div className="py-1">
            {households.map((membership) => {
              const isActive = membership.household.id === activeHouseholdId;
              return (
                <button
                  key={membership.household.id}
                  onClick={() => {
                    onSwitchHousehold(membership.household.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors flex items-center justify-between ${
                    isActive ? "bg-slate-700/30" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-100 truncate">
                      {membership.household.name}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {membership.role}
                    </div>
                  </div>
                  {isActive && (
                    <svg
                      className="w-5 h-5 text-emerald-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-600/30" />

          {/* Create new household */}
          <div className="py-1">
            <button
              onClick={() => {
                onCreateHousehold();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-700/50 transition-colors flex items-center gap-2 text-emerald-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="font-medium">Create New Household</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
