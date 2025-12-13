export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-md rounded-xl p-8 max-w-md w-full">
        <p className="text-center text-slate-600">Checking session…</p>
      </div>
    </div>
  );
}
