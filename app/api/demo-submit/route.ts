/**
 * UEL Criminology Demo — anonymous row intake (25 Sept 2026)
 *
 * SEPARATE from /api/feedback (the live pilot's log-only endpoint). This one
 * needs to be queryable within the same 75-minute session, for the "lecturer
 * briefing, built from their data" segment — so rows go to Vercel Blob rather
 * than just a console log.
 *
 * Requires BLOB_READ_WRITE_TOKEN in the DEMO Vercel project's env vars
 * (Vercel Storage → Blob → Connect to project). Not present on live V2 and
 * must not be added there — this route only exists in the demo copy.
 *
 * No names, emails or student IDs are accepted in any field — see validateRow.
 */

import { put, list } from "@vercel/blob";
import { SHEET_COLUMNS, type DemoRow } from "@/lib/demo-content";

const PREFIX = "demo-rows/";
const MIN_GROUP_SIZE = 3; // safeguard agreed 19 Sept — re-check before real-course use

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string";
}

function looksLikeIdentifier(v: string): boolean {
  // crude guard against a pasted email or a name-like "First Last" in free-text fields
  return /@/.test(v) || /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(v);
}

function validateRow(body: unknown): DemoRow | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.groupCode) || !/^GRP-[A-Z0-9]{4,6}$/.test(b.groupCode)) return null;
  if (b.platform !== "thinglink" && b.platform !== "bookcreator") return null;
  if (b.issueGroup !== "" && b.issueGroup !== "environment" && b.issueGroup !== "other") return null;
  if (!isNonEmptyString(b.issueType)) return null;
  if (b.where !== "" && b.where !== "whole class" && b.where !== "small group" && b.where !== "independent") return null;
  if (!isNonEmptyString(b.whatHelped) || !isNonEmptyString(b.howILikeToLearn)) return null;
  if (typeof b.timeOnTaskSeconds !== "number") return null;

  for (const field of [b.whatHelped, b.howILikeToLearn]) {
    if (looksLikeIdentifier(field)) return null; // reject, don't silently strip — student should be told
  }

  return {
    groupCode: b.groupCode,
    platform: b.platform,
    issueGroup: b.issueGroup as DemoRow["issueGroup"],
    issueType: b.issueType.slice(0, 80),
    where: b.where as DemoRow["where"],
    whatHelped: b.whatHelped.slice(0, 200),
    timeOnTaskSeconds: Math.max(0, Math.round(b.timeOnTaskSeconds)),
    howILikeToLearn: b.howILikeToLearn.slice(0, 120),
    submittedAt: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const row = validateRow(body);
  if (!row) {
    return Response.json({ error: "invalid-row — no identifying text allowed" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Fails loudly rather than silently dropping submissions during the live demo.
    console.error("[demo-submit] BLOB_READ_WRITE_TOKEN not set on this project");
    return Response.json({ error: "storage-not-configured" }, { status: 500 });
  }

  const key = `${PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  await put(key, JSON.stringify(row), { access: "public", contentType: "application/json" });

  return new Response(null, { status: 204 });
}

/** GET — aggregated counts for the lecturer briefing. Never returns raw rows. */
export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "storage-not-configured" }, { status: 500 });
  }

  const { blobs } = await list({ prefix: PREFIX });
  const rows: DemoRow[] = await Promise.all(
    blobs.map(async (b) => {
      const res = await fetch(b.url);
      return (await res.json()) as DemoRow;
    })
  );

  if (rows.length < MIN_GROUP_SIZE) {
    return Response.json({
      totalSubmissions: rows.length,
      belowMinimumGroupSize: true,
      minimumGroupSize: MIN_GROUP_SIZE,
      message: "Not enough submissions yet to show a summary without risking re-identification.",
      columns: SHEET_COLUMNS,
    });
  }

  const byIssueType: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  for (const row of rows) {
    if (row.issueType) byIssueType[row.issueType] = (byIssueType[row.issueType] ?? 0) + 1;
    byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + 1;
  }

  // ESOL safeguard (agreed 19 Sept): hide the exact count when only 1-2 flagged it.
  const esolLabel = "ESOL / language";
  if (byIssueType[esolLabel] !== undefined && byIssueType[esolLabel] <= 2) {
    delete byIssueType[esolLabel];
    byIssueType["language support (count hidden — small number)"] = 1;
  }

  return Response.json({
    totalSubmissions: rows.length,
    belowMinimumGroupSize: false,
    byIssueType,
    byPlatform,
    columns: SHEET_COLUMNS,
  });
}
