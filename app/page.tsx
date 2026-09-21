'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  Layout,
  Zap,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Eye,
  Brain,
  FileText,
  RefreshCw,
  Mic,
  ShieldCheck,
  UserCircle,
  Sun,
  Users,
  LifeBuoy,
  Send,
  ListChecks,
  CheckCheck,
} from 'lucide-react';
// ── TYPES ────────────────────────────────────────────────────
type Platform = 'ThingLink' | 'Book Creator';
type CheckIn = 'okay' | 'unsure' | 'barrier' | 'task_support' | null;
type SupportMode = 'student' | 'teacher' | null;
interface Diagnostic {
  barrierType: string;
  liveDiagnostic: string;
  interventions: string[];
  studentActions: string[];
  studentSupport: string;
}
interface StepData {
  environment: string[];
  environmentNote: string;
  neurodiversity: string[];
  profileNote: string;
  checkIn: CheckIn;
  situation: {
    platform: Platform;
    stage: string;
    context: string;
    issueTags: string[];
  };
  supportMode: SupportMode;
  diagnostic: Diagnostic | null;
}
// ── ENV OPTIONS (physical classroom context) ─────────────────
const ENV_OPTIONS = [
  { id: 'bright_light', label: 'Lights Are Too Bright', icon: Sun },
  { id: 'dim_light', label: 'Hard to See Clearly', icon: Eye },
  { id: 'noisy', label: 'Too Noisy in the Room', icon: Volume2 },
  { id: 'crowded', label: 'Not Enough Space', icon: Users },
  { id: 'screen', label: 'Too Much on the Screen', icon: Layout },
  { id: 'pacing', label: 'Feeling Rushed / No Time', icon: Zap },
  { id: 'complexity', label: 'Too Much to Think About', icon: Brain },
];
// ── CONDITIONS + WHAT HELPS (Step 1 split) ─────────────────────
// Conditions = diagnostic/identity labels. What Helps = functional/support
// needs. Kept separate so a student isn't forced to self-identify with a
// diagnosis just to flag a functional need. Both feed the same
// data.neurodiversity array under the hood — nothing downstream
// (AI prompts, summaries) needs to change.
const CONDITIONS = [
  'ADHD', 'Autism', 'Dyslexia', 'Dyspraxia', 'Dyscalculia', 'Tourette Syndrome', 'Hyperlexia',
];
const WHAT_HELPS = [
  'Sensory Processing', 'Processing Speed', 'Working Memory', 'Executive Function',
];
// Plain-language glossary for the "What do these mean?" toggle — written at
// a student-friendly reading level, not clinical definitions.
const GLOSSARY: Record<string, string> = {
  'ADHD': 'Attention-Deficit/Hyperactivity Disorder. Can affect focus, impulse control, and managing energy levels.',
  'Autism': 'A different way of processing the world — sensory input, social communication, and routines may feel different to you than to others.',
  'Dyslexia': 'A difference in how the brain processes written language. Can affect reading speed, spelling, and decoding words.',
  'Dyspraxia': 'Also called Developmental Coordination Disorder. Can affect physical coordination, planning movements, and organising tasks.',
  'Dyscalculia': 'A difference in how the brain processes numbers and maths concepts.',
  'Tourette Syndrome': 'A condition involving repetitive, involuntary movements or sounds called tics.',
  'Hyperlexia': 'An advanced ability to read words, sometimes alongside difficulty understanding spoken language or social cues.',
  'Sensory Processing': 'How you take in and respond to sound, light, touch, and other sensory information. Some environments may feel too much or too little.',
  'Processing Speed': 'How quickly you take in information, think it through, and respond. This is separate from how smart or capable you are.',
  'Working Memory': 'Your ability to hold and use information in your mind for a short time — like following multi-step instructions.',
  'Executive Function': 'The mental skills used to plan, start tasks, stay organised, and manage time.',
};
// ── PLATFORMS (module selector — kept for V2 testing only.
//    Production single-project Bridges should drop this picker entirely
//    and hardcode their own platform + stage list.) ────────────
const PLATFORMS: { id: Platform; label: string; description: string }[] = [
  {
    id: 'ThingLink',
    label: 'ThingLink',
    description: 'Immersive 360° poetry design — Verse in the Void (6 Rooms)'
  },
  {
    id: 'Book Creator',
    label: 'Book Creator',
    description: 'Multimedia poetry publishing — 6-Stage Poetry Project'
  },
];
// ── STAGES (room / stage selector per platform) ───────────────
const STAGES: Record<Platform, { id: string; label: string; description: string }[]> = {
  ThingLink: [
    {
      id: 'room1', label: 'Room 1: Voice & Source Material',
      description: 'Students are capturing, organising, and reflecting on voice recordings and source audio material inside a 360° immersive space. The task involves navigating spatial hotspots to gather and anchor material — spatial disorientation, sensory overload, and difficulty knowing where to start are common friction points at this opening stage.',
    },
    {
      id: 'room2', label: 'Room 2: Auditory Intent',
      description: 'Students are analysing the emotional and auditory intent of their source material — identifying how sound conveys meaning in the poem. The task requires sustained listening and abstract thinking inside a visually rich 360° environment.',
    },
    {
      id: 'room3', label: 'Room 3: The Prompt Lab',
      description: 'Students are constructing AI image and video prompts by translating poetic emotion into precise visual language. This is a high-cognitive-load task — students must bridge abstract feeling with concrete descriptive text while navigating multiple hotspot tools.',
    },
    {
      id: 'room4', label: 'Room 4: Critical Iteration',
      description: 'Students are critically reviewing AI-generated visual assets and making selection and refinement decisions. The task demands executive function and aesthetic judgment — decision fatigue and perfectionism are common blockers at this stage.',
    },
    {
      id: 'room5', label: 'Room 5: Assembly & Integration',
      description: 'Students are assembling and integrating their finished elements — hotspots, scenes, and assets — into one coherent final sequence. The task involves reducing clutter, deciding what the audience sees first, and putting hotspots in a clear, deliberate order. Page/scene clutter, unclear ordering, and not knowing what the audience sees first are the common friction points at this stage.',
    },
    {
      id: 'room6', label: 'Room 6: The Premiere Room',
      description: 'Students are completing their immersive poem — writing their reflection, making ethical AI disclosure statements, and preparing for publication. Emotional pressure around "finishing" and disclosure anxiety are common barriers at this final stage.',
    },
  ],
  'Book Creator': [
    {
      id: 'stage1', label: 'Stage 1: Meaning & Source',
      description: 'Students are reading and analysing source poems to extract core meaning, personal response, and thematic content. The task requires close reading and inference — decoding dense or unfamiliar language is a significant barrier for students with dyslexia, processing differences, or for whom the dialect/register of the poem is unfamiliar.',
    },
    {
      id: 'stage2', label: 'Stage 2: Voice, Tone & Emotion',
      description: 'Students are identifying the emotional register and poetic voice they want to bring to their own creative response. This abstract metacognitive task — naming feeling and tone — can be particularly challenging for students with alexithymia or executive function differences.',
    },
    {
      id: 'stage3', label: 'Stage 3: Image Prompt Construction',
      description: 'Students are writing detailed prompts to generate AI images that capture the emotional intent of their poem. This requires bridging inner feeling with precise descriptive language — a high executive function demand that can cause creative block and frustration.',
    },
    {
      id: 'stage4', label: 'Stage 4: Review & Selection',
      description: 'Students are reviewing AI-generated images and selecting the most effective outputs for their poetry book. Decision fatigue, self-doubt about aesthetic choices, and difficulty comparing multiple options are common blockers at this stage.',
    },
    {
      id: 'stage5', label: 'Stage 5: Image-to-Video / Motion',
      description: 'Students are using image-to-video tools to add motion and atmosphere to their selected images. Pacing pressure, tool complexity, and the gap between intention and output can cause frustration — especially for students with dyspraxia or processing speed differences.',
    },
    {
      id: 'stage6', label: 'Stage 6: Publish, Reflect & Disclose',
      description: 'Students are completing their poetry book — writing a reflective commentary and disclosing their AI tool use before publication. Anxiety about public-facing work, difficulty articulating process in writing, and disclosure discomfort are key barriers at this final stage.',
    },
  ],
};
// ── ISSUE TAGS ──────────────────────────────────────────────
// Powers BOTH the smart suggestion chips under the problem textarea (Fix 3)
// and the stage-specific diagnostic content (Fix 5) — one source of truth,
// so the Bridge "asks once, understands once, and responds specifically."
interface IssueTag {
  id: string;
  label: string;
  keywords: string[];
  category: string;
  frictionPhrase: string;
  interventions: string[];
  studentTip: string;
}
const ISSUE_TAGS: IssueTag[] = [
  {
    id: 'language',
    label: 'Language / dialect support',
    keywords: ['dialect', 'language', "don't understand", 'dont understand', 'translat', 'words mean'],
    category: 'Language access barrier',
    frictionPhrase: "the language or dialect in the source material is getting in the way of understanding it",
    interventions: [
      'Read the line aloud together and ask the student to restate it in their own words first.',
      'Offer a plain-English paraphrase alongside the original line, not as a replacement for it.',
      'Pair the student with a peer or audio version for a first pass before written work begins.',
    ],
    studentTip: "Try reading it out loud first, or ask for it in plain English before you write anything down. You don't have to get the words perfect to get the meaning.",
  },
  {
    id: 'interpret',
    label: "I can't interpret the meaning clearly",
    keywords: ['interpret', 'meaning', 'unclear', 'confus', "don't get it", 'dont get it'],
    category: 'Interpretive / comprehension barrier',
    frictionPhrase: 'the student can decode the words but cannot yet form a confident interpretation of what the piece means',
    interventions: [
      'Ask one concrete question first (who / what / where) before any "what does it mean" question.',
      'Give two possible interpretations and ask which feels closer, rather than asking for one from scratch.',
      'Let the student respond in the format they find easiest — talk it out, voice note, bullet points — before writing prose.',
    ],
    studentTip: "You don't need the 'right' answer straight away. Say what you think it might mean, even if you're not sure — that's the starting point, not the finish line.",
  },
  {
    id: 'overwhelmed',
    label: "I feel overwhelmed and don't know where to start",
    keywords: ['overwhelm', "don't know where to start", 'dont know where to start', 'stuck', 'too much', 'where to begin'],
    category: 'Executive function / task-initiation barrier',
    frictionPhrase: 'the size and openness of the task is making it hard to find a first step',
    interventions: [
      'Give one single first action, not the whole task — e.g. "just pick one image" or "just write one line."',
      'Break the stage into 3 visible mini-steps and let the student tick them off as they go.',
      'Sit with the student for the first 2 minutes only, then step back once momentum starts.',
    ],
    studentTip: "Pick just one small thing to do first — not the whole task. Once you've done one tiny piece, the next one gets easier.",
  },
  {
    id: 'order',
    label: 'Too much clutter / unclear order',
    keywords: ['clutter', 'hotspot', 'messy', 'order', 'too many', 'disorganis', 'disorgan'],
    category: 'Organisation barrier',
    frictionPhrase: 'there are too many elements on screen and it is unclear what order things should go in or what the audience should see first',
    interventions: [
      'Ask the student to remove or hide anything not essential to the current scene before adding anything new.',
      'Get the student to say out loud what they want the audience to see first, second, third — then match the layout to that order.',
      'Use a simple numbered list or storyboard sketch before touching the tool itself.',
    ],
    studentTip: "Before you add anything else, take away what you don't need. Then decide: what should someone see first? Build from there.",
  },
  {
    id: 'noise',
    label: 'Noise or the room is distracting me',
    keywords: ['noise', 'noisy', 'loud', 'distract'],
    category: 'Sensory / environmental barrier',
    frictionPhrase: "sensory conditions in the room are competing for the student's attention",
    interventions: [
      'Offer headphones, a quieter corner, or a short break before continuing.',
      'Let the student work with sound off / captions on if the platform allows it.',
      'Shorten the working block and check in sooner rather than expecting one long stretch.',
    ],
    studentTip: "If you can, find a quieter spot or pop headphones on. It's fine to ask for a few minutes somewhere calmer.",
  },
  {
    id: 'time',
    label: 'I feel rushed or out of time',
    keywords: ['rushed', 'time', 'pacing', 'behind', 'hurry'],
    category: 'Pacing barrier',
    frictionPhrase: 'the pace of the task feels faster than the student can comfortably process',
    interventions: [
      "Tell the student explicitly how much time is actually left — uncertainty about time is often worse than the time itself.",
      'Offer to let the student finish this one step now and continue the rest next session.',
      'Remove one optional element from the task so the core piece is achievable in the time left.',
    ],
    studentTip: "Ask exactly how much time you've got — not knowing is often the stressful part. Then just aim for the next step, not the whole thing.",
  },
  {
    id: 'tool',
    label: 'The tool or software is confusing me',
    keywords: ['tool', 'software', 'app', 'click', 'button', 'glitch', "doesn't work", 'doesnt work'],
    category: 'Digital tool barrier',
    frictionPhrase: 'the platform itself is creating friction that is separate from the creative or academic task',
    interventions: [
      'Demonstrate the exact next click on a shared screen rather than describing it verbally.',
      'Give the student a one-line written reminder of the next 2 steps they can refer back to.',
      'Separate "learning the tool" from "doing the task" — let them practice the tool on something low-stakes first.',
    ],
    studentTip: "If the tool itself is the problem, say so — that's different from not understanding the task. Ask for a quick screen demo of just the next step.",
  },
  {
    id: 'decision',
    label: "Too many choices, I can't decide",
    keywords: ['decide', 'choice', 'choose', 'too many options', "can't choose", 'cant choose'],
    category: 'Decision fatigue barrier',
    frictionPhrase: 'the volume of options at this stage is creating decision fatigue rather than creative freedom',
    interventions: [
      'Narrow the options to two for the student to choose between, not the full set.',
      'Set a 60-second timer for the decision and commit once it ends — perfect is the enemy of done here.',
      'Ask "which one feels right", not "which one is right", to lower the stakes of the choice.',
    ],
    studentTip: "Narrow it down to two options, then just pick. You can always come back and change it later — the first choice doesn't have to be final.",
  },
  {
    id: 'confidence',
    label: "I don't think my work is good enough",
    keywords: ['good enough', 'not good', 'bad at this', 'embarrass', 'self-conscious', 'self conscious'],
    category: 'Confidence / self-doubt barrier',
    frictionPhrase: 'self-doubt about the quality of the work is blocking progress more than any skill gap',
    interventions: [
      'Name one specific thing in the current draft that is already working, before any feedback on what to change.',
      'Reframe the current version explicitly as a draft, not a final piece.',
      'Offer to share the work with you privately first, before any peer- or public-facing step.',
    ],
    studentTip: "This is a draft, not a final piece — it's allowed to be rough. Show it to your teacher first if sharing it more widely feels like too much right now.",
  },
];
const getSuggestedTags = (text: string): IssueTag[] => {
  const lower = text.toLowerCase();
  const matched = ISSUE_TAGS.filter(tag => tag.keywords.some(k => lower.includes(k)));
  if (matched.length > 0) return matched.slice(0, 4);
  // Gentle fallback so the chip row isn't empty while the student is still typing.
  return [ISSUE_TAGS[2], ISSUE_TAGS[6], ISSUE_TAGS[7]];
};
// ── OFFLINE DIAGNOSTIC (used if Gemini is unavailable or returns malformed JSON) ──
const buildNetworkEmergency = (
  platform: Platform,
  stageId: string,
  context: string,
): Diagnostic => {
  const stageLabel = STAGES[platform].find(stage => stage.id === stageId)?.label ?? stageId;
  return {
    barrierType: `Support connection issue in ${stageLabel || 'the current stage'}`,
    liveDiagnostic: 'The shared support service could not be reached, so no audience-specific diagnostic was generated.',
    interventions: [
      'Check the learner’s connection, then reopen the support panel and try once more.',
      'While reconnecting, reduce the current task to one visible action without changing the learning goal.',
    ],
    studentActions: [
      'Tell your teacher the support panel could not connect.',
      'Choose one tiny part of the task you can do now and focus only on that.',
    ],
    studentSupport: context
      ? 'Your description has not been lost. Try again when the connection returns.'
      : 'You have not done anything wrong. Try again when the connection returns.',
  };
};
const initialData: StepData = {
  environment: [],
  environmentNote: '',
  neurodiversity: [],
  profileNote: '',
  checkIn: null,
  situation: { platform: 'ThingLink', stage: '', context: '', issueTags: [] },
  supportMode: null,
  diagnostic: null,
};
// ── COMPONENT ─────────────────────────────────────────────────
export default function BridgeApp() {
  // ── STATE ─────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [data, setData] = useState<StepData>(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  // ── STEP 1 GLOSSARY TOGGLES (Conditions / What Helps split) ──
  const [showConditionsGlossary, setShowConditionsGlossary] = useState(false);
  const [showHelpsGlossary, setShowHelpsGlossary] = useState(false);
  // ── FLOATING "GET SUPPORT" BUTTON VISIBILITY (Fix: no UI competition) ──
  // The floating button (rendered separately in ClientBridgeWrapper, on
  // every page) should not stay fully active while a learner is already
  // mid-flow here — that's three support entry points fighting for
  // attention at once. Broadcast this wizard's stage so the floating
  // button can react:
  //   step 1 (before the flow really starts) -> full button
  //   steps 2-4 (inside the guided flow)      -> minimised
  //   step 5 (the support result is showing)  -> hidden entirely
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mode = step === 1 ? 'full' : step === 5 ? 'hidden' : 'minimized';
    window.dispatchEvent(new CustomEvent('bridge-flow-visibility', { detail: { mode } }));
    // Reset to full visibility if this wizard unmounts, so the floating
    // button doesn't stay stuck hidden/minimised on other pages.
    return () => {
      window.dispatchEvent(new CustomEvent('bridge-flow-visibility', { detail: { mode: 'full' } }));
    };
  }, [step]);
  // — PROFILE HANDOFF (state amnesia fix) —
  // Persist the selected profile so Rooms 2-6 (?compact=true) can arm
  // the floating button with this student's context without re-asking.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (data.neurodiversity.length > 0) {
      localStorage.setItem('bridge_profile', JSON.stringify(data.neurodiversity));
    }
  }, [data.neurodiversity]);
  // ── HANDLERS ──────────────────────────────────────────────
  const toggleEnv = (id: string) => {
    setData(prev => ({
      ...prev,
      environment: prev.environment.includes(id)
        ? prev.environment.filter(e => e !== id)
        : [...prev.environment, id]
    }));
  };
  const toggleNeuro = (id: string) => {
    setData(prev => ({
      ...prev,
      neurodiversity: prev.neurodiversity.includes(id)
        ? prev.neurodiversity.filter(e => e !== id)
        : [...prev.neurodiversity, id]
    }));
  };
  const selectPlatform = (platform: Platform) => {
    setData(prev => ({
      ...prev,
      situation: { ...prev.situation, platform, stage: '' }
    }));
  };
  const toggleIssueTag = (id: string) => {
    setData(prev => ({
      ...prev,
      situation: {
        ...prev.situation,
        issueTags: prev.situation.issueTags.includes(id)
          ? prev.situation.issueTags.filter(t => t !== id)
          : [...prev.situation.issueTags, id],
      },
    }));
  };
  const startNew = () => {
    setData(initialData);
    setCopied(false);
    setStep(1);
  };
  // ── PLAIN-TEXT SUMMARY (Copy summary / Print summary) ──────
  // One shared source of truth for both actions, so what gets copied to the
  // clipboard always matches what the clean print layout shows.
  const buildSummaryText = (): string => {
    if (!data.diagnostic) return '';
    const stageLabel = STAGES[data.situation.platform].find(s => s.id === data.situation.stage)?.label ?? data.situation.stage;
    return [
      'Support Summary for Teacher',
      '',
      `Learner profile: ${data.neurodiversity.join(', ') || 'Not specified'}`,
      `Project + stage: ${data.situation.platform} — ${stageLabel}`,
      `Learner's own words: "${data.situation.context || '—'}"`,
      `Main issue: ${data.diagnostic.barrierType}`,
      '',
      'Recommended actions:',
      ...data.diagnostic.interventions.map((item, i) => `${i + 1}. ${item}`),
    ].join('\n');
  };
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — fail quietly,
      // the button just won't show the "Copied" confirmation.
    }
  };
  // ── SPEECH RECOGNITION ───────────────────────────────────────
  const startListening = (field: 'profileNote' | 'environmentNote' | 'context') => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Speak-to-Transcribe requires Chrome or Edge.');
      return;
    }
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-GB';
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript: string = event.results[0][0].transcript;
      if (field === 'profileNote') {
        setData(prev => ({ ...prev, profileNote: prev.profileNote + (prev.profileNote ? ' ' : '') + transcript }));
      } else if (field === 'environmentNote') {
        setData(prev => ({ ...prev, environmentNote: prev.environmentNote + (prev.environmentNote ? ' ' : '') + transcript }));
      } else {
        setData(prev => ({ ...prev, situation: { ...prev.situation, context: prev.situation.context + (prev.situation.context ? ' ' : '') + transcript } }));
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };
  // ── AI GENERATE (Fix 4 + Fix 5) ────────────────────────────
  // mode === 'student'  -> "Get Support for Me" route
  // mode === 'teacher'  -> "Send Teacher Brief" route
  // Both routes produce one stage-specific diagnostic with separate audience
  // fields: studentActions for 5A and interventions for the teacher-only 5B.
  const generateSupport = async (mode: SupportMode) => {
    setIsGenerating(true);
    setCopied(false);
    setData(prev => ({ ...prev, supportMode: mode }));

    const stageData = STAGES[data.situation.platform].find(s => s.id === data.situation.stage);
    const issueTags = ISSUE_TAGS
      .filter(tag => data.situation.issueTags.includes(tag.id))
      .map(tag => tag.label);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: data.situation.platform,
          stage: data.situation.stage,
          stageDescription: stageData?.description ?? '',
          profile: data.neurodiversity,
          profileNote: data.profileNote,
          environment: data.environment,
          environmentNote: data.environmentNote,
          problem: data.situation.context,
          issueTags,
          checkIn: data.checkIn,
        }),
      });

      if (!res.ok) {
        throw new Error(`Support request failed with ${res.status}`);
      }

      const payload = await res.json();
      const support = payload?.support as Diagnostic | undefined;
      if (
        !support
        || !support.barrierType
        || !support.liveDiagnostic
        || !Array.isArray(support.interventions)
        || !Array.isArray(support.studentActions)
        || support.studentActions.length < 2
        || !support.studentSupport
      ) {
        throw new Error('Incomplete support response');
      }

      setData(prev => ({ ...prev, diagnostic: support }));
    } catch (error) {
      console.error('Support request failed — using local emergency fallback:', error);
      setData(prev => ({
        ...prev,
        diagnostic: buildNetworkEmergency(
          prev.situation.platform,
          prev.situation.stage,
          prev.situation.context,
        ),
      }));
    } finally {
      setIsGenerating(false);
      setStep(5);
    }
  };
  // — COMPACT MODE (skip wizard for ThingLink Rooms 2-6 / Book Creator Room 6) —
  // Profile already captured + saved during Room 1. Render nothing here so
  // only the floating Get Support button (ClientBridgeWrapper) is shown.
  const isCompact = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('compact') === 'true';
  if (isCompact) return null;
  // ── RENDER ────────────────────────────────────────────────
  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      {/* ── HEADER (hidden on the clean teacher print-out — see Step 5B) ── */}
      <header className="mb-12 relative print:hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-charcoal pb-8">
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-charcoal text-cream text-[10px] font-bold tracking-widest uppercase"
            >
              <ShieldCheck size={12} />
              <span>Institutional Access Bridge v2.0</span>
            </motion.div>
            <h1 className="text-6xl font-black tracking-tighter text-charcoal leading-none">
              The Bridge
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-xl">
              Every learner has different thinking strengths, access needs, and ways of working best.
            </p>
            <p className="text-sm text-gray-400 font-medium max-w-xl">
              Ask once. Understand once. Respond specifically.
            </p>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</div>
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
              Operational
            </div>
          </div>
        </div>
        {/* ── VALUE PROPOSITION BOXES ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { title: 'For Students', desc: 'Your thinking strengths — shared in your words, on your terms.', icon: UserCircle },
            { title: 'For Teachers', desc: 'Practical UDL implementation for daily classroom support.', icon: Brain },
            { title: 'For Institutions', desc: 'Ensured digital coherence across fragmented tool use.', icon: ShieldCheck },
            { title: 'The Bridge Logic', desc: 'Check-In → Situation → Decision → Support.', icon: Zap },
          ].map((box, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl bg-charcoal/5 border border-charcoal/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <box.icon size={16} className="text-charcoal" />
                <h3 className="text-xs font-black uppercase tracking-widest text-charcoal">{box.title}</h3>
              </div>
              <p className="text-[11px] text-gray-600 leading-tight font-medium">{box.desc}</p>
            </motion.div>
          ))}
        </div>
      </header>
      {/* ── PROGRESS BAR ── */}
      <div className="flex justify-between mb-12 relative max-w-2xl mx-auto print:hidden">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
              step >= s ? 'bg-charcoal text-cream' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step > s ? <CheckCircle2 size={20} /> : s}
          </div>
        ))}
      </div>
      {/* ── STEPS CONTAINER ── */}
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 shadow-xl min-h-[400px] print:bg-transparent print:border-none print:shadow-none print:p-0">
        <AnimatePresence mode="wait">
          {/* ── STEP 1: THINKING PROFILE — Conditions / What Helps split ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">1. Your Thinking Profile</h2>
                <p className="text-gray-500">Both sections below are optional — select anything that describes how you work best, or skip straight ahead.</p>
              </div>

              {/* ── CONDITIONS (optional) ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Conditions (optional)</label>
                  <button
                    onClick={() => setShowConditionsGlossary(prev => !prev)}
                    className="text-xs font-bold text-charcoal hover:underline whitespace-nowrap"
                  >
                    {showConditionsGlossary ? 'Hide what these mean' : 'What do these mean?'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {CONDITIONS.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => toggleNeuro(pill)}
                      className={`px-6 py-3 rounded-full border-2 text-sm font-bold transition-all ${
                        data.neurodiversity.includes(pill)
                          ? 'bg-charcoal text-cream border-charcoal shadow-lg scale-105'
                          : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showConditionsGlossary && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 overflow-hidden"
                    >
                      {CONDITIONS.map((pill) => (
                        <p key={pill} className="text-sm text-gray-600 leading-relaxed">
                          <span className="font-bold text-charcoal">{pill}:</span> {GLOSSARY[pill]}
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── WHAT HELPS YOU WORK BEST (optional) ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">What helps you work best (optional)</label>
                  <button
                    onClick={() => setShowHelpsGlossary(prev => !prev)}
                    className="text-xs font-bold text-charcoal hover:underline whitespace-nowrap"
                  >
                    {showHelpsGlossary ? 'Hide what these mean' : 'What do these mean?'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {WHAT_HELPS.map((pill) => (
                    <button
                      key={pill}
                      onClick={() => toggleNeuro(pill)}
                      className={`px-6 py-3 rounded-full border-2 text-sm font-bold transition-all ${
                        data.neurodiversity.includes(pill)
                          ? 'bg-charcoal text-cream border-charcoal shadow-lg scale-105'
                          : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showHelpsGlossary && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2 overflow-hidden"
                    >
                      {WHAT_HELPS.map((pill) => (
                        <p key={pill} className="text-sm text-gray-600 leading-relaxed">
                          <span className="font-bold text-charcoal">{pill}:</span> {GLOSSARY[pill]}
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── ANYTHING ELSE (optional) — free text + Speak-to-Transcribe ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Anything else about how you think or work? (optional)</label>
                  <button
                    onClick={() => startListening('profileNote')}
                    disabled={isListening}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
                    }`}
                  >
                    <Mic size={14} />
                    {isListening ? 'Listening...' : 'Speak-to-Transcribe'}
                  </button>
                </div>
                <textarea
                  value={data.profileNote}
                  onChange={(e) => setData(prev => ({ ...prev, profileNote: e.target.value }))}
                  placeholder="e.g. I think best out loud, or I find it easier to plan with pictures than lists..."
                  className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-charcoal outline-none min-h-[80px] transition-all text-sm"
                />
              </div>

              {/* ── STEP 1 NAVIGATION (no longer forces a selection — both
                   sections are optional, so Next is never disabled) ── */}
              <div className="pt-6 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-3 bg-charcoal text-cream rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
          {/* ── STEP 2: QUICK CHECK-IN (Fix 1) ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">2. Quick Check-In</h2>
                <p className="text-gray-500">Before we continue, what feels true right now?</p>
              </div>
              <div className="space-y-3">
                {[
                  { id: 'okay', label: "I'm okay — let's continue" },
                  { id: 'unsure', label: "I'm unsure what to do next" },
                  { id: 'barrier', label: 'Something is making this harder' },
                  { id: 'task_support', label: 'I need help with this task' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setData(prev => ({ ...prev, checkIn: opt.id as CheckIn }))}
                    className={`w-full text-left p-4 rounded-xl border-2 font-bold transition-all ${
                      data.checkIn === opt.id
                        ? 'border-charcoal bg-charcoal/5 text-charcoal'
                        : 'border-gray-100 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* ── ONLY EXPANDS FOR "Something is making this harder" — the barrier
                   isn't assumed to be the room. It could be fear, confusion, overload,
                   or language access too, so the options below cover more than the
                   physical space. ── */}
              {data.checkIn === 'barrier' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-2 overflow-hidden"
                >
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">What might be getting in the way right now?</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ENV_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => toggleEnv(opt.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                          data.environment.includes(opt.id)
                            ? 'border-charcoal bg-charcoal/5'
                            : 'border-gray-100 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${data.environment.includes(opt.id) ? 'bg-charcoal text-cream' : 'bg-gray-100 text-gray-500'}`}>
                          <opt.icon size={18} />
                        </div>
                        <span className="font-bold text-sm">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Anything else about the room?</label>
                      <button
                        onClick={() => startListening('environmentNote')}
                        disabled={isListening}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isListening
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
                        }`}
                      >
                        <Mic size={14} />
                        {isListening ? 'Listening...' : 'Speak-to-Transcribe'}
                      </button>
                    </div>
                    <textarea
                      value={data.environmentNote}
                      onChange={(e) => setData(prev => ({ ...prev, environmentNote: e.target.value }))}
                      placeholder="e.g., The whiteboard is too bright, the room is crowded..."
                      className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-charcoal outline-none min-h-[80px] transition-all text-sm"
                    />
                  </div>
                </motion.div>
              )}
              {/* ── STEP 2 NAVIGATION ── */}
              <div className="pt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-charcoal font-bold hover:underline"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!data.checkIn}
                  className="flex items-center gap-2 px-8 py-3 bg-charcoal text-cream rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-30"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
          {/* ── STEP 3: SITUATION — STAGE + SINGLE PROBLEM INPUT (Fix 3) ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-charcoal mb-2">3. The Situation</h2>
                <p className="text-gray-500">Where are you in the task, and what&apos;s actually going on?</p>
              </div>
              <div className="space-y-4">
                {/* ── PLATFORM PICKER (V2 testing only — a single-project Bridge build
                     should remove this picker entirely and hardcode its own platform) ── */}
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Select Platform</label>
                <div className="grid grid-cols-1 gap-3">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPlatform(p.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.situation.platform === p.id
                          ? 'border-charcoal bg-charcoal/5'
                          : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-charcoal">{p.label}</div>
                      <div className="text-sm text-gray-500">{p.description}</div>
                    </button>
                  ))}
                </div>
                {/* ── STAGE / ROOM PICKER ── */}
                {data.situation.platform && (
                  <div className="pt-2 space-y-2">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Select {data.situation.platform === 'ThingLink' ? 'Room / Stage' : 'Stage'}
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {STAGES[data.situation.platform].map((s, i) => {
                        const stageColors = [
                          { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'text-violet-800', dot: 'bg-violet-500' },
                          { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-500' },
                          { border: 'border-l-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500' },
                          { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500' },
                          { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
                          { border: 'border-l-rose-500', bg: 'bg-rose-50', text: 'text-rose-800', dot: 'bg-rose-500' },
                        ];
                        const c = stageColors[i] ?? stageColors[0];
                        const isSelected = data.situation.stage === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setData(prev => ({ ...prev, situation: { ...prev.situation, stage: s.id } }))}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 border-l-4 text-left text-sm font-medium transition-all ${
                              isSelected
                                ? `${c.border} ${c.bg} ${c.text} font-bold border-t-transparent border-r-transparent border-b-transparent`
                                : `border-gray-100 hover:border-gray-200 bg-white text-gray-700 hover:${c.bg}`
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? c.dot : 'bg-gray-300'}`} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {/* ── CONTEXT TEXT / AUDIO — THE single main problem input ── */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">What are you stuck on right now?</label>
                    <button
                      onClick={() => startListening('context')}
                      disabled={isListening}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
                      }`}
                    >
                      <Mic size={14} />
                      {isListening ? 'Listening...' : 'Speak-to-Transcribe'}
                    </button>
                  </div>
                  <textarea
                    value={data.situation.context}
                    onChange={(e) => setData(prev => ({ ...prev, situation: { ...prev.situation, context: e.target.value } }))}
                    placeholder="e.g. I don't understand the poem because some of the language is unfamiliar"
                    className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-charcoal outline-none min-h-[100px] transition-all"
                  />
                  {/* ── SMART SUGGESTION CHIPS (Fix 3) ── */}
                  {data.situation.context.trim().length > 3 && (
                    <div className="pt-3">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Does this sound like it?</label>
                      <div className="flex flex-wrap gap-2">
                        {getSuggestedTags(data.situation.context).map((tag) => {
                          const selected = data.situation.issueTags.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              onClick={() => toggleIssueTag(tag.id)}
                              className={`px-4 py-2 rounded-full border-2 text-xs font-bold transition-all ${
                                selected
                                  ? 'bg-charcoal text-cream border-charcoal'
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* ── STEP 3 NAVIGATION ── */}
              <div className="pt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 text-charcoal font-bold hover:underline"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={!data.situation.stage}
                  className="flex items-center gap-2 px-8 py-3 bg-charcoal text-cream rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-30"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
          {/* ── STEP 4: DECISION POINT (Fix 4) ── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 text-center py-12"
            >
              <div className="inline-flex p-4 rounded-full bg-charcoal/5 text-charcoal mb-6">
                <Zap size={48} className={isGenerating ? 'animate-pulse' : ''} />
              </div>
              <h2 className="text-3xl font-bold text-charcoal">We&apos;ve understood your request</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Here&apos;s what we&apos;ve got. Choose what happens next — we won&apos;t ask you anything again.
              </p>
              {/* ── SUMMARY CARD ── */}
              <div className="bg-charcoal/5 rounded-xl p-4 text-left max-w-md mx-auto text-sm space-y-1">
                <p><span className="font-bold text-charcoal">Profile:</span> <span className="text-gray-600">{data.neurodiversity.join(', ') || 'Not specified'}</span></p>
                <p><span className="font-bold text-charcoal">Platform:</span> <span className="text-gray-600">{data.situation.platform}</span></p>
                <p><span className="font-bold text-charcoal">Stage:</span> <span className="text-gray-600">{STAGES[data.situation.platform].find(s => s.id === data.situation.stage)?.label}</span></p>
                <p><span className="font-bold text-charcoal">What you&apos;re stuck on:</span> <span className="text-gray-600">{data.situation.context || '—'}</span></p>
              </div>
              <div className="pt-4 flex flex-col items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                  <button
                    onClick={() => generateSupport('student')}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-charcoal text-cream rounded-2xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isGenerating && data.supportMode === 'student' ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <LifeBuoy size={18} />
                    )}
                    Get Support for Me
                  </button>
                  <button
                    onClick={() => generateSupport('teacher')}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-charcoal text-charcoal rounded-2xl font-bold hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isGenerating && data.supportMode === 'teacher' ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    Create Teacher Summary
                  </button>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="text-gray-500 hover:text-charcoal transition-colors"
                >
                  Back and edit
                </button>
              </div>
            </motion.div>
          )}
          {/* ── STEP 5A: STUDENT SUPPORT — warm, practical, immediate ── */}
          {step === 5 && data.diagnostic && data.supportMode === 'student' && (
            <motion.div
              key="step5a"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 print:hidden"
            >
              <div className="flex items-center gap-2 text-charcoal font-bold border-b pb-4">
                <LifeBuoy size={20} />
                <span>Let&apos;s get you moving again</span>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-charcoal text-cream">
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">One clear next step</div>
                  <p className="font-medium leading-relaxed">{data.diagnostic.studentActions[0]}</p>
                </div>
                {data.diagnostic.studentActions[1] && (
                  <div className="p-4 rounded-xl bg-charcoal/5">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">One alternative way in</div>
                    <p className="text-gray-700 leading-relaxed">{data.diagnostic.studentActions[1]}</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-cream/70 border border-gray-200">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">In your own time</div>
                  <p className="text-charcoal leading-relaxed">{data.diagnostic.studentSupport}</p>
                </div>
              </div>
              {/* ── ACTION BAR ── */}
              <div className="pt-2 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-3 text-charcoal font-bold hover:underline"
                >
                  Back and edit
                </button>
                <button
                  onClick={copySummary}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-charcoal text-charcoal rounded-xl font-bold hover:bg-charcoal/5 transition-all"
                >
                  {copied ? <CheckCheck size={16} /> : <ListChecks size={16} />}
                  {copied ? 'Copied' : 'Copy summary'}
                </button>
                <button
                  onClick={() => setData(prev => ({ ...prev, supportMode: 'teacher' }))}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-charcoal text-charcoal rounded-xl font-bold hover:bg-charcoal/5 transition-all"
                >
                  <Send size={16} /> Create teacher summary
                </button>
                <button
                  onClick={startNew}
                  className="px-6 py-3 text-gray-500 hover:text-charcoal font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
          {/* ── STEP 5B: TEACHER SUMMARY — clear, structured, printable ── */}
          {step === 5 && data.diagnostic && data.supportMode === 'teacher' && (
            <motion.div
              key="step5b"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-charcoal font-bold border-b pb-4 print:hidden">
                <FileText size={20} />
                <span>Support Summary for Teacher</span>
              </div>
              {/* ── ON-SCREEN VERSION ── */}
              <div className="space-y-5 print:hidden">
                <div>
                  <p className="text-charcoal text-lg leading-relaxed font-serif">
                    Main issue: {data.diagnostic.barrierType.charAt(0).toLowerCase() + data.diagnostic.barrierType.slice(1)}.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-2">{data.diagnostic.liveDiagnostic}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended actions</label>
                  <ol className="space-y-2">
                    {data.diagnostic.interventions.map((item, i) => (
                      <li key={i} className="flex gap-3 p-3 rounded-xl bg-charcoal/5">
                        <span className="font-black text-charcoal">{i + 1}.</span>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
              <div className="bg-charcoal/5 p-4 rounded-xl flex items-start gap-3 print:hidden">
                <AlertCircle className="text-charcoal shrink-0 mt-1" size={18} />
                <p className="text-sm text-charcoal/80 italic">
                  Zero-Persistence Policy: This data is processed for this session only and will not be stored.
                </p>
              </div>
              {/* ── CLEAN PRINT-ONLY LAYOUT ──
                   Only what a teacher needs on paper: learner profile, project +
                   stage, the learner's own wording, the likely barrier, and the
                   recommended actions. No floating controls, no modal shell, no
                   status banner, no buttons. ── */}
              <div className="hidden print:block text-black">
                <h1 className="text-2xl font-bold mb-4">Support Summary for Teacher</h1>
                <p className="mb-1"><strong>Learner profile:</strong> {data.neurodiversity.join(', ') || 'Not specified'}</p>
                <p className="mb-1"><strong>Project + stage:</strong> {data.situation.platform} — {STAGES[data.situation.platform].find(s => s.id === data.situation.stage)?.label}</p>
                <p className="mb-1"><strong>Learner&apos;s own words:</strong> &quot;{data.situation.context || '—'}&quot;</p>
                <p className="mb-4"><strong>Likely barrier:</strong> {data.diagnostic.barrierType}</p>
                <strong>Recommended actions:</strong>
                <ol className="mt-1 ml-5 list-decimal space-y-1">
                  {data.diagnostic.interventions.slice(0, 3).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
              {/* ── ACTION BAR ── */}
              <div className="pt-2 flex flex-wrap gap-3 justify-center print:hidden">
                <button
                  onClick={() => setData(prev => ({ ...prev, supportMode: 'student' }))}
                  className="px-6 py-3 text-charcoal font-bold hover:underline"
                >
                  View student support instead
                </button>
                <button
                  onClick={copySummary}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-charcoal text-charcoal rounded-xl font-bold hover:bg-charcoal/5 transition-all"
                >
                  {copied ? <CheckCheck size={16} /> : <ListChecks size={16} />}
                  {copied ? 'Copied' : 'Copy summary'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-charcoal text-cream rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Print summary
                </button>
                <button
                  onClick={startNew}
                  className="px-6 py-3 text-gray-500 hover:text-charcoal font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* ── FOOTER ── */}
      <footer className="mt-12 text-center text-gray-400 text-sm print:hidden">
        <p>© 2026 Techembrace Bridge. All rights reserved.</p>
        <p className="mt-1 italic">Designed for neuro-inclusive access and institutional digital coherence.</p>
      </footer>
    </main>
  );
}
