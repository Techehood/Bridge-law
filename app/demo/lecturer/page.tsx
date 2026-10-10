"use client";

/**
 * Criminology demo — Lecturer View (private URL, not linked anywhere, no names).
 * Reads the existing GET /api/demo-submit. Counts only. Hidden until 3+ submissions
 * (the API enforces this; the ESOL count is already hidden by the API when 1-2).
 */
import { useCallback, useEffect, useState } from "react";

type Summary = {
  totalSubmissions: number;
  belowMinimumGroupSize: boolean;
  minimumGroupSize?: number;
  message?: string;
  byIssueType?: Record<string, number>;
  byPlatform?: Record<string, number>;
  error?: string;
};

const ENVIRONMENT = new Set([
  "Class size (number of people)",
  "Noise",
  "Lighting and glare",
  "Whiteboard or screen visibility",
]);

function Bars({ data, color }: { data: [string, number][]; color: string }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  if (!data.length) return <p className="text-[#2D2730]/60">Nothing flagged in this group.</p>;
  return (
    <ul className="space-y-3">
      {data.map(([label, n]) => (
        <li key={label}>
          <div className="flex justify-between text-sm mb-1">
            <span>{label}</span>
            <span className="font-bold">{n}</span>
          </div>
          <div className="h-3 rounded-full bg-black/10">
            <div className="h-3 rounded-full" style={{ width: `${(n / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function LecturerView() {
  const [s, setS] = useState<Summary | null>(null);
  const [failed, setFailed] = useState(false);
  const [updated, setUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/demo-submit", { cache: "no-store" });
      setS((await res.json()) as Summary);
      setFailed(false);
      setUpdated(new Date().toLocaleTimeString());
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const env: [string, number][] = [];
  const other: [string, number][] = [];
  Object.entries(s?.byIssueType ?? {}).forEach(([k, v]) => (ENVIRONMENT.has(k) ? env : other).push([k, v]));
  env.sort((a, b) => b[1] - a[1]);
  other.sort((a, b) => b[1] - a[1]);
  const imm = s?.byPlatform?.thinglink ?? 0;
  const read = s?.byPlatform?.bookcreator ?? 0;

  return (
    <div className="min-h-screen bg-[#FAFAEE] text-[#2D2730]" style={{ fontFamily: "Verdana, 'Open Sans', sans-serif" }}>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-1">
          <p className="text-sm uppercase tracking-widest font-bold" style={{ color: "#3758A7" }}>Techembrace · Lecturer View</p>
          <h1 className="text-2xl font-bold">What your class shared</h1>
          <p className="text-[#2D2730]/70 text-sm">
            Anonymous counts only. No names. Only students who chose &quot;Share anonymously with my lecturer&quot; appear here.
          </p>
        </header>

        {failed && <p className="rounded-xl bg-white border border-black/10 p-4">Could not load. Check the Wi-Fi, it will retry on its own.</p>}
        {s?.error && <p className="rounded-xl bg-white border border-black/10 p-4">Storage is not connected on this project.</p>}

        {s && !s.error && s.belowMinimumGroupSize && (
          <section className="bg-white rounded-xl border border-black/10 p-6 space-y-2">
            <p className="font-bold text-lg">{s.totalSubmissions} shared so far</p>
            <p>Summary hidden until at least {s.minimumGroupSize ?? 3} students have shared. This protects anonymity.</p>
          </section>
        )}

        {s && !s.error && !s.belowMinimumGroupSize && (
          <>
            <section className="bg-white rounded-xl border border-black/10 p-6">
              <p className="text-4xl font-bold">{s.totalSubmissions}</p>
              <p className="text-[#2D2730]/70">students shared anonymously</p>
            </section>

            <section className="bg-white rounded-xl border border-black/10 p-6 space-y-4">
              <h2 className="font-bold text-lg">How they chose to learn</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-xl p-4 border border-black/10">
                  <span className="inline-block w-5 h-5 rounded-full align-middle mr-2" style={{ backgroundColor: "#6B8E5E" }} />
                  <span className="text-2xl font-bold">{imm}</span>
                  <p className="text-sm">Immersive</p>
                </div>
                <div className="rounded-xl p-4 border border-black/10">
                  <span className="inline-block w-5 h-5 rounded-md align-middle mr-2" style={{ backgroundColor: "#B86B4A" }} />
                  <span className="text-2xl font-bold">{read}</span>
                  <p className="text-sm">Reading</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-black/10 p-6 space-y-4">
              <h2 className="font-bold text-lg">Room and setting</h2>
              <Bars data={env} color="#4B2E83" />
            </section>

            <section className="bg-white rounded-xl border border-black/10 p-6 space-y-4">
              <h2 className="font-bold text-lg">Learning needs and support</h2>
              <Bars data={other} color="#4B2E83" />
            </section>
          </>
        )}

        <p className="text-xs text-[#2D2730]/50">Updates every 10 seconds{updated ? ` · last ${updated}` : ""}.</p>
      </div>
    </div>
  );
}
