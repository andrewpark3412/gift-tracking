import { useEffect, useState } from "react";
import { usePWAInstallPrompt } from "../../hooks/usePWAInstallPrompt";

export function InstallBanner() {
  const { isInstallable, isStandalone, promptInstall } =
    usePWAInstallPrompt();

  const [delayPassed, setDelayPassed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedFlag =
      window.localStorage.getItem("gt_install_banner_dismissed") === "1";
    setDismissed(dismissedFlag);

    const timer = setTimeout(() => {
      setDelayPassed(true);
      console.log("[PWA] InstallBanner delay passed");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log(
      "[PWA] banner state ->",
      "delayPassed:",
      delayPassed,
      "dismissed:",
      dismissed,
      "isStandalone:",
      isStandalone,
      "isInstallable:",
      isInstallable
    );
  }, [delayPassed, dismissed, isStandalone, isInstallable]);

  if (!delayPassed || dismissed || isStandalone) {
    return null;
  }

  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem("gt_install_banner_dismissed", "1");
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed bottom-3 inset-x-0 px-4 z-40 pointer-events-none">
      <div className="pointer-events-auto max-w-xl mx-auto bg-slate-900 text-white rounded-2xl shadow-lg p-3 flex items-center gap-3">
        <div className="flex-1 text-xs">
          {isInstallable ? (
            <>
              <p className="font-semibold text-sm mb-0.5">
                Install Christmas Gift Tracker
              </p>
              <p className="opacity-80">
                Add this app to your home screen for quick access and a
                full-screen experience.
              </p>
            </>
          ) : isIOS ? (
            <>
              <p className="font-semibold text-sm mb-0.5">
                Add Gift Tracker to Home Screen
              </p>
              <p className="opacity-80">
                Tap the <span className="font-semibold">Share</span> button
                in Safari, then choose{" "}
                <span className="font-semibold">Add to Home Screen</span>.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-sm mb-0.5">
                Install Christmas Gift Tracker
              </p>
              <p className="opacity-80">
                In your browser menu, choose{" "}
                <span className="font-semibold">
                  &ldquo;Install app&rdquo; / &ldquo;Add to Home screen&rdquo;
                </span>{" "}
                to pin this app for quick access.
              </p>
            </>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {isInstallable && (
            <button
              type="button"
              onClick={promptInstall}
              className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-400"
            >
              Install
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-1 rounded-full border border-slate-500 text-slate-200 text-[10px] hover:bg-slate-800"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
