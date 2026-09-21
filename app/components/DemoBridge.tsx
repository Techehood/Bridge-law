"use client";

/**
 * UEL Criminology Demo — Bridge wrapper (25 Sept 2026)
 *
 * SEPARATE from BridgeSupport.tsx (the live pilot support panel). This is the
 * new "speak now" wrapper agreed 19 Sept 2026:
 *   - optional profile ("how I like to learn")
 *   - issue flagging against the LOCKED issue-type list
 *   - "My Learning Summary" shown before anything is shared
 *   - Share anonymously with my lecturer / Keep for me only
 *
 * Do not import lib/barriers.ts or lib/barriers.json here — that's the live
 * pilot library and must stay untouched. See lib/demo-content.ts instead.
 */

import { useEffect, useMemo, useState } from "react";
import { X, Download, Printer, CheckCircle2, Lock } from "lucide-react";
import {
  ISSUE_TYPES,
  WHERE_OPTIONS,
  type DemoPlatform,
  type WhereOption,
  type DemoRow,
} from "@/lib/demo-content";

const GROUP_CODE_KEY = "demo.groupCode";
const PROFILE_KEY = "demo.profile"; // separate namespace from the live pilot's bridge.profile
const ACCENT: Record<DemoPlatform, string> = {
  thinglink: "#6B8E5E", // sage — locked platform accent
  bookcreator: "#B86B4A", // terracotta — locked platform accent
};

