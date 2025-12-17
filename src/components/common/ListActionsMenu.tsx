import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ListVisibility } from "../../types";
import ActionButton from "./ActionButton";
import IconActionButton from "./IconActionButton";

export default function ListActionsMenu({
  onEdit,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  visibility,
}: {
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  visibility: ListVisibility;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isSmall, setIsSmall] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsSmall(mq.matches);
    setIsSmall(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (portalRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    if (!open || isSmall) return;
    const trig = triggerRef.current;
    if (!trig) return;
    const rect = trig.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 6;
    requestAnimationFrame(() => {
      const dd = dropdownRef.current;
      const width = dd?.getBoundingClientRect().width || 160;
      const left = rect.right + window.scrollX - width;
      const safeLeft = Math.max(8, left);
      setStyle({ position: "absolute", left: `${safeLeft}px`, top: `${top}px`, zIndex: 9999 });
    });
  }, [open, isSmall]);

  return (
    <div ref={triggerRef} className="inline-block">
      <IconActionButton
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          setOpen((s) => !s);
        }}
        title="Actions"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 6v.01M12 12v.01M12 18v.01" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </IconActionButton>

      {typeof document !== "undefined" && open &&
        createPortal(
          <div ref={portalRef}>
            {isSmall ? (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
                <div className="absolute left-0 right-0 bottom-0 bg-white border-t rounded-t-xl shadow-xl p-4">
                  <ActionButton onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-3 py-3 hover:bg-slate-50">Edit</ActionButton>
                  <ActionButton onClick={() => { onToggleVisibility(); setOpen(false); }} className="w-full text-left px-3 py-3 hover:bg-slate-50">{visibility === 'household' ? 'Make Private' : 'Make Household'}</ActionButton>
                  <ActionButton onClick={() => { onDuplicate(); setOpen(false); }} className="w-full text-left px-3 py-3 hover:bg-slate-50">Duplicate</ActionButton>
                  <div className="border-t my-2" />
                  <ActionButton onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-3 py-3 hover:bg-red-50 text-red-600">Delete</ActionButton>
                </div>
              </div>
            ) : (
              <div ref={dropdownRef} style={style ?? undefined} className="mt-2 w-40 bg-white border rounded-md shadow-md overflow-hidden">
                <ActionButton onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50">Edit</ActionButton>
                <ActionButton onClick={() => { onToggleVisibility(); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50">{visibility === 'household' ? 'Make Private' : 'Make Household'}</ActionButton>
                <div className="border-t" />
                <ActionButton onClick={() => { onDuplicate(); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-slate-50">Duplicate</ActionButton>
                <div className="border-t" />
                <ActionButton onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600">Delete</ActionButton>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
