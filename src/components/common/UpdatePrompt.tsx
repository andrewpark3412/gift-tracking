import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      // Check for updates every hour
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error: Error) {
      console.error("SW registration error", error);
    },
  });

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (needRefresh || offlineReady) {
      setShowPrompt(true);
    }
  }, [needRefresh, offlineReady]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
  };

  const reload = async () => {
    await updateServiceWorker(true);
    // Force reload to ensure new version is used
    window.location.reload();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-emerald-600 text-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        {needRefresh ? (
          <>
            <div className="flex-1">
              <p className="font-medium text-sm">🎁 Update Available!</p>
              <p className="text-xs text-emerald-100 mt-0.5">
                A new version of the app is ready.
              </p>
            </div>
            <button
              onClick={reload}
              className="px-4 py-2 bg-white text-emerald-600 rounded-md text-sm font-medium hover:bg-emerald-50 transition-colors whitespace-nowrap"
            >
              Reload
            </button>
            <button
              onClick={close}
              className="text-emerald-100 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <p className="font-medium text-sm">✅ Ready for Offline Use</p>
              <p className="text-xs text-emerald-100 mt-0.5">
                App is cached and ready to work offline.
              </p>
            </div>
            <button
              onClick={close}
              className="text-emerald-100 hover:text-white transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </>
        )}
      </div>
    </div>
  );
}
