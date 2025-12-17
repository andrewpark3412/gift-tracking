import React from "react";
import ActionButton from "./ActionButton";

export default function IconActionButton({
  children,
  onClick,
  title,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
  title?: string;
  className?: string;
}) {
  // standardized trigger styles for small icon actions
  const base = "h-8 w-8 flex items-center justify-center rounded-md border hover:bg-slate-100";
  return (
    <ActionButton onClick={onClick} title={title} className={`${base} ${className}`}>
      {children}
    </ActionButton>
  );
}
