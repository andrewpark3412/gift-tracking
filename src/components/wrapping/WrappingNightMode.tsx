import { useState, useEffect, useMemo } from "react";
import type { WrappingGroup } from "../../hooks/useWrappingDashboard";
import "./WrappingNightMode.css";

interface WrappingNightModeProps {
  groups: WrappingGroup[];
  loading: boolean;
  error: string | null;
  selectedListName: string;
  markGiftWrapped: (giftId: string) => Promise<void>;
  onExit: () => void;
  onGiftWrapped?: () => Promise<void> | void;
}

export function WrappingNightMode({
  groups,
  loading,
  error,
  markGiftWrapped,
  onExit,
  onGiftWrapped,
}: WrappingNightModeProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [wrapping, setWrapping] = useState<Set<string>>(new Set());
  const [justWrapped, setJustWrapped] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((group) =>
      group.personName.toLowerCase().includes(query)
    );
  }, [groups, searchQuery]);

  // Calculate progress
  const totalGifts = groups.reduce((sum, g) => sum + g.gifts.length, 0);
  const wrappedCount = totalGifts - filteredGroups.reduce((sum, g) => sum + g.gifts.length, 0);
  const progressPercent = totalGifts > 0 ? (wrappedCount / totalGifts) * 100 : 0;

  // Handle ESC key to exit
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onExit]);

  const handleMarkWrapped = async (giftId: string) => {
    setWrapping((prev) => new Set(prev).add(giftId));

    try {
      await markGiftWrapped(giftId);

      // Trigger confetti animation
      setJustWrapped((prev) => new Set(prev).add(giftId));
      setTimeout(() => {
        setJustWrapped((prev) => {
          const next = new Set(prev);
          next.delete(giftId);
          return next;
        });
      }, 1000);

      // Play sound if enabled
      if (soundEnabled) {
        playWrapSound();
      }

      if (onGiftWrapped) {
        await onGiftWrapped();
      }
    } catch (err) {
      console.error("Error marking gift wrapped:", err);
    } finally {
      setWrapping((prev) => {
        const next = new Set(prev);
        next.delete(giftId);
        return next;
      });
    }
  };

  const handleMarkAllWrapped = async (personName: string, giftIds: string[]) => {
    const confirmed = window.confirm(
      `Mark all ${giftIds.length} gifts for ${personName} as wrapped?`
    );
    if (!confirmed) return;

    for (const giftId of giftIds) {
      await handleMarkWrapped(giftId);
    }
  };

  const playWrapSound = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silently fail if audio not supported
    }
  };

  return (
    <div className="wrapping-night-mode">
      {/* Snowfall animation */}
      <div className="snowfall">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="snowflake" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${10 + Math.random() * 10}s`,
            opacity: 0.3 + Math.random() * 0.4,
            fontSize: `${10 + Math.random() * 10}px`,
          }}>
            ❄
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="wrapping-night-header">
        <div className="header-left">
          <button onClick={onExit} className="exit-button">
            ← Exit Wrapping Mode
          </button>
          <h1 className="header-title">
            🎁 Wrapping Mode
          </h1>
        </div>

        <div className="header-right">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="sound-toggle"
            title={soundEnabled ? "Disable sound" : "Enable sound"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <div className="progress-info">
            <span className="progress-text">
              {wrappedCount} of {totalGifts} wrapped
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="🔍 Search by person name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="clear-search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content */}
      <div className="wrapping-content">
        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {loading && (
          <div className="loading-message">
            Loading wrapping data…
          </div>
        )}

        {!loading && totalGifts === 0 && (
          <div className="completion-message">
            <div className="completion-icon">🎉</div>
            <h2>All Done!</h2>
            <p>All purchased gifts are wrapped.</p>
            <p className="completion-subtitle">Time to celebrate! 🎄</p>
          </div>
        )}

        {!loading && filteredGroups.length === 0 && totalGifts > 0 && (
          <div className="no-results">
            No people match "{searchQuery}"
          </div>
        )}

        {!loading && filteredGroups.length > 0 && (
          <div className="people-groups">
            {filteredGroups.map((group) => {
              return (
                <div key={group.personId} className="person-group">
                  <div className="person-header">
                    <div className="person-info">
                      <span className="person-icon">👤</span>
                      <span className="person-name">{group.personName}</span>
                      <span className="gift-count">
                        ({group.gifts.length} unwrapped)
                      </span>
                    </div>
                    {group.gifts.length > 1 && (
                      <button
                        onClick={() =>
                          handleMarkAllWrapped(
                            group.personName,
                            group.gifts.map((g) => g.id)
                          )
                        }
                        className="mark-all-button"
                      >
                        ✓ Mark All Wrapped
                      </button>
                    )}
                  </div>

                  <div className="gifts-list">
                    {group.gifts.map((gift) => {
                      const isWrapping = wrapping.has(gift.id);
                      const showConfetti = justWrapped.has(gift.id);

                      return (
                        <div
                          key={gift.id}
                          className={`gift-item ${showConfetti ? "celebrating" : ""}`}
                        >
                          {showConfetti && <div className="confetti">🎊</div>}

                          <div className="gift-details">
                            <div className="gift-checkbox">
                              <div className="checkbox-unchecked" />
                            </div>
                            <div className="gift-info">
                              <div className="gift-description">
                                {gift.description}
                              </div>
                              <div className="gift-meta">
                                <span className="gift-price">
                                  ${gift.price.toFixed(2)}
                                </span>
                                {gift.notes && (
                                  <span className="gift-notes">
                                    • {gift.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleMarkWrapped(gift.id)}
                            disabled={isWrapping}
                            className="wrap-button"
                          >
                            {isWrapping ? "Wrapping..." : "🎁 Mark Wrapped"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
