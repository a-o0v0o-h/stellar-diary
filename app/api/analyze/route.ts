import { NextRequest, NextResponse } from "next/server";
import { analyzeEmotion } from "@/lib/analyzeEmotion";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";
import { consumeRateLimit } from "@/lib/rateLimit";
import { normalize } from "@/utils";

export type AnalyzeResponse =
  | { isOk: true; emotion: number; energy: number; intensity: number }
  | { isOk: false; reason: "invalid" | "rate_limited" | "unavailable" };

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const content =
    typeof body?.content === "string" ? body.content.trim() : "";

  if (!content || content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json<AnalyzeResponse>(
      { isOk: false, reason: "invalid" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!consumeRateLimit(ip)) {
    return NextResponse.json<AnalyzeResponse>(
      { isOk: false, reason: "rate_limited" },
      { status: 429 },
    );
  }

  // AI解析（保存はブラウザの localStorage で行う）
  const aiResult = await analyzeEmotion(content);

  if (!aiResult.isOk) {
    return NextResponse.json<AnalyzeResponse>(
      { isOk: false, reason: "unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json<AnalyzeResponse>({
    isOk: true,
    emotion: jitter(aiResult.emotion),
    energy: jitter(aiResult.energy),
    intensity: normalize(aiResult.intensity),
  });
}

/**
 * 星の座標をずらす（重なりを避けるため）
 */
const jitter = (n: number) => {
  const num = n + (Math.random() - 0.5) * 10;
  return Math.round(normalize(num));
};
