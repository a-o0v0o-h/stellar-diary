import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeEmotion } from "@/lib/analyzeEmotion";
import { normalize } from "@/utils";

export async function GET() {
  const diaries = await prisma.diary.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(diaries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = body.content;

  // AI解析
  const aiResult = await analyzeEmotion(content);

  if (aiResult.isOk) {
    await prisma.diary.create({
      data: {
        content,
        emotion: jitter(aiResult.emotion),
        energy: jitter(aiResult.energy),
        intensity: normalize(aiResult.intensity),
      },
    });

    return NextResponse.json({ isOk: true });
  }

  return NextResponse.json({ isOk: false });
}

/**
 * 星の座標をずらす（重なりを避けるため）
 */
const jitter = (n: number) => {
  const num = n + (Math.random() - 0.5) * 10;
  return normalize(num);
};
