import { useEffect, useState } from "react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { offlineQueue } from "../../lib/offlineQueue";

export function NetworkStatus() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Update queue length
    const updateQueueLength = () => {
      setQueueLength(offlineQueue.getQueueLength());
    };

    updateQueueLength();

    // Listen for queue changes
    const handleQueueCleared = () => {
      setQueueLength(0);
      setSyncing(false);
    };

    window.addEventListener("offline-queue-cleared", handleQueueCleared);

    // Check queue length periodically when offline
    const interval = setInterval(updateQueueLength, 1000);

    return () => {
      window.removeEventListener("offline-queue-cleared", handleQueueCleared);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      setSyncing(queueLength > 0);
      
      // Trigger queue processing
      if (queueLength > 0) {
        offlineQueue.processQueue();
      }

      // Hide reconnected message after 4 seconds
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, queueLength]);

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
          </svg>
          <span>You're offline</span>
          {queueLength > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-600 text-white ml-2">
              {queueLength} pending {queueLength === 1 ? "change" : "changes"}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Show reconnected/syncing indicator
  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 text-white px-4 py-2 text-center text-sm font-medium shadow-lg animate-slide-down">
        <div className="flex items-center justify-center gap-2">
          {syncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Syncing {queueLength} {queueLength === 1 ? "change" : "changes"}...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Back online - All changes synced!</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
