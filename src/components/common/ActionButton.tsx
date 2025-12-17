import React from "react";

export default function ActionButton({
  children,
  className = "",
  type = "button",
  onClick,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent) => void | Promise<void>;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      className={`${className} cursor-pointer`}
    >
      {children}
    </button>
  );
}
