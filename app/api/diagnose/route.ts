import { GoogleGenAI } from "@google/genai";
import { libraryDiagnostic } from "@/lib/barriers";

/**
 * The Bridge V2 — one generation boundary, two audience-safe voices.
 *
 * Every client sends structured learner context. This route owns the prompt and
 * returns both the learner's immediate actions and the teacher's professional
 * intervention guidance from the same model call.
 */

export const maxDuration = 30;

const MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
] as const;

const CONFIGS: { label: string; value?: Record<string, unknown> }[] = [
  {
    label: 'no-thinking',
    value: { thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 2048, temperature: 0.7 },
  },
  { label: 'capped', value: { maxOutputTokens: 2048, temperature: 0.7 } },
  { label: 'default', value: undefined },
];

const TIMEOUT_MS = 9_500;

interface DiagnoseRequest {
  platform: string;
  stage: string;
  stageDescription?: string;
  profile?: string[];
  profileNote?: string;
  environment?: string[];
  environmentNote?: string;
  problem: string;
  effort?: string;
  issueTags?: string[];
  checkIn?: string | null;
}

interface SupportResult {
  barrierType: string;
  liveDiagnostic: string;
  interventions: string[];
  studentActions: string[];
  studentSupport: string;
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let handle: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    handle = setTimeout(() => reject(new Error('TIMEOUT')), Math.max(ms, 1));
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(handle)) as Promise<T>;
}

function errText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isModelMissing(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 404 || /NOT_FOUND|no longer available|is not found/i.test(errText(err));
}

function isBadConfig(err: unknown): boolean {
  const status = (err as { status?: number })?.status;
  return status === 400 || /INVALID_ARGUMENT|invalid argument/i.test(errText(err));
}

function cleanList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function parseSupport(text: string): SupportResult | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
    const interventions = cleanList(parsed.interventions, 4);
    const studentActions = cleanList(parsed.studentActions, 2);
    const barrierType = typeof parsed.barrierType === 'string' ? parsed.barrierType.trim() : '';
    const liveDiagnostic = typeof parsed.liveDiagnostic === 'string' ? parsed.liveDiagnostic.trim() : '';
    const studentSupport = typeof parsed.studentSupport === 'string' ? parsed.studentSupport.trim() : '';

    if (!barrierType || !liveDiagnostic || interventions.length < 2 || studentActions.length < 2 || !studentSupport) {
      return null;
    }

    return { barrierType, liveDiagnostic, interventions, studentActions, studentSupport };
  } catch {
    return null;
  }
}

