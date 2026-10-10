"use client";

/**
 * UEL Criminology Demo — Book Creator guide page (25 Sept 2026).
 * One shared 4-page student guide (agreed 19 Sept) — Daniel publishes this as
 * a single downloadable book in Book Creator; each page here mirrors that
 * page's content plus the Bridge launcher for notes/issue-flagging.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import DemoBridge from "@/app/components/DemoBridge";
import { BC_PAGES } from "@/lib/demo-content";

const VALID = ["1", "2", "3", "4"] as const;

export default function DemoBookCreatorPage() {
  const params = useParams();
  const raw = String(params.page ?? "");
  const pageKey = (VALID as readonly string[]).includes(raw) ? (`page${raw}` as keyof typeof BC_PAGES) : null;
  const [bridgeOpen, setBridgeOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bridge") === "open") setBridgeOpen(true);
  }, []);

  if (!pageKey) {
    return <div className="p-8 text-[#2D2730]">Unknown page. Valid pages: 1–4.</div>;
  }

  const page = BC_PAGES[pageKey];

  return (
    <div className="min-h-screen bg-[#FAFAEE] text-[#2D2730]" style={{ fontFamily: "Verdana, 'Open Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md" style={{ backgroundColor: "#B86B4A" }} />
          <p className="text-sm uppercase tracking-widest text-[#2D2730]/60 font-bold">Book Creator demo</p>
        </div>
        <h1 className="text-2xl font-bold">{page.title}</h1>

        <section className="bg-white rounded-xl border border-black/10 p-5">
          <p className="text-[#2D2730]/85 leading-relaxed whitespace-pre-line">{page.body}</p>
        </section>

        {pageKey === "page4" && (
          <section className="bg-white rounded-xl border border-black/10 p-5">
            <p className="font-bold mb-2">Notes</p>
            <div className="h-32 rounded-lg border border-dashed border-black/20" aria-hidden />
            <p className="text-sm text-[#2D2730]/60 mt-2">
              Printable/blank space in the real guide. Your actual notes and any issues you flag live in the Bridge below.
            </p>
          </section>
        )}

        <button
          onClick={() => setBridgeOpen(true)}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl text-white font-bold shadow-lg active:scale-95"
          style={{ backgroundColor: "#B86B4A" }}
        >
          <HelpCircle size={20} /> Open The Bridge — flag an issue
        </button>

        {pageKey === "page4" && (
          <button
            onClick={() => setBridgeOpen(true)}
            className="block px-6 py-4 rounded-2xl font-bold border-2"
            style={{ borderColor: "#B86B4A", color: "#2D2730" }}
          >
            Return to your results
          </button>
        )}
      </div>

      <DemoBridge
        platform="bookcreator"
        contextLabel={page.title}
        isOpen={bridgeOpen}
        onClose={() => setBridgeOpen(false)}
      />
    </div>
  );
}
