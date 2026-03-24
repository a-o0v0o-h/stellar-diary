import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeEmotion } from "@/lib/analyzeEmotion";

export async function GET() {
  const diaries = await prisma.diary.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(diaries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // contentだけ先に使う
  const content = body.content;

  // AI解析
  const aiResult = await analyzeEmotion(content);

  if (aiResult.isOk) {
    await prisma.diary.create({
      data: {
        content,
        emotion: aiResult.emotion + jitter(),
        energy: aiResult.energy + jitter(),
        intensity: aiResult.intensity + jitter(),
      },
    });

    return NextResponse.json({ isOk: true });
  }

  return NextResponse.json({ isOk: false });
}

const jitter = () => (Math.random() - 0.5) * 10;
