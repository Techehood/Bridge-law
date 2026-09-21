/**
 * UEL Criminology Demo — 25 Sept 2026
 *
 * Content locked 19 Sept 2026 (see project doc
 * `claude/uel-crim-demo-25-sept-content-agreed-2026-09-19.md`).
 *
 * This is a SEPARATE demo copy — never imported by the live /tl or /bc routes,
 * never touches lib/barriers.json (the live pilot library). Keep it that way.
 */

export type IssueGroup = "environment" | "other";
export type DemoPlatform = "thinglink" | "bookcreator";
export type WhereOption = "whole class" | "small group" | "independent";

export interface IssueType {
  id: string;
  group: IssueGroup;
  label: string;
}

/** LOCKED 19 Sept 2026 — do not add/remove without sign-off (see agreed-content doc). */
export const ISSUE_TYPES: IssueType[] = [
  { id: "class-size", group: "environment", label: "Class size (number of people)" },
  { id: "noise", group: "environment", label: "Noise" },
  { id: "lighting", group: "environment", label: "Lighting and glare" },
  { id: "board-visibility", group: "environment", label: "Whiteboard or screen visibility" },
  { id: "esol", group: "other", label: "ESOL / language" },
  { id: "pace", group: "other", label: "Pace and unclear instructions" },
  { id: "group-dynamics", group: "other", label: "Group dynamics and deadlines" },
  { id: "ai-expectations", group: "other", label: "AI expectations" },
];

export const WHERE_OPTIONS: WhereOption[] = ["whole class", "small group", "independent"];

/** Sheet columns — LOCKED 19 Sept 2026. Keep this order; the export/briefing code depends on it. */
export const SHEET_COLUMNS = [
  "Group code",
  "Platform",
  "Issue group",
  "Issue type",
  "Where was it",
  "What helped",
  "Time on task (s)",
  "How I like to learn",
] as const;

export interface DemoRow {
  groupCode: string; // not a name — generated client-side, never a student ID
  platform: DemoPlatform;
  issueGroup: IssueGroup | "";
  issueType: string; // IssueType.label, or "" if no issue flagged
  where: WhereOption | "";
  whatHelped: string;
  timeOnTaskSeconds: number;
  howILikeToLearn: string; // optional free text, blank if skipped
  submittedAt: string;
}

/** Two ThingLink rooms, two hotspots each — content only, no URLs/tool names (agreed 19 Sept). */
export const TL_ROOMS = {
  room1: {
    title: "Room 1 — Procrastination",
    hotspots: [
      {
        id: "h1",
        title: "What's stopping you?",
        body:
          "Naming the barrier is the first step. Common ones: the task feels too big, " +
          "unclear where to start, or it's easier to do something else first. " +
          "Tiny first step: pick ONE small, five-minute piece of the task and do only that.",
      },
      {
        id: "h2",
        title: "Exemplar — a filled-in plan",
        body:
          "Fictional example: \"Essay feels huge → tiny first step: write just the opening " +
          "sentence of the introduction, nothing else, for five minutes.\" That's it — the plan " +
          "only needs the next five minutes, not the whole essay.",
      },
    ],
  },
  room2: {
    title: "Room 2 — AI in law",
    hotspots: [
      {
        id: "h1",
        title: "Fine use vs misuse",
        body:
          "Fine: using AI to explain a concept, check your understanding, or get unstuck on structure. " +
          "Misuse: submitting AI output as your own work. The rule either way — acknowledge it, verify it, " +
          "don't submit it as your own unchecked work.",
      },
      {
        id: "h2",
        title: "Exemplar — real citation vs invented citation",
        body:
          "Fictional example: a real case citation matches a real, checkable judgment. An invented " +
          "citation looks correctly formatted but the case doesn't exist, or doesn't say what's claimed. " +
          "In law and criminology this matters more than most subjects — always verify a citation against " +
          "the actual source before it goes in your work.",
      },
    ],
  },
} as const;

/** Book Creator — one shared 4-page student guide (agreed 19 Sept). */
export const BC_PAGES = {
  page1: {
    title: "Page 1 — Procrastination",
    body:
      "Naming the barrier is the first step. Common ones: the task feels too big, unclear where " +
      "to start, or it's easier to do something else first. Tiny first step: pick ONE small, " +
      "five-minute piece of the task and do only that. A focus block that works for many people: " +
      "25 minutes on, 5 minutes off.",
  },
  page2: {
    title: "Page 2 — AI in law",
    body:
      "Fine use: explaining a concept, checking understanding, getting unstuck on structure. " +
      "Misuse: submitting AI output as your own work. Rule: acknowledge it, verify it, don't submit " +
      "it as your own unchecked work. In law and criminology, AI can invent citations that look real " +
      "but aren't — always verify against the actual source.",
  },
  page3: {
    title: "Page 3 — Both exemplars",
    body:
      "Procrastination exemplar (fictional): \"Essay feels huge → tiny first step: write just the " +
      "opening sentence, for five minutes.\" AI exemplar (fictional): a real citation matches a real, " +
      "checkable judgment; an invented one looks correctly formatted but the case doesn't exist.",
  },
  page4: {
    title: "Page 4 — Notes and issues",
    body:
      "Use this page for your own notes as you go. Your personal notes and any issues you flag live " +
      "in the Bridge, not on this page — open it any time from the link on this page.",
  },
} as const;
