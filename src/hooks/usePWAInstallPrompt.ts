// src/hooks/usePWAInstallPrompt.ts
import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
};

export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari exposes navigator.standalone
        (navigator as any).standalone === true;

      setIsStandalone(standalone);
    };

    checkStandalone();

    const mq = window.matchMedia("(display-mode: standalone)");
    const mqListener = () => checkStandalone();

    // Support both modern addEventListener and legacy addListener
    if ("addEventListener" in mq) {
      (mq as any).addEventListener("change", mqListener);
    } else if ("addListener" in mq) {
      (mq as any).addListener(mqListener);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const bip = e as BeforeInstallPromptEvent;
      setDeferredPrompt(bip);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Debug: log SW registrations + manifest link
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => console.log("[PWA] SW registrations:", regs))
        .catch((err) => console.log("[PWA] SW getRegistrations error:", err));
    } else {
      console.log("[PWA] navigator.serviceWorker not supported");
    }

    const manifestLink = document.querySelector('link[rel="manifest"]');
    console.log("[PWA] manifest link:", manifestLink);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if ("removeEventListener" in mq) {
        (mq as any).removeEventListener("change", mqListener);
      } else if ("removeListener" in mq) {
        (mq as any).removeListener(mqListener);
      }
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log("[PWA] No deferredPrompt, cannot prompt");
      return;
    }

    console.log("[PWA] Calling prompt()");
    await deferredPrompt.prompt();

    deferredPrompt.userChoice.then((result) => {
      console.log("[PWA] userChoice:", result);
    });
  }, [deferredPrompt]);

  return {
    isInstallable,
    isStandalone,
    promptInstall,
  };
}