function buildFallback(input: DiagnoseRequest): SupportResult {
  const lower = [
    input.problem,
    ...(input.environment ?? []),
    ...(input.issueTags ?? []),
  ].join(' ').toLowerCase();

  let studentActions = [
    'Point to the exact part of the screen where you became stuck and say: “This is the bit I need help with.”',
    'Choose one tiny action you can do now — open the page, select one image, or write one line — and do only that.',
  ];
  let studentSupport = 'You do not need to solve the whole task at once. One clear step is enough to get moving again.';

  if (/language|dialect|translat|words mean/.test(lower)) {
    studentActions = [
      'Read or say the idea first in the language that feels clearest to you.',
      'Ask for the instruction in plain English, as audio, or as one short example.',
    ];
    studentSupport = 'Understanding the idea matters more than finding perfect English words immediately.';
  } else if (/overwhelm|too much|stuck|where to start|where to begin/.test(lower)) {
    studentActions = [
      'Pick one tiny first action — choose one image or write one line — and do only that now.',
      'Write three mini-steps and cover the last two until the first one is finished.',
    ];
    studentSupport = 'The whole task can wait. Finishing one small piece is real progress.';
  } else if (/noise|noisy|loud|distract/.test(lower)) {
    studentActions = [
      'Put on headphones, move to a quieter place, or ask for a two-minute reset.',
      'Turn sound off or captions on if that makes the task easier to hold in mind.',
    ];
    studentSupport = 'Changing the environment is a valid way to make the task accessible.';
  } else if (/rush|time|pacing|behind/.test(lower)) {
    studentActions = [
      'Ask: “Exactly how much time do I have?” Then choose one step that fits that time.',
      'Finish only the current step and ask to continue the rest later.',
    ];
    studentSupport = 'You are allowed to work at a pace that lets you understand what you are doing.';
  } else if (/choice|choose|decid|too many options/.test(lower)) {
    studentActions = [
      'Put every option except two out of sight, then choose between those two.',
      'Give yourself 60 seconds and pick the one that feels closer; you can change it later.',
    ];
    studentSupport = 'The first choice does not have to be final or perfect.';
  }

  const library = libraryDiagnostic(input.stage, input.problem);
  const interventions = library
    ? [library.intervention1, library.intervention2].filter(Boolean)
    : [
        'Reduce the task to one visible next action and point to the exact control or workspace the learner should use first.',
        'Offer one alternative way to respond — speaking, drawing, pointing, or dictating — without reducing the learning goal.',
      ];

  return {
    barrierType: library?.barrierType ?? `Task access barrier in ${input.stage || 'the current stage'}`,
    liveDiagnostic: library?.diagnostic
      ?? `The learner is blocked in ${input.stage || 'the current stage'} and has reported: “${input.problem}”. This is being treated as an access barrier rather than a gap in what they know.`,
    interventions,
    studentActions,
    studentSupport,
  };
}

function buildPrompt(input: DiagnoseRequest): string {
  const platformContext = input.platform.toLowerCase().includes('thinglink')
    ? 'This is an immersive 360° poetry environment with spatial hotspots and competing sensory demands.'
    : 'This is a sequential multimedia poetry project combining text, images, audio, motion, reflection, and publication.';

  return `
You are The Bridge by Techembrace, a neuro-inclusive point-of-need support system.
Generate ONE support object with two deliberately separate audiences from the same evidence.

LEARNER CONTEXT
- Platform: ${input.platform || 'Not specified'}
- Stage / room: ${input.stage || 'Not specified'}
- Stage description: ${input.stageDescription || 'Not supplied'}
- How the learner says they work best: ${(input.profile ?? []).join(', ') || 'Not shared'}
- Profile note in the learner's words: ${input.profileNote || 'None'}
- Environment: ${(input.environment ?? []).join(', ') || 'Nothing flagged'}
- Environment note: ${input.environmentNote || 'None'}
- Check-in: ${input.checkIn || 'Not supplied'}
- What is difficult right now: ${input.problem}
- What they already tried: ${input.effort || 'Nothing reported'}
- Selected issue tags: ${(input.issueTags ?? []).join(', ') || 'None'}
- Platform context: ${platformContext}

Return ONLY valid JSON in exactly this shape:
{
  "barrierType": "four to eight plain words naming what is blocking the task right now",
  "liveDiagnostic": "2-4 precise teacher-facing sentences describing what is happening, not what the learner is",
  "interventions": [
    "specific physical action the teacher can take in the next 60 seconds",
    "second specific teacher action or five-minute follow-up"
  ],
  "studentActions": [
    "one concrete action written directly to the learner",
    "one alternative concrete action written directly to the learner"
  ],
  "studentSupport": "one or two calm, encouraging sentences written directly to the learner"
}

LANGUAGE RULES (apply to barrierType and liveDiagnostic too, not only the learner fields)
- barrierType is four to eight plain words. Name the blockage, not the learner — e.g. "Cannot connect the sound to the meaning", not a condition.
- Never invent a syndrome, condition, or clinical-sounding label. Never use the words deficit, disorder, breakdown, impairment, dysfunction or failure.
- Never attribute a behaviour to a condition. Write "the student is looking at the whole scene at once", never "ADHD attentional drift". Describe what is happening, not what the learner is.
- Keep each intervention to 2-3 sentences and no more than 60 words. A teacher reads this standing up, in under a minute.

AUDIENCE RULES
- interventions and liveDiagnostic are teacher-only: professional, specific, and actionable.
- studentActions and studentSupport are learner-only: use “you”, short sentences, and plain language.
- Never use “the student” or describe teacher behaviour inside studentActions or studentSupport.
- Never expose a diagnostic label, neurological speculation, or deficit language to the learner.
- The learner has already explained the problem. Do not ask them to explain it again.
- Preserve the learning goal while changing access, sequence, environment, or response mode.
- Be specific to this platform, stage, and stated difficulty. No generic UDL platitudes.
`.trim();
}

