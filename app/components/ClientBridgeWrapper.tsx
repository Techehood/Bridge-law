"use client";

import { useState, useEffect } from "react";
import BridgeSupport from "./BridgeSupport";

// ── CLIENT BRIDGE WRAPPER ─────────────────────────────────────
// Reads ?platform= and ?stage= from the URL so the floating button
// knows exactly which room/stage the student is currently in.

// Visibility states for the floating trigger, driven by whichever page is
// currently mounted underneath it:
//   "full"      — default. No guided flow is active on this page.
//   "minimized" — a guided Bridge flow (e.g. the staged wizard on the
//                 project page) is in progress. Showing a full second
//                 support entry point here would compete with it, so we
//                 shrink to a small icon-only tab instead of disappearing
//                 completely (a learner mid-task may still need a true
//                 escape hatch).
//   "hidden"    — the guided flow is already showing its support result.
//                 A second support control here would just be noise.
type BridgeVisibility = "full" | "minimized" | "hidden";

export default function ClientBridgeWrapper() {
  const [isBridgeOpen, setIsBridgeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState("");
  const [stage, setStage] = useState("");
  const [visibility, setVisibility] = useState<BridgeVisibility>("full");
  const [profile, setProfile] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPlatform(params.get("platform") || "");
    setStage(params.get("stage") || "");
    setMounted(true);

    // Auto-open for ThingLink embeds — skips the extra click on the floating button
    if (params.get("open") === "true") {
      setIsBridgeOpen(true);
    }

    // Profile handoff: read the thinking/access profile Room 1's wizard
    // saved to localStorage, so compact rooms know it without re-asking.
    try {
        const savedProfile = localStorage.getItem('bridge_profile');
        if (savedProfile) setProfile(JSON.parse(savedProfile));
    } catch {}

    // Listen for any guided flow on the page announcing its own stage,
    // so this floating control can step back rather than compete with it.
    const handleVisibility = (e: Event) => {
      const detail = (e as CustomEvent).detail as { mode?: BridgeVisibility } | undefined;
      if (detail?.mode) setVisibility(detail.mode);
    };
    window.addEventListener("bridge-flow-visibility", handleVisibility);
    return () => window.removeEventListener("bridge-flow-visibility", handleVisibility);
  }, []);

  if (!mounted) return null;

  // Inside the final support screen of a guided flow — stay out of the way entirely.
  if (visibility === "hidden") return null;

  // Mid-flow — shrink to a small, low-key tab rather than disappearing outright.
  if (visibility === "minimized") {
    return (
      <>
        <button
          onClick={() => setIsBridgeOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-3 py-2 bg-white/90 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 shadow-md rounded-full hover:shadow-lg transition-all active:scale-95"
          aria-label="Get Support — open student support"
        >
          <div className="relative flex h-2 w-2 shrink-0">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </div>
          <span className="font-bold text-xs text-neutral-600 dark:text-neutral-300">
            Support
          </span>
        </button>

        <BridgeSupport
          platform={platform}
          stage={stage}
          profile={profile}
          isOpen={isBridgeOpen}
          onClose={() => setIsBridgeOpen(false)}
        />
      </>
    );
  }

  // Default — full button, no guided flow active on this page.
  return (
    <>
      {/* ── FLOATING TRIGGER BUTTON ── */}
      <button
        onClick={() => setIsBridgeOpen(true)}
        className="fixed bottom-8 right-8 z-[9999] flex flex-col items-center gap-1 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xl rounded-2xl hover:shadow-blue-200 transition-all group active:scale-95"
        aria-label="Get Support — open student support"
      >
        {/* label row */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
          </div>
          <span className="font-bold text-base text-neutral-800 dark:text-neutral-100 group-hover:text-blue-600 transition-colors">
            Get Support
          </span>
        </div>
        {/* instruction line */}
        <p className="text-[10px] text-neutral-400 font-medium tracking-wide leading-none">
          Help with this step
        </p>
      </button>

      {/* ── BRIDGE SUPPORT MODAL ── */}
      <BridgeSupport
        platform={platform}
        stage={stage}
        profile={profile}
        isOpen={isBridgeOpen}
        onClose={() => setIsBridgeOpen(false)}
      />
    </>
  );
}
