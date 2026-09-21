/**
 * The Bridge V2 — Barrier library lookup
 *
 * Reads lib/barriers.json (BR-U3-01 Book Creator / BR-U3-02 ThingLink).
 * Static import, so the full library is available offline when the AI layer is down.
 *
 * Speaks the app's own stage keys: "stage1".."stage6" (Book Creator)
 * and "room1".."room6" (ThingLink). Platform is inferred from the key,
 * so nothing extra needs passing through the component tree.
 *
 * Place at: lib/barriers.ts  (beside barriers.json and utils.ts)
 */

import raw from "./barriers.json";

/* ---------------------------------------------- types */

export type Route = "teacher" | "tech" | "either";
export type PlatformKey = "bookcreator" | "thinglink";

export interface Barrier {
  id: string;
  context: string;
  type: string;
  route: Route;
  studentWording: string;
  triggers: string[];
  immediateSupport: string;
  resources: string[];
  lecturerIntervention: string;
  solves: string;
}

interface Library {
  platform: PlatformKey;
  accent: string;
  barriers: Barrier[];
}

/** Mirrors the DiagnosticResult interface in BridgeSupport.tsx. */
export interface LibraryDiagnostic {
  barrierType: string;
  diagnostic: string;
  intervention1: string;
  intervention2: string;
}

const LIBRARIES = (raw as { libraries: Library[] }).libraries;

/* ---------------------------------------------- helpers */

const ALIAS: Record<string, PlatformKey> = {
  bc: "bookcreator",
  bookcreator: "bookcreator",
  tl: "thinglink",
  thinglink: "thinglink",
};

export function resolvePlatform(input?: string | null): PlatformKey | null {
  if (!input) return null;
  return ALIAS[input.toLowerCase()] ?? null;
}

/** "stage3" -> "bookcreator", "room3" -> "thinglink". */
export function platformFromStageKey(stageKey?: string | null): PlatformKey | null {
  if (!stageKey) return null;
  const k = stageKey.toLowerCase();
  if (k.startsWith("stage")) return "bookcreator";
  if (k.startsWith("room")) return "thinglink";
  return null;
}

/** Pulls the number out of "stage3", "room3", "Stage 3: …" or 3. */
function numberOf(input: string | number): number {
  if (typeof input === "number") return input;
  const m = String(input).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/* ---------------------------------------------- core lookups */

export function getLibrary(platform: string): Library | null {
  const key = resolvePlatform(platform);
  return key ? LIBRARIES.find((l) => l.platform === key) ?? null : null;
}

/** Platform accent — terracotta for Book Creator, sage for ThingLink. */
export function getAccent(platform: string): string {
  return getLibrary(platform)?.accent ?? "#4B2E83";
}

export function getBarriers(platform: string, stage: number | string): Barrier[] {
  const lib = getLibrary(platform);
  if (!lib) return [];
  const n = numberOf(stage);
  return lib.barriers.filter((b) => numberOf(b.context) === n);
}

/** Barriers for an app stage key such as "stage3" or "room3". */
export function getBarriersForStageKey(stageKey: string): Barrier[] {
  const platform = platformFromStageKey(stageKey);
  return platform ? getBarriers(platform, numberOf(stageKey)) : [];
}

/** Suggestion-chip labels for a stage key. Safe to spread into an existing list. */
export function getChipsForStageKey(stageKey: string): string[] {
  return getBarriersForStageKey(stageKey).map((b) => b.studentWording);
}

export interface MatchResult {
  barrier: Barrier;
  score: number;
  fromOtherStage: boolean;
}

/**
 * Best-match a learner's free text against the library.
 * Current stage first, then the rest of that platform.
 * Returns null when nothing matches — caller falls through to its own logic.
 */
export function matchBarrierForStageKey(stageKey: string, text: string): MatchResult | null {
  const platform = platformFromStageKey(stageKey);
  const lib = platform ? getLibrary(platform) : null;
  if (!lib || !text?.trim()) return null;

  const hay = normalise(text);
  const n = numberOf(stageKey);

  const score = (b: Barrier) => {
    let s = b.triggers.reduce((acc, t) => {
      const frag = normalise(t);
      return frag && hay.includes(frag) ? acc + 1 : acc;
    }, 0);

    // A learner who taps this barrier's own suggestion chip should always
    // match it, even though the chip text contains no trigger fragment.
    const self = normalise(b.studentWording);
    if (self) {
      if (hay.includes(self)) s += 3;
      else if (hay.length > 12 && self.includes(hay)) s += 2;
    }
    return s;
  };

  const rank = (pool: Barrier[]) =>
    pool
      .map((b) => ({ barrier: b, score: score(b) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)[0] ?? null;

  const inStage = rank(lib.barriers.filter((b) => numberOf(b.context) === n));
  if (inStage) return { ...inStage, fromOtherStage: false };

  const anywhere = rank(lib.barriers.filter((b) => numberOf(b.context) !== n));
  return anywhere ? { ...anywhere, fromOtherStage: true } : null;
}

/* ---------------------------------------------- diagnostic composer */

/**
 * Turns a learner's problem into a teacher-ready diagnostic straight from the
 * library — no AI required. Returns null when nothing matches, so the caller
 * can fall through to its existing offline branches.
 *
 * Technical faults are flagged explicitly so they route to support rather than
 * to the teacher.
 */
export function libraryDiagnostic(stageKey: string, problem: string): LibraryDiagnostic | null {
  const hit = matchBarrierForStageKey(stageKey, problem);
  if (!hit) return null;

  const b = hit.barrier;
  const resources = b.resources.filter(Boolean).join(" · ");
  const drift = hit.fromOtherStage
    ? ` Note: this matches a barrier from ${b.context}, not the current stage — check which the student is actually working on.`
    : "";

  if (b.route === "tech") {
    return {
      barrierType: `System fault — ${b.type} (route to technical support)`,
      diagnostic:
        `This is a technical fault, not a learning barrier. ${b.solves} ` +
        `Teaching into it will not help and will cost the student time.${drift}`,
      intervention1: `${b.immediateSupport}${resources ? ` Reference: ${resources}.` : ""}`,
      intervention2: b.lecturerIntervention,
    };
  }

  const checkFirst =
    b.route === "either"
      ? " Check first whether this is an access need or a device fault — the response differs."
      : "";

  return {
    barrierType: `${b.type} (${b.id})`,
    diagnostic:
      `${b.context}. The student has reported: "${problem.trim()}". ` +
      `${b.solves}${checkFirst}${drift}`,
    intervention1: `${b.immediateSupport}${resources ? ` Use: ${resources}.` : ""}`,
    intervention2: b.lecturerIntervention,
  };
}

/* ---------------------------------------------- odds and ends */

export function getBarrierById(id: string): Barrier | null {
  for (const lib of LIBRARIES) {
    const hit = lib.barriers.find((b) => b.id === id);
    if (hit) return hit;
  }
  return null;
}

export function isTechnical(barrier: Barrier): boolean {
  return barrier.route === "tech";
}
