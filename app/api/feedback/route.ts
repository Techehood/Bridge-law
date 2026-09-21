interface FeedbackPayload {
  helpful?: unknown;
  platform?: unknown;
  stage?: unknown;
  source?: unknown;
}

function shortLabel(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, 80)
    : fallback;
}

export async function POST(req: Request) {
  let body: FeedbackPayload;

  try {
    body = await req.json() as FeedbackPayload;
  } catch {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }

  if (typeof body.helpful !== 'boolean') {
    return Response.json({ error: 'bad-request' }, { status: 400 });
  }

  const source = body.source === 'fallback' ? 'fallback' : 'ai';
  const event = {
    event: 'bridge_support_helpful',
    helpful: body.helpful,
    platform: shortLabel(body.platform, 'general'),
    stage: shortLabel(body.stage, 'general'),
    source,
    receivedAt: new Date().toISOString(),
  };

  // Privacy-safe evidence only: no learner text, profile, or diagnostic content.
  // NOTE (by decision): this is log-only for now — the Yes/No lands in Vercel
  // server logs, with no durable store or dashboard. FOLLOW-UP before scaling
  // the pilot: send to a queryable store if the "did this help?" signal is to
  // be tracked over time.
  console.info('[support-feedback]', JSON.stringify(event));

  return new Response(null, { status: 204 });
}
