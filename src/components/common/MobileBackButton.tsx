interface MobileBackButtonProps {
  onClick: () => void;
  label: string;
}

export function MobileBackButton({ onClick, label }: MobileBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-3 -mt-1"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}
