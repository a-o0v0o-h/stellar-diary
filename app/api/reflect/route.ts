import { NextRequest, NextResponse } from "next/server";
import {
  MAX_CONTENT_LENGTH,
  MAX_REFLECTION_DIARIES,
  MIN_REFLECTION_DIARIES,
} from "@/lib/constants";
import { createRateLimit } from "@/lib/rateLimit";
import { generateReflection, type ReflectionDiary } from "@/lib/reflect";

export type ReflectedQuote = {
  text: string;
  author: string;
  work: string;
  source: string;
};

export type ReflectResponse =
  | { isOk: true; comment: string; quote: ReflectedQuote }
  | { isOk: false; reason: "invalid" | "rate_limited" | "unavailable" };

/** 星をつくる回数とは別に数える */
const consumeReflectLimit = createRateLimit(Number(process.env.DAILY_REFLECT_LIMIT ?? 5));

const isScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;

const toDiary = (value: unknown): ReflectionDiary | null => {
  if (typeof value !== "object" || value === null) return null;
  const { content, emotion, energy, intensity, date } = value as Record<string, unknown>;
  const text = typeof content === "string" ? content.trim() : "";

  if (!text || text.length > MAX_CONTENT_LENGTH) return null;
  if (!isScore(emotion) || !isScore(energy) || !isScore(intensity)) return null;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

  return { content: text, emotion, energy, intensity, date };
};

const parseDiaries = (body: unknown): ReflectionDiary[] | null => {
  const list = (body as { diaries?: unknown } | null)?.diaries;
  if (!Array.isArray(list)) return null;
  if (list.length < MIN_REFLECTION_DIARIES || list.length > MAX_REFLECTION_DIARIES) return null;

  const diaries = list.map(toDiary);
  return diaries.every((diary) => diary !== null) ? diaries : null;
};

export async function POST(req: NextRequest) {
  const diaries = parseDiaries(await req.json().catch(() => null));

  if (!diaries) {
    return NextResponse.json<ReflectResponse>(
      { isOk: false, reason: "invalid" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!consumeReflectLimit(ip)) {
    return NextResponse.json<ReflectResponse>(
      { isOk: false, reason: "rate_limited" },
      { status: 429 },
    );
  }

  const result = await generateReflection(diaries);

  if (!result.isOk) {
    return NextResponse.json<ReflectResponse>(
      { isOk: false, reason: "unavailable" },
      { status: 503 },
    );
  }

  const { text, author, work, source } = result.quote;
  return NextResponse.json<ReflectResponse>({
    isOk: true,
    comment: result.comment,
    quote: { text, author, work, source },
  });
}
