"use client";

/**
 * UEL Criminology Demo — ThingLink room page (25 Sept 2026).
 * Embedded inside the real 360 room in ThingLink (Daniel builds that part in
 * ThingLink's own authoring tool); this page carries the hotspot text content
 * that ThingLink's iframe/window points at, plus the Bridge launcher.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import DemoBridge from "@/app/components/DemoBridge";
import { TL_ROOMS } from "@/lib/demo-content";

export default function DemoThingLinkRoomPage() {
  const params = useParams();
  const raw = String(params.room ?? "");
  const roomKey = raw === "1" ? "room1" : raw === "2" ? "room2" : null;
  const [bridgeOpen, setBridgeOpen] = useState(false);

  // "?bridge=open" reopens the Bridge straight away (used by the Return to your results link)
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bridge") === "open") setBridgeOpen(true);
  }, []);

  if (!roomKey) {
    return <div className="p-8 text-[#2D2730]">Unknown room. Valid rooms: 1, 2.</div>;
  }

  const room = TL_ROOMS[roomKey];

  return (
    <div className="min-h-screen bg-[#FAFAEE] text-[#2D2730]" style={{ fontFamily: "Verdana, 'Open Sans', sans-serif" }}>
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full" style={{ backgroundColor: "#6B8E5E" }} />
          <p className="text-sm uppercase tracking-widest text-[#2D2730]/60 font-bold">ThingLink demo</p>
        </div>
        <h1 className="text-2xl font-bold">{room.title}</h1>

        {room.hotspots.map((h) => (
          <section key={h.id} className="bg-white rounded-xl border border-black/10 p-5">
            <h2 className="font-bold mb-2">{h.title}</h2>
            <p className="text-[#2D2730]/85 leading-relaxed">{h.body}</p>
          </section>
        ))}

        <button
          onClick={() => setBridgeOpen(true)}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl text-white font-bold shadow-lg active:scale-95"
          style={{ backgroundColor: "#6B8E5E" }}
        >
          <HelpCircle size={20} /> Open The Bridge — flag an issue
        </button>

        {roomKey === "room2" && (
          <button
            onClick={() => setBridgeOpen(true)}
            className="block px-6 py-4 rounded-2xl font-bold border-2"
            style={{ borderColor: "#6B8E5E", color: "#2D2730" }}
          >
            Return to your results
          </button>
        )}
      </div>

      <DemoBridge
        platform="thinglink"
        contextLabel={room.title}
        isOpen={bridgeOpen}
        onClose={() => setBridgeOpen(false)}
      />
    </div>
  );
}