function fallbackResponse(input: DiagnoseRequest, reason: string, started: number) {
  console.warn('[diagnose] serving structured fallback', {
    reason,
    ms: Date.now() - started,
    platform: input.platform,
    stage: input.stage,
  });
  return Response.json({ support: buildFallback(input), source: 'fallback', reason });
}

export async function POST(req: Request) {
  const started = Date.now();

  let input: DiagnoseRequest;
  try {
    const body = await req.json();
    input = {
      platform: typeof body?.platform === 'string' ? body.platform.trim() : '',
      stage: typeof body?.stage === 'string' ? body.stage.trim() : '',
      stageDescription: typeof body?.stageDescription === 'string' ? body.stageDescription.trim() : '',
      profile: cleanList(body?.profile, 20),
      profileNote: typeof body?.profileNote === 'string' ? body.profileNote.trim() : '',
      environment: cleanList(body?.environment, 20),
      environmentNote: typeof body?.environmentNote === 'string' ? body.environmentNote.trim() : '',
      problem: typeof body?.problem === 'string' ? body.problem.trim() : '',
      effort: typeof body?.effort === 'string' ? body.effort.trim() : '',
      issueTags: cleanList(body?.issueTags, 20),
      checkIn: typeof body?.checkIn === 'string' ? body.checkIn.trim() : null,
    };
  } catch (err) {
    console.error('[diagnose] could not parse request body', err);
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }

  if (!input.problem) {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackResponse(input, 'offline', started);
  }

  const prompt = buildPrompt(input);
  const deadline = started + TIMEOUT_MS;
  const ai = new GoogleGenAI({ apiKey });
  const attempted: string[] = [];
  let lastError: unknown;
  let rung = 0;

  outer: for (const model of MODELS) {
    while (rung < CONFIGS.length) {
      const remaining = deadline - Date.now();
      if (remaining <= 250) {
        lastError = new Error('TIMEOUT');
        break outer;
      }

      const { label, value } = CONFIGS[rung];
      attempted.push(`${model}/${label}`);

      try {
        const result = await withTimeout(
          ai.models.generateContent({
            model,
            contents: prompt,
            ...(value ? { config: value } : {}),
          }),
          remaining,
        );

        const text = result?.text ?? '';
        const support = parseSupport(text);
        if (!support) {
          console.error('[diagnose] model returned an invalid support object', {
            model,
            config: label,
            chars: text.length,
          });
          return fallbackResponse(input, 'invalid-output', started);
        }

        if (model !== MODELS[0] || rung !== 0) {
          console.warn('[diagnose] served by model fallback', {
            model,
            config: label,
            ms: Date.now() - started,
          });
        }

        return Response.json({ support, source: 'ai', model });
      } catch (err) {
        lastError = err;

        if (isBadConfig(err)) {
          rung += 1;
          continue;
        }

        if (isModelMissing(err)) {
          continue outer;
        }

        break outer;
      }
    }
  }

  console.error('[diagnose] generation failed', {
    attempted: attempted.join(' → ') || 'none',
    ms: Date.now() - started,
    message: errText(lastError),
  });

  const reason = lastError instanceof Error && lastError.message === 'TIMEOUT'
    ? 'timeout'
    : 'upstream';
  return fallbackResponse(input, reason, started);
}