function randomGroupCode(): string {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZ"; // no I/L/O — avoids look-alike confusion
  const pick = (n: number) => Array.from({ length: n }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  return `GRP-${pick(2)}${Math.floor(10 + Math.random() * 90)}`;
}

function getGroupCode(): string {
  if (typeof window === "undefined") return "GRP-PENDING";
  try {
    const existing = window.sessionStorage.getItem(GROUP_CODE_KEY);
    if (existing) return existing;
    const fresh = randomGroupCode();
    window.sessionStorage.setItem(GROUP_CODE_KEY, fresh);
    return fresh;
  } catch {
    return randomGroupCode();
  }
}

interface DemoBridgeProps {
  platform: DemoPlatform;
  contextLabel: string; // e.g. "Room 1 — Procrastination" or "Page 2 — AI in law"
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = "task" | "summary" | "done";

export default function DemoBridge({ platform, contextLabel, isOpen, onClose }: DemoBridgeProps) {
  const accent = ACCENT[platform];
  const [view, setView] = useState<ViewState>("task");
  const [groupCode, setGroupCode] = useState("GRP-PENDING");
  const [startedAt] = useState(() => Date.now());
  const [howILikeToLearn, setHowILikeToLearn] = useState("");
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [where, setWhere] = useState<WhereOption | "">("");
  const [whatHelped, setWhatHelped] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [shareState, setShareState] = useState<"idle" | "sharing" | "shared" | "error">("idle");

  useEffect(() => {
    setGroupCode(getGroupCode());
    try {
      const saved = window.localStorage.getItem(PROFILE_KEY);
      if (saved) setHowILikeToLearn(JSON.parse(saved)?.text ?? "");
    } catch {
      /* ignore */
    }
  }, []);

  const rows: DemoRow[] = useMemo(() => {
    const timeOnTaskSeconds = Math.round((Date.now() - startedAt) / 1000);
    const base = {
      groupCode,
      platform,
      where,
      whatHelped: whatHelped.trim().slice(0, 200),
      timeOnTaskSeconds,
      howILikeToLearn: howILikeToLearn.trim().slice(0, 120),
      submittedAt: new Date().toISOString(),
    };
    if (selectedIssues.length === 0) {
      return [{ ...base, issueGroup: "" as const, issueType: "" }];
    }
    return selectedIssues.map((id) => {
      const issue = ISSUE_TYPES.find((i) => i.id === id)!;
      return { ...base, issueGroup: issue.group, issueType: issue.label };
    });
  }, [groupCode, platform, where, whatHelped, howILikeToLearn, selectedIssues, startedAt]);

  function toggleIssue(id: string) {
    setSelectedIssues((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function savePersonalNotes() {
    try {
      window.localStorage.setItem(
        PROFILE_KEY,
        JSON.stringify({ text: howILikeToLearn, notes: privateNotes, updatedAt: new Date().toISOString() })
      );
    } catch {
      /* storage blocked — personal copy just won't persist across reload */
    }
  }

  async function shareAnonymously() {
    setShareState("sharing");
    try {
      const results = await Promise.all(
        rows.map((row) =>
          fetch("/api/demo-submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          })
        )
      );
      if (results.every((r) => r.ok)) {
        setShareState("shared");
        setView("done");
      } else {
        setShareState("error");
      }
    } catch {
      setShareState("error");
    }
  }

  function keepForMeOnly() {
    savePersonalNotes();
    setView("done");
  }

  function downloadSummary() {
    const lines = [
      "My Learning Summary",
      contextLabel,
      "",
      `Group code: ${groupCode}`,
      `How I like to learn: ${howILikeToLearn || "(not shared)"}`,
      `Where: ${where || "(not set)"}`,
      `Issues flagged: ${selectedIssues.length ? selectedIssues.map((id) => ISSUE_TYPES.find((i) => i.id === id)?.label).join(", ") : "None"}`,
      `What helped: ${whatHelped || "(none noted)"}`,
      "",
      "Private notes (never shared):",
      privateNotes || "(none)",
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-learning-summary-${groupCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // The host page (app/demo/tl/[room] or app/demo/bc/[page]) owns its own
  // "Open The Bridge" trigger — unlike the live pilot's BridgeSupport, this
  // demo wrapper renders nothing when closed rather than a full-screen relauncher.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FAFAEE] text-[#2D2730]" style={{ fontFamily: "Verdana, 'Open Sans', sans-serif" }}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
        <div className="flex items-center gap-3">
          <div
            className={platform === "bookcreator" ? "w-8 h-8 rounded-md" : "w-8 h-8 rounded-full"}
            style={{ backgroundColor: accent }}
          />
          <div>
            <p className="font-bold leading-none">The Bridge</p>
            <p className="text-sm text-[#2D2730]/70">{contextLabel}</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-black/5">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 max-w-2xl mx-auto w-full">
        {view === "task" && (
          <div className="space-y-6">
            <section>
              <label className="block font-bold mb-1">How I like to learn (optional)</label>
              <p className="text-sm text-[#2D2730]/70 mb-2">Never shared unless you choose to.</p>
              <input
                type="text"
                value={howILikeToLearn}
                onChange={(e) => setHowILikeToLearn(e.target.value)}
                placeholder="e.g. I focus better with things broken into small steps"
                className="w-full rounded-xl border border-black/15 px-4 py-3 bg-white"
              />
            </section>

            <section>
              <p className="font-bold mb-1">Did anything make this harder than it needed to be?</p>
              <p className="text-sm text-[#2D2730]/70 mb-3">Every option is optional — pick as many or as few as apply.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ISSUE_TYPES.map((issue) => {
                  const checked = selectedIssues.includes(issue.id);
                  return (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => toggleIssue(issue.id)}
                      className="flex items-center gap-2 text-left px-3 py-2 rounded-xl border"
                      style={{
                        borderColor: checked ? accent : "rgba(0,0,0,0.15)",
                        backgroundColor: checked ? `${accent}1A` : "white",
                      }}
                    >
                      <span
                        className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        style={{ borderColor: accent, backgroundColor: checked ? accent : "white" }}
                      >
                        {checked && <CheckCircle2 size={12} color="white" />}
                      </span>
                      <span className="text-sm">{issue.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedIssues.length > 0 && (
              <section>
                <label className="block font-bold mb-1">Where was it?</label>
                <div className="flex gap-2 flex-wrap">
                  {WHERE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setWhere(opt)}
                      className="px-4 py-2 rounded-full border text-sm capitalize"
                      style={{
                        borderColor: where === opt ? accent : "rgba(0,0,0,0.15)",
                        backgroundColor: where === opt ? accent : "white",
                        color: where === opt ? "white" : "#2D2730",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <label className="block font-bold mb-1">What helped (optional)</label>
              <textarea
                value={whatHelped}
                onChange={(e) => setWhatHelped(e.target.value.slice(0, 200))}
                rows={2}
                placeholder="Short note — don't name anyone"
                className="w-full rounded-xl border border-black/15 px-4 py-3 bg-white"
              />
            </section>

            <section>
              <label className="block font-bold mb-1 flex items-center gap-1">
                <Lock size={14} /> Private notes
              </label>
              <p className="text-sm text-[#2D2730]/70 mb-2">Only for you — never sent to your lecturer.</p>
              <textarea
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Anything you want to remember for yourself"
                className="w-full rounded-xl border border-black/15 px-4 py-3 bg-white"
              />
            </section>

            <button
              onClick={() => setView("summary")}
              className="w-full py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: accent }}
            >
              See my learning summary
            </button>
          </div>
        )}

        {view === "summary" && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold">My Learning Summary</h2>
            <p className="text-sm text-[#2D2730]/70">
              This is exactly what would be shared — nothing goes to your lecturer until you choose to share it.
            </p>

            <div className="rounded-xl border border-black/15 bg-white p-4 space-y-2 text-sm">
              <p><span className="font-bold">Group code:</span> {groupCode} <span className="text-[#2D2730]/60">(not your name)</span></p>
              <p><span className="font-bold">How I like to learn:</span> {howILikeToLearn || "—"}</p>
              <p><span className="font-bold">Issues flagged:</span>{" "}
                {selectedIssues.length ? selectedIssues.map((id) => ISSUE_TYPES.find((i) => i.id === id)?.label).join(", ") : "None"}
              </p>
              <p><span className="font-bold">Where:</span> {where || "—"}</p>
              <p><span className="font-bold">What helped:</span> {whatHelped || "—"}</p>
            </div>

            <div className="rounded-xl border border-black/15 bg-black/5 p-4 space-y-1 text-sm">
              <p className="font-bold flex items-center gap-1"><Lock size={14} /> Private notes — never shared</p>
              <p className="text-[#2D2730]/80">{privateNotes || "(none)"}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={downloadSummary} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-black/15 bg-white font-medium">
                <Download size={16} /> Save
              </button>
              <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-black/15 bg-white font-medium">
                <Printer size={16} /> Print
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={shareAnonymously}
                disabled={shareState === "sharing"}
                className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-60"
                style={{ backgroundColor: accent }}
              >
                {shareState === "sharing" ? "Sharing…" : "Share anonymously with my lecturer"}
              </button>
              <button onClick={keepForMeOnly} className="w-full py-3 rounded-xl border border-black/15 bg-white font-bold">
                Keep for me only
              </button>
              {shareState === "error" && (
                <p className="text-sm text-red-600">Couldn't share just now — your summary is still safe above. Try again, or keep it for yourself.</p>
              )}
              <button onClick={() => setView("task")} className="w-full text-sm text-[#2D2730]/60 underline pt-1">
                Back and change something
              </button>
            </div>
          </div>
        )}

        {view === "done" && (
          <div className="text-center py-10 space-y-3">
            <CheckCircle2 size={40} style={{ color: accent }} className="mx-auto" />
            <p className="font-bold text-lg">
              {shareState === "shared" ? "Shared anonymously — thank you." : "Saved for you."}
            </p>
            <p className="text-sm text-[#2D2730]/70">
              {shareState === "shared"
                ? "Your lecturer will only ever see this as part of a class total, never linked to you."
                : "Nothing was sent to your lecturer. Remember to download your summary before you leave this computer."}
            </p>
            <button onClick={onClose} className="mt-4 px-5 py-2.5 rounded-xl border border-black/15 bg-white font-medium">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
