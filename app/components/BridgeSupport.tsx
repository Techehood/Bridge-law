"use client";
import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, X, CheckCircle2, ArrowRight, ClipboardCheck, RefreshCw, Mic, MicOff, AlertTriangle, Layers, ListOrdered, LayoutTemplate, Check, ExternalLink, Volume2, Sun, Timer, Brain, Languages, Wrench, UserRound, MapPin, Ear, Eye, Scale, PenLine } from 'lucide-react';
import type { ComponentType } from 'react';
import { getChipsForStageKey, libraryDiagnostic, matchBarrierForStageKey, platformFromStageKey } from '@/lib/barriers';
// ── ENVIRONMENT CHIPS ─────────────────────────────────────────
const ENV_CHIPS = [
  { id: 'noisy', label: 'Too Noisy', icon: Volume2 },
  { id: 'bright', label: 'Too Bright', icon: Sun },
  { id: 'rushed', label: 'Feeling Rushed', icon: Timer },
  { id: 'overwhelmed', label: 'Feeling Overwhelmed', icon: Brain },
  { id: 'language', label: 'Language Access', icon: Languages },
];
// ── THINKING PROFILE ──────────────────────────────────────────
const PROFILE_KEY = 'bridge.profile';
const LEGACY_PROFILE_KEYS = ['bridgeProfile', 'bridge_profile', 'profile', 'thinkingProfile'];
const PROFILE_CONDITIONS = [
  'ADHD', 'Autism', 'Dyslexia', 'Dyspraxia', 'Dyscalculia', 'Tourette Syndrome', 'Hyperlexia',
];
const PROFILE_STRENGTHS = [
  'Sensory Processing', 'Processing Speed', 'Working Memory', 'Executive Function',
];
function readStoredProfile(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.values)) return parsed.values.filter((v: unknown) => typeof v === 'string');
    }
  } catch {
    /* storage blocked or corrupt — fall through to legacy keys */
  }
  for (const key of LEGACY_PROFILE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((v: unknown) => typeof v === 'string');
      if (Array.isArray(parsed?.profile)) return parsed.profile;
    } catch {
      /* ignore and keep looking */
    }
  }
  return null;
}
function writeStoredProfile(values: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ v: 1, values }));
  } catch {
    // Storage partitioned or disabled in this embed.
  }
}
// ── UNIT 5 (ASSEMBLY) — QUICK SUPPORTS ───────────────────────
const CLUTTER_QUESTIONS = [
  'What should the audience notice first?',
  'What supports meaning?',
  'What can be removed?',
];
const BUILD_ORDER_STEPS = [
  'Source text',
  'Main image',
  'Audio / voice',
  'Video or movement layer',
  'Reflection / final interaction',
];
const TEMPLATE_SLOTS = [
  'Main focal image',
  'Short text block',
  'Audio button',
  'Optional video area',
  'Final reflection area',
];
// ── STAGE-SPECIFIC PROBLEM SUGGESTIONS ────────────────────────
const STAGE_PROBLEMS: Record<string, string[]> = {
  room1: [
    "I don't know where to start",
    "The 360° space feels overwhelming",
    "I can't find or access the right hotspot",
    "I don't know what to record or say",
  ],
  room2: [
    "I can't identify the emotion in the audio",
    "I don't understand what I'm supposed to feel",
    "All the sounds seem the same to me",
    "I don't know how to describe what I hear",
  ],
  room3: [
    "I don't know how to write a prompt",
    "My words don't match the image in my head",
    "The tools are confusing me",
    "I don't know where to start",
  ],
  room4: [
    "All the images look the same to me",
    "I don't know which one to pick",
    "I forgot what feeling I was going for",
    "There are too many choices",
  ],
  room5: [
    "There's too much on the page — it feels crowded or messy",
    "I don't know what order to put things in",
    "I know what I want, but I can't turn it into a finished layout",
    "Something else is stopping me",
  ],
  room6: [
    "I don't know what to write in my reflection",
    "I'm not sure what to say about AI",
    "I'm nervous about sharing it",
    "I don't know if it's finished",
  ],
  stage1: [
    "I don't understand the poem",
    "I can't find the main meaning",
    "The words are too difficult",
    "I don't know what to write about",
  ],
  stage2: [
    "I can't describe the emotion I feel",
    "I'm confused about what 'tone' means",
    "I don't know what feeling to use",
    "I can't find my own voice",
  ],
  stage3: [
    "I don't know how to write a prompt",
    "My prompts don't make the right image",
    "I can't put the idea into words",
    "I don't know which details to include",
  ],
  stage4: [
    "All the images look similar",
    "I don't know which one to choose",
    "None of them feel right to me",
    "I can't compare them clearly",
  ],
  stage5: [
    "There's too much on the page — it feels crowded or messy",
    "I don't know what order to put things in",
    "I know what I want, but I can't turn it into a finished layout",
    "Something else is stopping me",
  ],
  stage6: [
    "I don't know what to write in my reflection",
    "I'm not sure what to disclose about AI",
    "I'm scared to publish",
    "I don't think it's good enough",
  ],
};
const FALLBACK_PROBLEMS = [
  "I cannot interpret meaning clearly",
  "I don't know how to turn my idea into an image",
  "I am overwhelmed and don't know where to start",
  "I am unsure what evidence I need",
];
// ── RESOURCE-TYPE ICON SYSTEM ─────────────────────────────────
const RESOURCE_ICON_GLYPHS: Record<string, React.ReactNode> = {
  text_read: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="1.6" fill="none" stroke="#FFFFFF" strokeWidth={1.7} />
      <line x1="8.4" y1="9" x2="15.6" y2="9" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
      <line x1="8.4" y1="12" x2="15.6" y2="12" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
      <line x1="8.4" y1="15" x2="13" y2="15" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
    </>
  ),
  audio_listen: (
    <>
      <path d="M4 9.6h2.9l4.2-3.5v11.8l-4.2-3.5H4a.7.7 0 0 1-.7-.7v-3.4a.7.7 0 0 1 .7-.7z" fill="none" stroke="#FFFFFF" strokeWidth={1.7} strokeLinejoin="round" />
      <path d="M15.6 9c1.2.85 1.95 1.95 1.95 3s-.75 2.15-1.95 3" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M17.7 6.7c2 1.4 3.2 3.3 3.2 5.3s-1.2 3.9-3.2 5.3" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
    </>
  ),
  image_view: (
    <>
      <rect x="3.2" y="5" width="17.6" height="14" rx="1.8" fill="none" stroke="#FFFFFF" strokeWidth={1.7} />
      <circle cx="8.2" cy="9.5" r="1.7" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      <path d="M4.6 16.6l4.4-4.6a1 1 0 0 1 1.45 0l2.55 2.6 2.2-2.3a1 1 0 0 1 1.45 0l2.4 2.5" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  video_watch: (
    <>
      <rect x="3" y="4.2" width="18" height="15.6" rx="3" fill="none" stroke="#FFFFFF" strokeWidth={1.7} />
      <path d="M10 8.9a.9.9 0 0 1 1.37-.77l4.6 2.9a.9.9 0 0 1 0 1.55l-4.6 2.9A.9.9 0 0 1 10 14.7z" fill="#FFFFFF" stroke="none" />
    </>
  ),
  link_navigate: (
    <>
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="#FFFFFF" strokeWidth={1.7} />
      <path d="M9 14.3l5.4-5.4" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" fill="none" />
      <path d="M9.4 8.9h5v5" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  reflection_write: (
    <>
      <path d="M5 16.3l.9-3.3 8.7-8.7a1.2 1.2 0 0 1 1.7 0l1.4 1.4a1.2 1.2 0 0 1 0 1.7l-8.7 8.7z" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M13.6 6.3l3 3" stroke="#FFFFFF" strokeWidth={1.4} fill="none" />
      <line x1="5" y1="19.2" x2="14.6" y2="19.2" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
    </>
  ),
  glossary_language: (
    <>
      <path d="M3.4 5.6h9.4a1.3 1.3 0 0 1 .95.4l6.3 6.3a1.3 1.3 0 0 1 0 1.85l-6.6 6.6a1.3 1.3 0 0 1-1.85 0l-6.3-6.3a1.3 1.3 0 0 1-.4-.95V6.3a.7.7 0 0 1 .5-0.7z" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="8.1" cy="10.1" r="1.55" fill="none" stroke="#FFFFFF" strokeWidth={1.4} />
    </>
  ),
  prompt_question: (
    <>
      <path d="M3.4 4.8h17.2a1 1 0 0 1 1 1v10.2a1 1 0 0 1-1 1H10l-4.4 3.7v-3.7H3.4a1 1 0 0 1-1-1V5.8a1 1 0 0 1 1-1z" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M9.6 9.6c.3-1.5 1.7-2.5 3.2-2.25 1.4.25 2.35 1.55 2.15 2.95-.2 1.1-1.05 1.65-1.8 2.2-.65.45-1.2.9-1.2 1.8v.35" fill="none" stroke="#FFFFFF" strokeWidth={1.55} strokeLinecap="round" />
      <circle cx="11.85" cy="17.5" r="0.95" fill="#FFFFFF" stroke="none" />
    </>
  ),
  transcript_captions: (
    <>
      <rect x="2.4" y="5.4" width="19.2" height="13.2" rx="2.2" fill="none" stroke="#FFFFFF" strokeWidth={1.7} />
      <line x1="5.4" y1="10.4" x2="10.6" y2="10.4" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
      <line x1="5.4" y1="14" x2="14.6" y2="14" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" opacity={0.55} />
      <line x1="13" y1="10.4" x2="18.6" y2="10.4" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" opacity={0.55} />
    </>
  ),
  teacher_note: (
    <>
      <rect x="5.4" y="3.8" width="13.2" height="17.2" rx="2" fill="none" stroke="#FFFFFF" strokeWidth={1.7} />
      <rect x="9" y="2.6" width="6" height="2.8" rx="0.9" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      <path d="M8.3 12.4l1.9 1.9 4.1-4.4" fill="none" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="16.6" x2="15.5" y2="16.6" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
    </>
  ),
  storyboard_scene: (
    <>
      <rect x="4.5" y="5" width="7" height="6" rx="0.8" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      <rect x="12.5" y="5" width="7" height="6" rx="0.8" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      <rect x="4.5" y="13" width="7" height="6" rx="0.8" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
      <path d="M13 16 H19" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M16.6 13.6 L19 16 L16.6 18.4" fill="none" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  selection_rubric: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="1.6" fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
      <path d="M7.8 8.2 L9 9.4 L11.2 6.8" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="8" x2="16.5" y2="8" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M7.8 13.2 L9 14.4 L11.2 11.8" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="13" x2="16.5" y2="13" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" />
      <line x1="7.5" y1="17.5" x2="16.5" y2="17.5" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" />
    </>
  ),
  disclosure_text: (
    <>
      <path d="M12 3.6 L19 6.4 V11.6 C19 16.4 15.8 19 12 20.4 C8.2 19 5 16.4 5 11.6 V6.4 Z" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="13" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <circle cx="12" cy="15.8" r="0.9" fill="#FFFFFF" stroke="none" />
    </>
  ),
  media_pack: (
    <>
      <rect x="3.6" y="7" width="13" height="11" rx="1.4" fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
      <path d="M3.6 9.6 H16.6" stroke="#FFFFFF" strokeWidth={1.3} />
      <circle cx="7.4" cy="13.2" r="1.5" fill="none" stroke="#FFFFFF" strokeWidth={1.3} />
      <path d="M11 16.4 L13.6 13.4 L16.6 16.6" fill="none" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.4 4.4 H20 V8" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16 V19.6 H16.4" fill="none" stroke="#FFFFFF" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  page_template: (
    <>
      <rect x="4" y="3.6" width="16" height="16.8" rx="1.6" fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
      <line x1="4" y1="9" x2="20" y2="9" stroke="#FFFFFF" strokeWidth={1.4} />
      <line x1="11" y1="9" x2="11" y2="20.4" stroke="#FFFFFF" strokeWidth={1.4} />
    </>
  ),
  prompt_history: (
    <>
      <path d="M12 5 A7.4 7.4 0 1 1 5.3 9.2" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M5.3 5.6 L5.3 9.2 L8.9 9.2" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 8.6 V12.4 L14.8 14.4" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  hotspot_map: (
    <>
      <path d="M12 3.6 C8.6 3.6 6 6.2 6 9.4 C6 13.6 12 19.6 12 19.6 C12 19.6 18 13.6 18 9.4 C18 6.2 15.4 3.6 12 3.6 Z" fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinejoin="round" />
      <circle cx="12" cy="9.4" r="2.1" fill="none" stroke="#FFFFFF" strokeWidth={1.4} />
    </>
  ),
};
const STAGE_RESOURCE_ICON: Record<string, string> = {
  room1: 'text_read',
  room2: 'audio_listen',
  room3: 'prompt_question',
  room4: 'image_view',
  room5: 'hotspot_map',
  room6: 'disclosure_text',
  stage1: 'text_read',
  stage2: 'reflection_write',
  stage3: 'prompt_question',
  stage4: 'selection_rubric',
  stage5: 'page_template',
  stage6: 'disclosure_text',
};
function ResourceIcon({
  type,
  platform,
  size = 18,
}: {
  type: string;
  platform: string;
  size?: number;
}) {
  const glyph = RESOURCE_ICON_GLYPHS[type];
  if (!glyph) return null;
  const isThingLink = platform === 'thinglink';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
      {isThingLink ? (
        <circle cx="12" cy="12" r="10.6" fill="#6B8E5E" stroke="#6B8E5E" strokeWidth={1.5} />
      ) : (
        <rect x="1.2" y="1.2" width="21.6" height="21.6" rx="5.5" fill="#B86B4A" stroke="#B86B4A" strokeWidth={1.4} />
      )}
      <g transform="translate(2.6,2.6) scale(0.78)">{glyph}</g>
    </svg>
  );
}
// ── VOICE CONTROL ─────────────────────────────────────────────
// CHANGED: mic is now attempted on every click, in-page or embedded. It
// falls back to "open in a full tab" ONLY on an actual browser refusal
// (not-allowed / service-not-allowed / audio-capture), not just because
// we detect an iframe. The iframe embeds already grant
// allow="microphone", so most embedded sessions should succeed in place.
function VoiceControl({
  active,
  blocked,
  embedded,
  onStart,
  onOpenTab,
}: {
  active: boolean;
  blocked: boolean;
  embedded: boolean; // kept in the prop signature for backwards compatibility; no longer forces fallback
  onStart: () => void;
  onOpenTab: () => void;
}) {
  if (blocked) {
    return (
      <button
        onClick={onOpenTab}
        className="absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full border bg-white border-neutral-200 text-neutral-500 hover:border-[#4B2E83]/60 hover:text-[#4B2E83] transition-all"
        aria-label="Open The Bridge in a new tab to use your voice"
        title="Voice input needs a full tab — opens The Bridge in a new tab"
      >
        <ExternalLink size={16} />
      </button>
    );
  }
  return (
    <button
      onClick={onStart}
      className={`absolute top-3 right-3 flex items-center justify-center w-9 h-9 rounded-full border transition-all ${
        active
          ? 'bg-red-500 border-red-500 text-white animate-pulse'
          : 'bg-white border-neutral-200 text-neutral-500 hover:border-[#4B2E83]/60 hover:text-[#4B2E83]'
      }`}
      aria-label={active ? 'Stop recording' : 'Speak your answer'}
      title={active ? 'Tap when you have finished speaking' : 'Speak your answer (Chrome/Edge)'}
    >
      {active ? <MicOff size={16} /> : <Mic size={16} />}
    </button>
  );
}
// ── SMART OFFLINE FALLBACK ────────────────────────────────────
const getOfflineDiagnostic = (
  stage: string,
  problem: string,
  envConditions: string[],
  effort: string,
  profileValues: string[] = []
): TeacherDiagnostic => {
  const hasLanguage = envConditions.includes('language');
  const hasOverwhelmed = envConditions.includes('overwhelmed');
  const hasNoisy = envConditions.includes('noisy');
  const hasBright = envConditions.includes('bright');
  const profileNote = profileValues.length > 0
    ? ` This student has told us they work best with: ${profileValues.join(', ')}.`
    : '';
  const envNote = [
    hasNoisy ? 'noisy environment' : '',
    hasBright ? 'bright/uncomfortable lighting' : '',
    hasLanguage ? 'language access need' : '',
    hasOverwhelmed ? 'feeling overwhelmed' : '',
  ].filter(Boolean).join(', ');
  // NOTE: language access is NOT a blocker on its own — it is a delivery
  // modality (see applyModality). It must never short-circuit the match, or a
  // learner who ticks "Language Access" and hits a real fault would get
  // language advice and the fault would never be routed to anyone.
  const fromLibrary = libraryDiagnostic(stage, problem);
  if (fromLibrary) {
    return profileNote
      ? { ...fromLibrary, diagnostic: fromLibrary.diagnostic + profileNote }
      : fromLibrary;
  }
  if (stage.startsWith('room1') || stage === 'room1') {
    return {
      barrierType: 'Cannot find where to start in the space',
      diagnostic: `The 360° room shows many directions at once, so there is no obvious first place to look. The student cannot pick a starting point, which is stopping any movement on the task. ${envNote ? `Contributing factors: ${envNote}.` : ''}`,
      intervention1: `Stand next to the student. Place your hand on their shoulder and guide their gaze to ONE specific hotspot. Say: "Start here — this one first." Remove the need to choose.`,
      intervention2: `Collapse the task: "You only need to find one thing right now — the record button. I'll show you." Cover or minimise other parts of the screen if possible to reduce visual field.`,
    };
  }
  if (stage === 'room5' || stage === 'stage5') {
    const p = problem.toLowerCase();
    if (p.includes('crowded') || p.includes('messy') || p.includes('too much')) {
      return {
        barrierType: 'Too much on the page at once',
        diagnostic: `Every element — text, audio, image, video, hotspots — is on the page together, so it is hard to read even for the student who built it. This is about how much is shown at once, not the content itself. ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Open "Reduce Clutter" at the top of this screen. Ask the student to pick only 3 things: what the audience should notice first, what supports meaning, and what can be removed.`,
        intervention2: `Point at the page and ask: "If you could only keep three things, what would they be?" Remove or hide the rest together, even temporarily.`,
      };
    }
    if (p.includes('order')) {
      return {
        barrierType: 'Unsure what order to build in',
        diagnostic: `The student has the right materials but cannot see the order to put them in. Naming the sequence, one step at a time, removes the blockage. ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Open "Build Order" at the top of this screen. It gives the fixed sequence — source text, main image, audio, video/movement, reflection. Walk through it one step at a time with the student.`,
        intervention2: `Say: "You don't need to plan the whole thing — just do step one first." Cover or hide the later steps until the current one is placed.`,
      };
    }
    if (p.includes('layout') || p.includes('finished')) {
      return {
        barrierType: 'Frozen by an empty page',
        diagnostic: `The student understands the content and has chosen their assets, but an empty page with no starting structure is hard to begin. Giving them a frame to edit gets them moving. ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Open "Start with a Template" at the top of this screen. It gives a ready-made layout — focal image, text block, audio button, optional video, reflection area — so the student edits an existing frame instead of building from nothing.`,
        intervention2: `Say: "You don't have to design this from scratch — just drop your pieces into these slots." Sit with them through the first slot only, then let them continue independently.`,
      };
    }
    return {
      barrierType: 'Stuck part-way through assembly',
      diagnostic: `The student is stuck while assembling this stage. ${effort ? `They already tried: ${effort}.` : ''} ${envNote ? `Environment: ${envNote}.` : ''}`,
      intervention1: `Open the three quick supports at the top of this screen — Reduce Clutter, Build Order, Start with a Template — and try whichever matches what's blocking them.`,
      intervention2: `Ask: "Show me the one part you're stuck on right now," and address only that piece before anything else.`,
    };
  }
  if (stage.startsWith('stage') || stage.startsWith('room')) {
    const isPromptStage = stage === 'room3' || stage === 'stage3';
    const isReflection = stage === 'room6' || stage === 'stage6';
    const isEmotion = stage === 'room2' || stage === 'stage2';
    const isSelection = stage === 'room4' || stage === 'stage4';
    if (isPromptStage) {
      return {
        barrierType: 'Has the picture but not the words',
        diagnostic: `The student can picture what they want but cannot yet find the words to write it as a prompt. This is about finding language, not about ability. ${effort ? `They already tried: ${effort}.` : ''} ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Sit with them and ask: "Show me what you're thinking — draw it, or describe one colour and one feeling." Use their words verbatim to build the first prompt line together. Model it once.`,
        intervention2: `Provide a sentence frame: "A [adjective] [noun] feeling [emotion], in the style of [reference]." Fill it in together from their description. Give them the scaffold, not the solution.`,
      };
    }
    if (isReflection) {
      return {
        barrierType: 'Open task feels like a test',
        diagnostic: `An open reflection with no single right answer can feel like a test, so the student stalls at the blank page. Naming that there is no wrong answer lowers the stakes. ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Reframe the task verbally: "This is not being marked for spelling or right answers — it's just your honest reaction." Give them three specific prompts: 'What surprised you?', 'What would you change?', 'What did the AI get wrong?'.`,
        intervention2: `Let them record a voice note instead of typing. If that's not available, you scribe while they talk. Remove the writing barrier first, then worry about format.`,
      };
    }
    if (isEmotion) {
      return {
        barrierType: 'Hard to name the feeling',
        diagnostic: `Naming an emotion in artistic work asks the student to notice a feeling and find a word for it. The student is not being evasive — a word bank or a body-sensation prompt gives them a way in. ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Offer a visual emotion wheel or word bank — point to it physically. Say: "Pick the one that's closest, even if it's not perfect." Remove the demand for precision.`,
        intervention2: `Simplify to body sensation: "Does this sound/image make you feel heavy or light? Fast or slow? Big or small?" Translate physical sensation into emotional vocabulary together.`,
      };
    }
    if (isSelection) {
      return {
        barrierType: 'Too many options to compare at once',
        diagnostic: `With every option visible at once, the student cannot hold them all in mind to compare. Reducing what is shown to two at a time makes the choice possible. ${envNote ? `Environment: ${envNote}.` : ''}`,
        intervention1: `Reduce visible choices immediately: cover or hide all but two options. Ask: "Which of these two?" Once chosen, introduce one more. Pair down, don't show all.`,
        intervention2: `Reconnect them to their original intention: "What feeling were you going for at the start?" Read it back to them from their earlier note. Anchor the decision in their own goal.`,
      };
    }
  }
  return {
    barrierType: 'Task Access Barrier — see interventions',
    diagnostic: `The student is blocked at this stage${stage ? ` (${stage})` : ''} and has reported: "${problem}". ${effort ? `They already tried: ${effort}.` : ''} ${envNote ? `Environmental factors: ${envNote}.` : ''} This appears to be a task-access barrier rather than a knowledge gap.`,
    intervention1: `Break the task into the single next physical action. Say: "Don't think about the whole thing — just do this one thing right now." Point to the exact control or text area they should interact with first.`,
    intervention2: `Check if the student needs a different input format. Offer to let them speak, draw, or dictate instead of type. Reduce the barrier to expression, not the expectation.`,
  };
};
// ── STAGE LABEL LOOKUP ────────────────────────────────────────
const STAGE_LABELS: Record<string, string> = {
  room1: 'Room 1: Voice & Source Material · The Voice Studio',
  room2: 'Room 2: Auditory & Visual Intent · The Green Lounge',
  room3: 'Room 3: Prompt Construction · The Prompt Lab',
  room4: 'Room 4: Review, Selection & Refinement · Critical Iteration',
  room5: 'Room 5: Assembly & Integration · The Production Studio',
  room6: 'Room 6: Publication & Reflection · The Premiere Room',
  stage1: 'Stage 1: Voice & Source',
  stage2: 'Stage 2: Interpretation',
  stage3: 'Stage 3: Prompt Construction & Asset Generation',
  stage4: 'Stage 4: Review, Selection & Refinement',
  stage5: 'Stage 5: Assembly & Integration',
  stage6: 'Stage 6: Publish & Reflect',
};
// ── QUICK SUPPORTS (per stage, "try any time") ────────────────
// In-widget interactive scaffolds. Stage/Room 3 has none (curriculum Prompt
// Builder owns it) and Stage/Room 5 keeps its bespoke Assembly panels above.
// Pointers name resources by title, never number, so they survive the Stage 6
// numbering collision. Items may be shared, or split by platform where the
// mechanics differ (Book Creator strips the mic; ThingLink has rooms/hotspots).
type QuickShape = 'checklist' | 'ordered' | 'slots';
interface QuickTool {
  id: string;
  name: string;
  purpose: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  shape: QuickShape;
  items: string[] | { bookcreator: string[]; thinglink: string[] };
  note?: string;
}
const QUICK_SUPPORTS: Record<number, QuickTool[]> = {
  1: [
    {
      id: 'find-start', name: 'Find your start', icon: MapPin, shape: 'ordered',
      purpose: 'One first move when the space or the page offers too many.',
      items: {
        thinglink: ['Stop moving the view. Let it settle.', 'Open the pin nearest the middle. Just that one.', "Read or listen to what's inside it.", "Come back out. You've started."],
        bookcreator: ["Stay on this page. Don't look ahead.", 'Find the poem and read the first line only.', 'Play the audio if there is one.', "That's a start. The rest waits."],
      },
    },
    {
      id: 'hear-your-way', name: 'Hear it your way', icon: Ear, shape: 'ordered',
      purpose: 'Three ways through when the audio moves too fast to follow.',
      items: ["Play it once. Don't try to catch every word.", 'Open the text or captions, then play it again.', 'Still too fast? Pause after each line and say it back to yourself.', 'Any of these counts as listening. Pick the one that works.'],
    },
  ],
  2: [
    {
      id: 'listen-one-thing', name: 'Listen for one thing', icon: Volume2, shape: 'ordered',
      purpose: 'Break "what does it feel like?" into single-answer passes.',
      items: ['Play it once with your eyes closed.', 'Play it again. Notice only the speed — fast or slow?', 'Play it once more. Notice only this — does it feel near, or far away?', "You now have two words. That's enough to start your Atmosphere Map."],
    },
    {
      id: 'look-one-part', name: 'Look at one part', icon: Eye, shape: 'ordered',
      purpose: 'Stop the whole image competing at once, so one detail can be read.',
      items: {
        thinglink: ['Stop moving the view.', 'Pick one object. Just one.', 'Say what it is, plainly. No meaning yet.', 'Now ask: is this thing close, or far away?', "Ask: would the poem miss it if it wasn't there?"],
        bookcreator: ['Pick one object. Just one.', 'Say what it is, plainly. No meaning yet.', 'Now ask: is this thing close, or far away?', "Ask: would the poem miss it if it wasn't there?"],
      },
    },
  ],
  4: [
    {
      id: 'two-at-a-time', name: 'Two at a time', icon: Scale, shape: 'ordered',
      purpose: 'Cut the comparison down to a size you can actually hold.',
      items: ['Hide every image except two.', 'Ask both the same question: which one stays truer to the poem?', 'Keep the winner. Bring in the next one.', 'Repeat until one is left.', "That's your choice. Now open Explain Your Decision to say why."],
    },
  ],
  6: [
    {
      id: 'ready-to-publish', name: 'Ready to publish?', icon: ClipboardCheck, shape: 'checklist',
      purpose: 'Five things you can check instead of "does this feel finished?"',
      items: ['Your public link opens for someone outside your class — no sign-in, no edit access.', 'Your hotspot route is clear, by keyboard and by pointer.', 'Text is readable and images have useful alt text.', 'Audio and video play, pause, and have a transcript or captions.', 'The poem, its creator, your media and any AI tools are all named — check your Credits & Disclosure and Accessibility guides.', "The route still keeps the poem's meaning and mood."],
    },
    {
      id: 'reflection', name: 'Your reflection', icon: PenLine, shape: 'ordered',
      purpose: 'Three questions instead of a blank page.',
      items: {
        thinglink: ['One choice I made was…', 'It stayed faithful to the poem because…', 'One thing I learned about combining voice, image and sound was…', 'One sentence each is enough. See the Publication & Reflection Toolkit.'],
        bookcreator: ['What did you decide before any AI was involved?', 'What did the AI actually make?', 'What did you change afterwards, and why?', "One sentence each is enough. It doesn't need to be tidy."],
      },
      note: 'ThingLink: you can record your answers here. Book Creator: type here, or record in Book Creator itself — its recorder works fine; only the Bridge embed cannot reach the microphone.',
    },
  ],
};
// ── SHARED SUPPORT RESULT ─────────────────────────────────────
interface TeacherDiagnostic {
  barrierType: string;
  diagnostic: string;
  intervention1: string;
  intervention2: string;
}
interface SupportResult {
  barrierType: string;
  liveDiagnostic: string;
  interventions: string[];
  studentActions: string[];
  studentSupport: string;
}
// ── PER-STAGE EMERGENCY LINES ─────────────────────────────────
// Last resort only: shown when even the API fallback cannot be reached.
// Learner-voiced, stage-aware, and platform-specific (Book Creator strips
// microphone permission, so BC lines never depend on voice). The richer,
// feature-specific guidance lives one tier up in getOfflineDiagnostic.
type EmergencyLine = { actions: [string, string]; support: string };
const STAGE_EMERGENCY: Record<'bookcreator' | 'thinglink', Record<number, EmergencyLine>> = {
  bookcreator: {
    1: { actions: ['Read just the first line of your source aloud to yourself — only that line.', 'Type one word from it onto your page. Any word.'], support: "You don't need the whole poem yet. One word on the page is a real start." },
    2: { actions: ['Pick one colour that matches the mood of your piece.', 'Choose the single line or image that gives you the strongest feeling.'], support: "There's no wrong answer here — your honest reaction is the work." },
    3: { actions: ['Build one prompt from three blocks: subject + one action + setting. Skip full sentences.', 'Write the subject block only, then stop — add the rest after.'], support: 'A rough first prompt is exactly right. It never has to be the final one.' },
    4: { actions: ['Put your two best options side by side and keep the one closer to your idea.', "Name one thing you'd change about it — just one."], support: "You're choosing, not starting over. Trust your first pick." },
    5: { actions: ['Open Build Order at the top and do only step one.', 'Drop one piece you already have onto the page — any one.'], support: "You don't have to build it all at once. One piece placed is progress." },
    6: { actions: ['Write one sentence about what surprised you in this project.', 'Answer just this: what would you change if you did it again?'], support: "Reflection isn't a test. Your honest thought is enough." },
  },
  thinglink: {
    1: { actions: ['Look at one spot in the room and ignore the rest for now.', 'Say or type three loose words about your idea — no order needed.'], support: "You don't have to take in the whole space at once. One spot is enough to begin." },
    2: { actions: ['Choose one sound or one colour in the room that matches your mood.', 'Point to the exact thing that gives you that feeling.'], support: "There's no wrong answer here — your honest reaction is the work." },
    3: { actions: ['Build one prompt from three blocks: subject + one action + setting.', 'Fill in the subject block only, then pause.'], support: 'A rough first prompt is exactly right. It never has to be the final one.' },
    4: { actions: ['Focus on one hotspot and look away from the rest.', 'Compare just two options and keep the one closer to your idea.'], support: "You're choosing, not starting over. Trust your first pick." },
    5: { actions: ["Place one placeholder pin, label it 'Draft', and move on without fine-tuning.", 'Open Build Order at the top and do only step one.'], support: "You don't have to perfect it now. One pin down is progress." },
    6: { actions: ['Write one sentence about what surprised you in this project.', 'Answer just this: what would you change if you did it again?'], support: "Reflection isn't a test. Your honest thought is enough." },
  },
};
const DEFAULT_EMERGENCY: EmergencyLine = {
  actions: ['Choose one small thing you can do right now and do only that.', 'If words are hard, try saying it out loud or drawing it instead.'],
  support: "You don't need to solve the whole task at once. One clear step is enough.",
};
const stageNumber = (stage: string): number => {
  const m = String(stage).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};
const emergencyLineFor = (stage: string, platform: string): EmergencyLine => {
  const key = platformFromStageKey(stage) ?? (platform === 'thinglink' ? 'thinglink' : platform === 'bookcreator' ? 'bookcreator' : null);
  const n = stageNumber(stage);
  if (key && STAGE_EMERGENCY[key][n]) return STAGE_EMERGENCY[key][n];
  return DEFAULT_EMERGENCY;
};
const emergencyStudentSupport = (teacher: TeacherDiagnostic, stage: string, platform: string, envConditions: string[] = []): SupportResult => {
  const line = emergencyLineFor(stage, platform);
  const studentActions: string[] = [...line.actions];
  let studentSupport = line.support;
  // Axis 2 — language is a delivery modality: reshape how the step lands.
  if (envConditions.includes('language')) {
    studentActions[1] = 'Say or note the idea first in the language that feels clearest to you, then move it into English.';
    studentSupport = 'Understanding the idea matters more than finding perfect English words right now.';
  }
  return {
    barrierType: teacher.barrierType,
    liveDiagnostic: teacher.diagnostic,
    interventions: [teacher.intervention1, teacher.intervention2].filter(Boolean),
    studentActions,
    studentSupport,
  };
};
// ── ROUTING (axis 1: what is blocking → where it goes) ─────────
// tech > environment > learning. Language/overwhelmed are axis-2 modalities
// (they shape wording, never the route) and are handled in the render.
type SupportRoute = 'tech' | 'environment' | 'learning';
const ESCALATING_ENV = ['noisy', 'bright', 'rushed'];
// The three technical faults, each with a stage-appropriate "while you wait".
const TECH_WAIT: Record<string, string> = {
  'BC-B6.3': "Keep working on your reflection — that doesn't need the link.",
  'TL-B5.3': "Sketch the order of your hotspots on paper. You'll place them faster once it's working.",
  'TL-B6.3': "Write your reflection now — you'll need it either way.",
};
interface RouteInfo {
  route: SupportRoute;
  barrierId: string | null;
  barrierType: string | null;
  techWait: string;
}
const resolveRoute = (stage: string, problem: string, envConditions: string[]): RouteInfo => {
  const matched = matchBarrierForStageKey(stage, problem)?.barrier ?? null;
  if (matched && matched.route === 'tech') {
    return {
      route: 'tech',
      barrierId: matched.id,
      barrierType: matched.type,
      techWait: TECH_WAIT[matched.id] ?? 'Ask your teacher for another task you can get on with in the meantime.',
    };
  }
  if (envConditions.some(id => ESCALATING_ENV.includes(id))) {
    return { route: 'environment', barrierId: matched?.id ?? null, barrierType: matched?.type ?? null, techWait: '' };
  }
  return { route: 'learning', barrierId: matched?.id ?? null, barrierType: matched?.type ?? null, techWait: '' };
};
// ── COMPONENT ─────────────────────────────────────────────────
export default function BridgeSupport({
  platform = '',
  stage = '',
  currentStage: _currentStage = '',
  isOpen = false,
  onClose = () => {},
  profile = [],
}: {
  platform?: string;
  stage?: string;
  currentStage?: string;
  isOpen?: boolean;
  onClose?: () => void;
  profile?: string[];
}) {
  const [step, setStep] = useState(1);
  const [envConditions, setEnvConditions] = useState<string[]>([]);
  const [problem, setProblem] = useState('');
  const [effort, setEffort] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState<'problem' | 'effort' | null>(null);
  const [diagnostic, setDiagnostic] = useState<SupportResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showTeacher, setShowTeacher] = useState(false);
  const [unit5Panel, setUnit5Panel] = useState<'clutter' | 'order' | 'template' | null>(null);
  const [clutterPicks, setClutterPicks] = useState<boolean[]>([false, false, false]);
  const [orderPicks, setOrderPicks] = useState<boolean[]>([false, false, false, false, false]);
  const [templatePicks, setTemplatePicks] = useState<boolean[]>(TEMPLATE_SLOTS.map(() => false));
  const [activeQuickTool, setActiveQuickTool] = useState<string | null>(null);
  const [quickPicks, setQuickPicks] = useState<Record<string, boolean[]>>({});
  const [profileValues, setProfileValues] = useState<string[]>(profile ?? []);
  const [profileReady, setProfileReady] = useState(false);
  const [showProfileStep, setShowProfileStep] = useState(false);
  useEffect(() => {
    if (profile && profile.length > 0) {
      setProfileValues(profile);
      setProfileReady(true);
      return;
    }
    const stored = readStoredProfile();
    if (stored) setProfileValues(stored);
    else setShowProfileStep(true);
    setProfileReady(true);
  }, [profile]);
  const toggleProfileValue = (value: string) => {
    setProfileValues(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };
  const saveProfile = () => {
    writeStoredProfile(profileValues);
    setShowProfileStep(false);
  };
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [micBlocked, setMicBlocked] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    try {
      setIsEmbedded(window.self !== window.top);
    } catch {
      setIsEmbedded(true);
    }
  }, []);
  // CHANGED: no longer forces the "open in tab" fallback just because we're
  // embedded. Mic is attempted in place first; only an actual permission
  // refusal (captured via onerror below) sets micBlocked -> fallback shown.
  const voiceNeedsFullTab = micBlocked;
  const inCapture = profileReady && !showProfileStep && step === 1;
  const openTopLevel = () => {
    if (typeof window === 'undefined') return;
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };
  if (!isOpen) return null;
  const stageLabel = STAGE_LABELS[stage] || stage || 'General Task';
  const platformLabel = platform === 'thinglink' ? 'ThingLink — Verse in the Void'
    : platform === 'bookcreator' ? 'Book Creator — Poetry in Motion'
    : 'General Learning';
  const suggestedProblems = Array.from(new Set([
    ...getChipsForStageKey(stage),
    ...(STAGE_PROBLEMS[stage] || FALLBACK_PROBLEMS),
  ]));
  const isAssemblyStage = stage === 'room5' || stage === 'stage5';
  const resourceIconType = STAGE_RESOURCE_ICON[stage];
  const toggleClutterPick = (i: number) => {
    setClutterPicks(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  };
  const toggleOrderPick = (i: number) => {
    setOrderPicks(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  };
  const toggleTemplatePick = (i: number) => {
    setTemplatePicks(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  };
  const quickToolsForStage = (s: string): QuickTool[] => QUICK_SUPPORTS[stageNumber(s)] ?? [];
  const resolveQuickItems = (tool: QuickTool): string[] =>
    Array.isArray(tool.items)
      ? tool.items
      : (platform === 'thinglink' ? tool.items.thinglink : tool.items.bookcreator);
  const toggleQuickPick = (toolId: string, i: number, len: number) => {
    setQuickPicks(prev => {
      const cur = prev[toolId] ?? Array(len).fill(false);
      return { ...prev, [toolId]: cur.map((v, idx) => (idx === i ? !v : v)) };
    });
  };
  const toggleEnv = (id: string) => {
    setEnvConditions(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };
  const applySuggestedProblem = (text: string) => {
    setProblem(prev => (prev.trim() ? `${prev.trim()}; ${text}` : text));
  };
  const resetAndClose = () => {
    setStep(1);
    setEnvConditions([]);
    setProblem('');
    setEffort('');
    setDiagnostic(null);
    setAiError(null);
    setShowTeacher(false);
    setUnit5Panel(null);
    setClutterPicks([false, false, false]);
    setOrderPicks([false, false, false, false, false]);
    setTemplatePicks(TEMPLATE_SLOTS.map(() => false));
    setActiveQuickTool(null);
    setQuickPicks({});
    onClose();
  };
  // ── SPEAK-TO-TRANSCRIBE ────────────────────────────────────
  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null;
    setIsListening(null);
    setInterim('');
  };
  const startListening = (target: 'problem' | 'effort') => {
    if (typeof window === 'undefined') return;
    if (isListening) {
      stopListening();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setMicBlocked(true);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-GB';
    setIsListening(target);
    setInterim('');
    recognition.onresult = (event: any) => {
      let settled = '';
      let pending = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) settled += result[0].transcript;
        else pending += result[0].transcript;
      }
      if (settled.trim()) {
        const addition = settled.trim();
        if (target === 'problem') {
          setProblem(prev => (prev.trim() ? `${prev.trim()} ${addition}` : addition));
        } else {
          setEffort(prev => (prev.trim() ? `${prev.trim()} ${addition}` : addition));
        }
      }
      setInterim(pending);
    };
    recognition.onerror = (event: any) => {
      // A pause is not a failure — keep the session alive.
      if (event?.error === 'no-speech' || event?.error === 'aborted') return;
      // Only an actual refusal falls back to "open in tab" now.
      if (
        event?.error === 'not-allowed' ||
        event?.error === 'service-not-allowed' ||
        event?.error === 'audio-capture'
      ) {
        setMicBlocked(true);
      }
      setIsListening(null);
      setInterim('');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(null);
      setInterim('');
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setMicBlocked(true);
      setIsListening(null);
      setInterim('');
    }
  };
  // ── SHARED SUPPORT CALL ────────────────────────────────────
  const generateSupport = async () => {
    setIsGenerating(true);
    setAiError(null);
    const environment = ENV_CHIPS.filter(chip => envConditions.includes(chip.id)).map(chip => chip.label);
    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platformLabel,
          stage,
          stageDescription: stageLabel,
          profile: profileValues,
          environment,
          problem,
          effort,
        }),
      });
      if (!res.ok) throw new Error(`Support request failed with ${res.status}`);
      const payload = await res.json();
      const support = payload?.support as SupportResult | undefined;
      if (!support || !Array.isArray(support.studentActions) || support.studentActions.length < 2 || !support.studentSupport) {
        throw new Error('Incomplete support response');
      }
      setDiagnostic(support);
      if (payload.source === 'fallback') setAiError(payload.reason === 'offline' ? 'offline' : 'network');
    } catch (err) {
      console.error('BridgeSupport request error:', err);
      setDiagnostic(emergencyStudentSupport(getOfflineDiagnostic(stage, problem, envConditions, effort, profileValues), stage, platform, envConditions));
      setAiError('network');
    } finally {
      setIsGenerating(false);
    }
  };
  // ── MINIMAL OUTCOME EVIDENCE ──────────────────────────────
  const submitFeedback = (helpful: boolean) => {
    const payload = JSON.stringify({
      helpful,
      platform: platform || 'general',
      stage: stage || 'general',
      source: aiError ? 'fallback' : 'ai',
    });

    void fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(err => {
      console.error('Support feedback request failed:', err);
    });

    resetAndClose();
  };
  // ── ROUTING + TEACHER NOTE (axis 1) ───────────────────────
  const routeInfo = resolveRoute(stage, problem, envConditions);
  const envLabels = ENV_CHIPS.filter(c => envConditions.includes(c.id)).map(c => c.label);
  const teacherNote = routeInfo.route === 'tech'
    ? `This learner is blocked by a technical problem at ${stageLabel} and needs something else to do.${envLabels.length ? ` They also flagged: ${envLabels.join(', ')}.` : ''}`
    : '';
  const techContext = [
    `Where: ${platformLabel} · ${stageLabel}`,
    routeInfo.barrierId ? `Matched fault: ${routeInfo.barrierId} — ${routeInfo.barrierType}` : 'Matched fault: none identified',
    `Context: ${isEmbedded ? 'embedded iframe' : 'full tab'} · ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown agent'}`,
    `Reported: ${new Date().toLocaleString('en-GB')}`,
    `AI layer: ${aiError === 'offline' ? 'unreachable' : 'reachable'}`,
  ];
  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm p-4">
   <div className="w-full max-w-lg max-h-[90vh] bg-[#FAFAEE] rounded-2xl shadow-xl overflow-hidden border border-neutral-200 flex flex-col">
        {/* ── HEADER ── */}
        <div className="px-6 py-5 border-b border-[#2D2730]/15 flex justify-between items-center bg-[#FAFAEE]">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <HelpCircle className="text-[#4B2E83] shrink-0" size={20} />
              <h2 className="text-base font-bold text-[#2D2730] leading-tight">
                Get Support
              </h2>
            </div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold pl-7">
              {platformLabel}
            </p>
            {stageLabel && stageLabel !== 'General Task' && (
              <p className="text-xs text-[#4B2E83] font-semibold pl-7 flex items-center gap-1.5">
                {resourceIconType && (
                  <ResourceIcon type={resourceIconType} platform={platform} size={16} />
                )}
                {stageLabel}
              </p>
            )}
          </div>
          <button
            onClick={resetAndClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans">
          {/* ── STEP 0: THINKING PROFILE — first run only ── */}
          {profileReady && showProfileStep && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#2D2730] mb-1">
                  How do you work best?
                </h3>
                <p className="text-sm text-neutral-500">
                  Everything here is optional, and you are only asked once. It helps your
                  teacher respond to you specifically rather than generally.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  Conditions (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_CONDITIONS.map(item => (
                    <button
                      key={item}
                      onClick={() => toggleProfileValue(item)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        profileValues.includes(item)
                          ? 'bg-[#4B2E83] text-white border-[#4B2E83]'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#4B2E83]/30'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  What helps you work best (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_STRENGTHS.map(item => (
                    <button
                      key={item}
                      onClick={() => toggleProfileValue(item)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        profileValues.includes(item)
                          ? 'bg-[#4B2E83] text-white border-[#4B2E83]'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#4B2E83]/30'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  className="flex-1 py-3.5 bg-[#4B2E83] text-white rounded-xl font-bold hover:bg-[#3A2467] transition-all"
                >
                  {profileValues.length > 0 ? 'Save and continue' : 'Continue'}
                </button>
                <button
                  onClick={saveProfile}
                  className="px-4 py-3.5 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-500 hover:border-neutral-300 transition-all"
                >
                  Skip
                </button>
              </div>
              <p className="text-xs text-neutral-400">
                Saved on this device only. You can change it any time from the next screen.
              </p>
            </div>
          )}
          {/* ── STEP 1: SINGLE CAPTURE (or a Unit 5 quick-support panel) ── */}
          {inCapture && isAssemblyStage && unit5Panel === 'clutter' && (
            <div className="space-y-5">
              <button
                onClick={() => setUnit5Panel(null)}
                className="text-xs font-semibold text-[#4B2E83] flex items-center gap-1"
              >
                <ArrowRight size={14} className="rotate-180" /> Back to support
              </button>
              <div>
                <h3 className="text-base font-bold text-[#2D2730] mb-1">Reduce Clutter</h3>
                <p className="text-sm text-neutral-500">Choose the 3 most important elements only. Tick each one off as you decide.</p>
              </div>
              <div className="space-y-2">
                {CLUTTER_QUESTIONS.map((q, i) => (
                  <button
                    key={q}
                    onClick={() => toggleClutterPick(i)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      clutterPicks[i] ? 'border-green-400 bg-green-50' : 'border-neutral-200 hover:border-[#4B2E83]/30'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full border shrink-0 ${
                      clutterPicks[i] ? 'bg-green-500 border-green-500 text-white' : 'border-neutral-300 text-transparent'
                    }`}>
                      <Check size={14} />
                    </span>
                    <span className="text-sm text-neutral-700 font-medium">{q}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUnit5Panel(null)}
                className="w-full py-3 bg-neutral-800 text-white rounded-xl font-medium hover:bg-black transition-colors"
              >
                Done — back to support
              </button>
            </div>
          )}
          {inCapture && isAssemblyStage && unit5Panel === 'order' && (
            <div className="space-y-5">
              <button
                onClick={() => setUnit5Panel(null)}
                className="text-xs font-semibold text-[#4B2E83] flex items-center gap-1"
              >
                <ArrowRight size={14} className="rotate-180" /> Back to support
              </button>
              <div>
                <h3 className="text-base font-bold text-[#2D2730] mb-1">Build Order</h3>
                <p className="text-sm text-neutral-500">Follow this fixed sequence. Tick off each step as you place it.</p>
              </div>
              <div className="space-y-2">
                {BUILD_ORDER_STEPS.map((s, i) => (
                  <button
                    key={s}
                    onClick={() => toggleOrderPick(i)}
                    className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      orderPicks[i] ? 'border-green-400 bg-green-50' : 'border-neutral-200 hover:border-[#4B2E83]/30'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-bold shrink-0 ${
                      orderPicks[i] ? 'bg-green-500 border-green-500 text-white' : 'border-neutral-300 text-neutral-400'
                    }`}>
                      {orderPicks[i] ? <Check size={14} /> : i + 1}
                    </span>
                    <span className="text-sm text-neutral-700 font-medium">{s}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUnit5Panel(null)}
                className="w-full py-3 bg-neutral-800 text-white rounded-xl font-medium hover:bg-black transition-colors"
              >
                Done — back to support
              </button>
            </div>
          )}
          {inCapture && isAssemblyStage && unit5Panel === 'template' && (
            <div className="space-y-5">
              <button
                onClick={() => setUnit5Panel(null)}
                className="text-xs font-semibold text-[#4B2E83] flex items-center gap-1"
              >
                <ArrowRight size={14} className="rotate-180" /> Back to support
              </button>
              <div>
                <h3 className="text-base font-bold text-[#2D2730] mb-1">Start with a Template</h3>
                <p className="text-sm text-neutral-500">Build your page in these slots instead of a blank page. Tick each one off as you add it.</p>
              </div>
              <div className="rounded-xl border-2 border-dashed border-[#4B2E83]/30 bg-[#4B2E83]/5 p-3 space-y-2">
                {TEMPLATE_SLOTS.map((slot, i) => (
                  <button
                    key={slot}
                    onClick={() => toggleTemplatePick(i)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
                      templatePicks[i] ? 'border-green-400 bg-green-50 text-neutral-700' : 'bg-white border-neutral-200 text-neutral-600 hover:border-[#4B2E83]/40'
                    }`}
                  >
                    <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${
                      templatePicks[i] ? 'bg-green-500 text-white' : 'bg-[#4B2E83]/15 text-[#4B2E83]'
                    }`}>
                      {templatePicks[i] ? <Check size={12} /> : i + 1}
                    </span>
                    {slot}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setUnit5Panel(null)}
                className="w-full py-3 bg-neutral-800 text-white rounded-xl font-medium hover:bg-black transition-colors"
              >
                Got it — back to support
              </button>
            </div>
          )}
          {inCapture && activeQuickTool !== null && (() => {
            const tool = quickToolsForStage(stage).find(t => t.id === activeQuickTool);
            if (!tool) return null;
            const items = resolveQuickItems(tool);
            const picks = quickPicks[tool.id] ?? items.map(() => false);
            const ToolIcon = tool.icon;
            return (
              <div className="space-y-5">
                <button
                  onClick={() => setActiveQuickTool(null)}
                  className="text-xs font-semibold text-[#4B2E83] flex items-center gap-1"
                >
                  <ArrowRight size={14} className="rotate-180" /> Back to support
                </button>
                <div className="flex items-center gap-2">
                  <ToolIcon size={18} className="text-[#4B2E83]" />
                  <h3 className="text-base font-bold text-[#2D2730]">{tool.name}</h3>
                </div>
                <p className="text-sm text-neutral-500">{tool.purpose}</p>
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <button
                      key={i}
                      onClick={() => toggleQuickPick(tool.id, i, items.length)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${
                        picks[i] ? 'border-green-400 bg-green-50' : 'border-neutral-200 hover:border-[#4B2E83]/30'
                      }`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full border text-[11px] font-bold shrink-0 ${
                        picks[i] ? 'bg-green-500 border-green-500 text-white' : 'border-neutral-300 text-neutral-400'
                      }`}>
                        {picks[i] ? <Check size={14} /> : (tool.shape === 'checklist' ? '' : i + 1)}
                      </span>
                      <span className="text-sm text-neutral-700 font-medium">{it}</span>
                    </button>
                  ))}
                </div>
                {tool.note && <p className="text-xs text-neutral-500 leading-relaxed">{tool.note}</p>}
                <button
                  onClick={() => setActiveQuickTool(null)}
                  className="w-full py-3 bg-neutral-800 text-white rounded-xl font-medium hover:bg-black transition-colors"
                >
                  Done — back to support
                </button>
              </div>
            );
          })()}
          {inCapture && unit5Panel === null && activeQuickTool === null && (
            <div className="space-y-6">
              {quickToolsForStage(stage).length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                    Quick supports — try any time
                  </label>
                  <div className={`grid gap-2 ${quickToolsForStage(stage).length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {quickToolsForStage(stage).map(tool => {
                      const ToolIcon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => setActiveQuickTool(tool.id)}
                          className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:border-[#4B2E83]/60 hover:bg-[#4B2E83]/5 transition-all text-center"
                        >
                          <ToolIcon size={18} className="text-[#4B2E83]" />
                          <span className="text-xs font-semibold text-neutral-700">{tool.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {isAssemblyStage && (
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                    Quick supports for Unit 5 — try any time
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setUnit5Panel('clutter')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:border-[#4B2E83]/60 hover:bg-[#4B2E83]/5 transition-all text-center"
                    >
                      <Layers size={18} className="text-[#4B2E83]" />
                      <span className="text-xs font-semibold text-neutral-700">Reduce Clutter</span>
                    </button>
                    <button
                      onClick={() => setUnit5Panel('order')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:border-[#4B2E83]/60 hover:bg-[#4B2E83]/5 transition-all text-center"
                    >
                      <ListOrdered size={18} className="text-[#4B2E83]" />
                      <span className="text-xs font-semibold text-neutral-700">Build Order</span>
                    </button>
                    <button
                      onClick={() => setUnit5Panel('template')}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-neutral-200 hover:border-[#4B2E83]/60 hover:bg-[#4B2E83]/5 transition-all text-center"
                    >
                      <LayoutTemplate size={18} className="text-[#4B2E83]" />
                      <span className="text-xs font-semibold text-neutral-700">Use a Template</span>
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-3 text-xs">
                <p className="text-neutral-500">
                  {profileValues.length > 0 ? (
                    <>
                      <span className="font-semibold text-neutral-600">How you work best:</span>{' '}
                      {profileValues.join(' · ')}
                    </>
                  ) : (
                    <span className="text-neutral-400">No thinking profile set.</span>
                  )}
                </p>
                <button
                  onClick={() => setShowProfileStep(true)}
                  className="shrink-0 font-semibold text-[#4B2E83] hover:underline"
                >
                  {profileValues.length > 0 ? 'Change' : 'Add one'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
                  Quick check — how's the room right now?
                </label>
                <div className="flex flex-wrap gap-2">
                  {ENV_CHIPS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => toggleEnv(id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                        envConditions.includes(id)
                          ? 'bg-[#4B2E83] text-white border-[#4B2E83]'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-[#4B2E83]/30'
                      }`}
                    >
                      <Icon size={14} strokeWidth={1.8} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-base font-semibold text-neutral-700 mb-2">
                  What's going on right now?
                </label>
                <div className="relative">
                  <textarea
                    className="w-full p-4 pr-14 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm focus:ring-2 focus:ring-[#4B2E83] outline-none min-h-[90px] resize-none"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Describe what's happening — there's no wrong way to say it"
                  />
                  <VoiceControl
                    active={isListening === 'problem'}
                    blocked={micBlocked}
                    embedded={false}
                    onStart={() => startListening('problem')}
                    onOpenTab={openTopLevel}
                  />
                </div>
                {voiceNeedsFullTab && (
                  <p className="text-xs text-neutral-500 mt-2">
                    Microphone access isn't available here. Tap the ↗ button to open The Bridge in its own tab, then speak there.
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestedProblems.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => applySuggestedProblem(opt)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-[#4B2E83]/30 hover:bg-[#4B2E83]/5 hover:text-[#3A2467] transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  What have you already tried? <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    className="w-full p-4 pr-14 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm focus:ring-2 focus:ring-[#4B2E83] outline-none min-h-[70px] resize-none"
                    value={effort}
                    onChange={(e) => setEffort(e.target.value)}
                    placeholder="e.g., I re-read the poem, I tried a different prompt..."
                  />
                  <VoiceControl
                    active={isListening === 'effort'}
                    blocked={micBlocked}
                    embedded={false}
                    onStart={() => startListening('effort')}
                    onOpenTab={openTopLevel}
                  />
                </div>
              </div>
              {isListening && (
                <div className="rounded-xl border border-red-200 bg-red-50/60 px-3 py-2.5">
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Listening — take your time. Pauses are fine.
                  </p>
                  {interim && (
                    <p className="text-sm text-neutral-600 italic mt-1.5 leading-relaxed">{interim}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Tap the microphone again when you have finished.
                  </p>
                </div>
              )}
              <button
                onClick={() => { setStep(2); generateSupport(); }}
                disabled={!problem.trim()}
                className="w-full py-4 bg-[#4B2E83] text-white rounded-xl font-bold hover:bg-[#3A2467] transition-all disabled:opacity-40"
              >
                Show me my next step
              </button>
            </div>
          )}
          {/* ── STEP 2: LEARNER SUPPORT OUTPUT ── */}
          {profileReady && step === 2 && (
            <div className="space-y-5 text-left">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <RefreshCw className="animate-spin text-[#4B2E83]" size={32} />
                  <p className="text-sm text-neutral-500 font-medium">Finding your next step…</p>
                </div>
              ) : diagnostic ? (
                <>
                  {aiError === 'offline' && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>AI is unavailable — showing evidence-based support instead.</span>
                    </div>
                  )}
                  {aiError === 'network' && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>Connection issue — showing a safe next step you can use now.</span>
                    </div>
                  )}

                  {routeInfo.route === 'tech' ? (
                    /* ── TECH FAULT — learner-facing ── */
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-[#4B2E83]/10 text-[#4B2E83] rounded-full shrink-0">
                          <Wrench size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-[#2D2730] leading-tight">This one isn&apos;t you</h3>
                      </div>
                      <div className="p-4 rounded-xl bg-[#2D2730] text-[#FAFAEE]">
                        <p className="text-sm font-medium leading-relaxed">{"Something isn't working properly. That's a fault with the tool, not with your work — and nothing you've done is lost."}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-[#2D2730]/15 bg-white">
                        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">What to do now</h4>
                        <p className="text-sm text-[#2D2730] leading-relaxed">{"Tell your teacher this is a technical problem, not a stuck point."}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-[#4B2E83]/15 bg-[#4B2E83]/5">
                        <h4 className="text-[10px] font-bold text-[#4B2E83]/60 uppercase tracking-wider mb-1">While you wait</h4>
                        <p className="text-sm text-[#2D2730] leading-relaxed">{routeInfo.techWait}</p>
                      </div>
                    </div>
                  ) : (
                    /* ── LEARNING / ENVIRONMENT — learner-facing ── */
                    <>
                      {routeInfo.route === 'environment' && (
                        <div className="p-4 rounded-xl border border-[#B86B4A]/30 bg-[#B86B4A]/5 space-y-1">
                          <h3 className="text-base font-bold text-[#2D2730] leading-tight">This one needs your teacher</h3>
                          <p className="text-sm text-[#2D2730] leading-relaxed">{"A noisy or bright room isn't something you can fix on your own, and you shouldn't have to. Show them this."}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 rounded-full shrink-0">
                          <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-[#2D2730] leading-tight">Let&apos;s get you moving again</h3>
                      </div>
                      <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-[#2D2730] text-[#FAFAEE]">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">One clear next step</h4>
                          <p className="text-sm font-medium leading-relaxed">{diagnostic.studentActions[0]}</p>
                        </div>
                        {diagnostic.studentActions[1] && (
                          <div className="p-4 rounded-xl border border-[#2D2730]/15 bg-white">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Another way in</h4>
                            <p className="text-sm text-[#2D2730] leading-relaxed">{diagnostic.studentActions[1]}</p>
                          </div>
                        )}
                        <div className="p-4 rounded-xl border border-[#4B2E83]/15 bg-[#4B2E83]/5">
                          <h4 className="text-[10px] font-bold text-[#4B2E83]/60 uppercase tracking-wider mb-1">Remember</h4>
                          <p className="text-sm text-[#2D2730] leading-relaxed">{diagnostic.studentSupport}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── GATE + adult-facing detail ── */}
                  {routeInfo.route === 'tech' ? (
                    <div className="space-y-3">
                      {teacherNote && (
                        <div className="p-3 rounded-lg border border-[#2D2730]/15 bg-white">
                          <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">For your teacher</h4>
                          <p className="text-sm text-[#2D2730] leading-relaxed">{teacherNote}</p>
                        </div>
                      )}
                      {showTeacher ? (
                        <div className="rounded-xl border border-[#2D2730]/20 bg-white p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Wrench size={16} className="text-[#4B2E83]" />
                            <h4 className="text-sm font-bold text-[#2D2730]">Technical fault — for support</h4>
                          </div>
                          <p className="text-sm text-[#2D2730] leading-relaxed"><span className="font-semibold">What the learner reported:</span> “{problem}”</p>
                          <ul className="text-xs text-neutral-600 leading-relaxed space-y-0.5">
                            {techContext.map(line => <li key={line}>{line}</li>)}
                          </ul>
                          <p className="text-xs text-[#4B2E83] font-medium">{"First check: test the published link in a private window before changing anything."}</p>
                        </div>
                      ) : (
                        <button onClick={() => setShowTeacher(true)} className="w-full py-3 rounded-xl border border-[#2D2730]/20 bg-white text-sm font-bold text-[#2D2730] hover:border-[#4B2E83]/50 transition-colors">Show the technical details</button>
                      )}
                    </div>
                  ) : (
                    showTeacher ? (
                      <div className="rounded-xl border border-[#2D2730]/20 bg-white p-4 space-y-3">
                        <h3 className="text-base font-bold text-[#2D2730]">For your teacher</h3>
                        <div>
                          <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">What&apos;s blocking this</h4>
                          <p className="text-sm text-[#2D2730] leading-relaxed">{diagnostic.barrierType}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">What&apos;s happening</h4>
                          <p className="text-sm text-[#2D2730] leading-relaxed">{diagnostic.liveDiagnostic}</p>
                        </div>
                        {diagnostic.interventions[0] && (
                          <div>
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Try this first</h4>
                            <p className="text-sm text-[#2D2730] leading-relaxed">{diagnostic.interventions[0]}</p>
                          </div>
                        )}
                        {diagnostic.interventions[1] && (
                          <div>
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">If that doesn&apos;t work</h4>
                            <p className="text-sm text-[#2D2730] leading-relaxed">{diagnostic.interventions[1]}</p>
                          </div>
                        )}
                        {envLabels.length > 0 && (
                          <p className="text-xs text-neutral-500">Environment flagged: {envLabels.join(', ')}.</p>
                        )}
                      </div>
                    ) : (
                      <button onClick={() => setShowTeacher(true)} className="w-full py-3 rounded-xl border border-[#2D2730]/20 bg-white text-sm font-bold text-[#2D2730] hover:border-[#4B2E83]/50 transition-colors flex items-center justify-center gap-2">
                        <UserRound size={16} /> Show my teacher
                      </button>
                    )
                  )}

                  <div className="rounded-xl border border-[#2D2730]/15 bg-white p-4">
                    <p className="text-sm font-semibold text-[#2D2730] mb-3">Did this help?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => submitFeedback(true)}
                        className="min-h-11 rounded-lg border border-[#4B2E83] bg-[#4B2E83] text-sm font-bold text-white hover:bg-[#3A2467] transition-colors"
                        aria-label="Yes, this helped"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => submitFeedback(false)}
                        className="min-h-11 rounded-lg border border-[#2D2730]/20 bg-white text-sm font-bold text-[#2D2730] hover:border-[#4B2E83]/50 transition-colors"
                        aria-label="No, this did not help"
                      >
                        No
                      </button>
                    </div>
                  </div>
                  <button onClick={resetAndClose} className="w-full py-4 bg-[#4B2E83] text-white rounded-xl font-bold hover:bg-[#3A2467] transition-all">Done</button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
