import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Person, Gift } from "../../types";

interface PersonRowProps {
  person: Person;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCompleted: () => Promise<void>;
  onUpdate: (updates: { name: string; budget: number | null }) => Promise<void>;
  onDelete: () => Promise<void>;
  gifts?: Gift[];
  onOpenGift?: (gift: Gift) => void;
}

export function PersonRow({
  person,
  isSelected,
  onSelect,
  onToggleCompleted,
  onUpdate,
  onDelete,
  gifts = [],
  onOpenGift,
}: PersonRowProps) {
  const completed = person.is_manually_completed;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const [editBudget, setEditBudget] = useState(person.budget?.toString() || "");
  const [showEditModal, setShowEditModal] = useState(false);

  if (isEditing) {
    return (
      <li
        className={`border rounded-xl px-4 py-3 transition-colors ${
          isSelected
            ? "bg-emerald-50 border-emerald-300"
            : "bg-white border-slate-200"
        } ${completed ? "border-l-4 border-l-emerald-500" : ""}`}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Budget</label>
              <input
                type="number"
                step="0.01"
                placeholder="Optional"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
              onClick={async () => {
                if (!editName.trim()) return;
                const budget = editBudget.trim() ? parseFloat(editBudget) : null;
                await onUpdate({
                  name: editName.trim(),
                  budget: budget !== null && !isNaN(budget) ? budget : null,
                });
                setIsEditing(false);
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="text-xs px-3 py-1.5 border rounded-md hover:bg-slate-100 cursor-pointer"
              onClick={() => {
                setEditName(person.name);
                setEditBudget(person.budget?.toString() || "");
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPortalRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideTrigger = menuRef.current && menuRef.current.contains(target);
      const clickedInsidePortal = menuPortalRef.current && menuPortalRef.current.contains(target);
      if (!clickedInsideTrigger && !clickedInsidePortal) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    const mq = window.matchMedia("(max-width: 640px)");
    const onMqChange = () => setIsSmallScreen(mq.matches);
    setIsSmallScreen(mq.matches);
    mq.addEventListener("change", onMqChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      mq.removeEventListener("change", onMqChange);
    };
  }, [menuOpen]);

  // compute portal dropdown position when opening (desktop only)
  useEffect(() => {
    if (!menuOpen) {
      setMenuStyle(null);
      return;
    }
    if (isSmallScreen) return;
    const trigger = menuRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 8; // small gap

    // measure the portaled dropdown after it's rendered so we can right-align
    requestAnimationFrame(() => {
      const dd = dropdownRef.current;
      if (!dd) {
        const left = rect.left + window.scrollX;
        setMenuStyle({ position: "absolute", left: `${left}px`, top: `${top}px`, zIndex: 9999 });
        return;
      }
      const menuRect = dd.getBoundingClientRect();
      const width = menuRect.width || 160; // fallback to 160px if not measurable
      const left = rect.right + window.scrollX - width;
      const safeLeft = Math.max(8, left);
      setMenuStyle({ position: "absolute", left: `${safeLeft}px`, top: `${top}px`, zIndex: 9999 });
    });
  }, [menuOpen, isSmallScreen]);

  return (
    <li
      className={`relative border rounded-xl px-4 py-3 transition-colors ${
        isSelected
          ? "bg-emerald-50 border-emerald-300"
          : "bg-white border-slate-200"
      } ${completed ? "border-l-4 border-l-emerald-500" : ""}`}
    >
      <div className="w-full flex items-start justify-between">
        <div>
          <p className="font-medium flex items-center gap-2">
            <button
              type="button"
              onClick={onSelect}
              className="underline-offset-2 hover:underline cursor-pointer"
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
            Budget: {person.budget != null ? (
              <span className="font-medium">${person.budget.toFixed(2)}</span>
            ) : (
              <span className="italic text-slate-400">No budget set</span>
            )}
          </p>
        </div>

        <div ref={menuRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              // prevent focus jump and ensure our handler runs before global mousedown
              e.preventDefault();
              setMenuOpen((s) => !s);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
            title="Actions"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 6v.01M12 12v.01M12 18v.01" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full mt-2">
        {(!gifts || gifts.length === 0) && (
          <p className="text-[11px] text-slate-400">No gifts yet</p>
        )}

        {gifts && gifts.length > 0 && (
          <ul className="space-y-1 w-full">
            {(expanded ? gifts : gifts.slice(0, 5)).map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between w-full text-[13px] text-slate-700 bg-slate-50 px-2 py-1 rounded-md"
              >
                <button
                  type="button"
                  onClick={() => onOpenGift?.(g)}
                  className="text-left truncate flex-1"
                  title={`${g.description} — $${Number(g.price).toFixed(2)}`}
                >
                  <span className="truncate">{g.description}</span>
                </button>
                <div className="ml-4 flex items-center gap-2 shrink-0">
                  <span className="text-slate-500">${Number(g.price).toFixed(2)}</span>
                  {g.is_wrapped && <span title="Wrapped">🎁</span>}
                  <button
                    type="button"
                    onClick={() => onOpenGift?.(g)}
                    className="text-[11px] px-2 py-0.5 border rounded-md hover:bg-slate-100 whitespace-nowrap cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </li>
            ))}

            {gifts.length > 5 && !expanded && (
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  title={`Show ${gifts.length - 5} more gifts`}
                  className="text-[12px] text-slate-500 hover:underline cursor-pointer"
                >
                  {`+${gifts.length - 5} more`}
                </button>
              </li>
            )}
            {expanded && gifts.length > 5 && (
              <li>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  title="Collapse gifts"
                  className="text-[12px] text-slate-500 hover:underline cursor-pointer"
                >
                  Collapse
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Menu UI (desktop dropdown or mobile sheet) rendered in a portal */}
      {typeof document !== "undefined" && menuOpen && createPortal(
        <div ref={menuPortalRef}>
          {isSmallScreen ? (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
              <div className="absolute left-0 right-0 bottom-0 bg-white border-t border-slate-200 rounded-t-xl shadow-xl p-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(true);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-slate-50 cursor-pointer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onToggleCompleted();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-slate-50 cursor-pointer"
                >
                  {completed ? "Mark Incomplete" : "Mark Completed"}
                </button>
                <div className="border-t border-slate-100 my-2" />
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-red-50 text-red-600 cursor-pointer"
                >
                  Delete
                </button>
                <div className="mt-3">
                  <button type="button" onClick={() => setMenuOpen(false)} className="w-full px-3 py-2 border rounded-md cursor-pointer">Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <div ref={dropdownRef} style={menuStyle ?? undefined} className="mt-2 w-40 bg-white border border-slate-200 rounded-md shadow-md overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(true);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onToggleCompleted();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                {completed ? "Mark Incomplete" : "Mark Completed"}
              </button>
              <div className="border-t border-slate-100" />
              <button
                type="button"
                onClick={async () => {
                  await onDelete();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Person edit modal (portal) */}
      {typeof document !== "undefined" && showEditModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-10">
            <h3 className="text-lg font-medium mb-3">Edit Person</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Budget</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                  onClick={async () => {
                    if (!editName.trim()) return;
                    const budget = editBudget.trim() ? parseFloat(editBudget) : null;
                    await onUpdate({ name: editName.trim(), budget: budget !== null && !isNaN(budget) ? budget : null });
                    setShowEditModal(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="text-sm px-3 py-2 border rounded-md hover:bg-slate-100 cursor-pointer"
                  onClick={() => {
                    setEditName(person.name);
                    setEditBudget(person.budget?.toString() || "");
                    setShowEditModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </li>
  );
}

