export function EnvBadge() {
  const mode = import.meta.env.MODE;

  if (mode === "production") return null;

  const label = mode.toUpperCase();
  const colorClass =
    mode === "development" ? "bg-amber-500" : "bg-sky-500";

  return (
    <div className={`fixed top-2 right-2 z-50 px-2 py-1 text-[10px] rounded-full ${colorClass} text-white shadow`}>
      {label}
    </div>
  );
}
