import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const generateReflection = vi.fn();

vi.mock("@/lib/reflect", () => ({ generateReflection }));

const loadRoute = async () => {
  // 回数制限のカウントをテストごとにリセットする
  vi.resetModules();
  return import("@/app/api/reflect/route");
};

const request = (body: unknown, ip = "1.1.1.1") =>
  new NextRequest("http://localhost/api/reflect", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const diary = (overrides: Record<string, unknown> = {}) => ({
  content: "いい日だった",
  emotion: 70,
  energy: 40,
  intensity: 60,
  date: "2026-11-25",
  ...overrides,
});

const diaries = (count: number) => Array.from({ length: count }, () => diary());

describe("POST /api/reflect", () => {
  beforeEach(() => {
    generateReflection.mockReset();
    generateReflection.mockResolvedValue({
      isOk: true,
      comment: "やわらかな光の週でした。",
      quote: {
        id: "q001",
        text: "けれどもほんとうのさいわいは一体何だろう",
        author: "宮沢賢治",
        work: "銀河鉄道の夜",
        source: "https://www.aozora.gr.jp/cards/000081/card456.html",
        moods: ["calm"],
      },
    });
  });

  it("コメントと名言を返す（名言の id や moods は返さない）", async () => {
    const { POST } = await loadRoute();

    const res = await POST(request({ diaries: [diary({ content: "  楽しかった  " }), diary(), diary()] }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      isOk: true,
      comment: "やわらかな光の週でした。",
      quote: {
        text: "けれどもほんとうのさいわいは一体何だろう",
        author: "宮沢賢治",
        work: "銀河鉄道の夜",
        source: "https://www.aozora.gr.jp/cards/000081/card456.html",
      },
    });
    expect(generateReflection.mock.calls[0][0][0].content).toBe("楽しかった");
  });

  it.each([
    ["日記が 2 件", { diaries: diaries(2) }],
    ["日記が 31 件", { diaries: diaries(31) }],
    ["配列でない", { diaries: "x" }],
    ["空の本文", { diaries: [diary({ content: "  " }), diary(), diary()] }],
    ["281 文字の本文", { diaries: [diary({ content: "あ".repeat(281) }), diary(), diary()] }],
    ["範囲外の数値", { diaries: [diary({ emotion: 101 }), diary(), diary()] }],
    ["数値でない", { diaries: [diary({ energy: "50" }), diary(), diary()] }],
    ["日付の形が違う", { diaries: [diary({ date: "11/25" }), diary(), diary()] }],
    ["JSON でない body", "not json"],
  ])("%s は 400 を返し、AI を呼ばない", async (_, body) => {
    const { POST } = await loadRoute();

    const res = await POST(request(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ isOk: false, reason: "invalid" });
    expect(generateReflection).not.toHaveBeenCalled();
  });

  it("3 件と 30 件は受け付ける", async () => {
    const { POST } = await loadRoute();

    expect((await POST(request({ diaries: diaries(3) }))).status).toBe(200);
    expect((await POST(request({ diaries: diaries(30) }))).status).toBe(200);
  });

  it("同じ IP から 6 回目は 429 を返し、AI を呼ばない", async () => {
    const { POST } = await loadRoute();

    for (let i = 0; i < 5; i++) {
      expect((await POST(request({ diaries: diaries(3) }))).status).toBe(200);
    }
    const res = await POST(request({ diaries: diaries(3) }));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ isOk: false, reason: "rate_limited" });
    expect(generateReflection).toHaveBeenCalledTimes(5);
  });

  it("生成に失敗したときは 503 を返す", async () => {
    generateReflection.mockResolvedValue({ isOk: false });
    const { POST } = await loadRoute();

    const res = await POST(request({ diaries: diaries(3) }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ isOk: false, reason: "unavailable" });
  });
});
