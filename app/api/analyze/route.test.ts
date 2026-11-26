import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const analyzeEmotion = vi.fn();

vi.mock("@/lib/analyzeEmotion", () => ({ analyzeEmotion }));

const loadRoute = async () => {
  // 回数制限のカウントをテストごとにリセットする
  vi.resetModules();
  return import("@/app/api/analyze/route");
};

const request = (body: unknown, ip = "1.1.1.1") =>
  new NextRequest("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/analyze", () => {
  beforeEach(() => {
    analyzeEmotion.mockReset();
    analyzeEmotion.mockResolvedValue({
      isOk: true,
      emotion: 70,
      energy: 40,
      intensity: 120,
    });
  });

  it("解析結果を 0〜100 の整数で返す", async () => {
    const { POST } = await loadRoute();

    const res = await POST(request({ content: "  楽しかった  " }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(analyzeEmotion).toHaveBeenCalledWith("楽しかった");
    expect(body.isOk).toBe(true);
    // 星の重なりを避けるため ±5 の範囲でずらしている
    expect(body.emotion).toBeGreaterThanOrEqual(65);
    expect(body.emotion).toBeLessThanOrEqual(75);
    expect(Number.isInteger(body.emotion)).toBe(true);
    expect(body.energy).toBeGreaterThanOrEqual(35);
    expect(body.energy).toBeLessThanOrEqual(45);
    expect(body.intensity).toBe(100);
  });

  it.each([
    ["空文字", { content: "" }],
    ["空白だけ", { content: "   " }],
    ["281 文字", { content: "あ".repeat(281) }],
    ["文字列以外", { content: 123 }],
    ["JSON でない body", "not json"],
  ])("%s は 400 を返し、API を呼ばない", async (_, body) => {
    const { POST } = await loadRoute();

    const res = await POST(request(body));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ isOk: false, reason: "invalid" });
    expect(analyzeEmotion).not.toHaveBeenCalled();
  });

  it("280 文字ちょうどは受け付ける", async () => {
    const { POST } = await loadRoute();

    const res = await POST(request({ content: "あ".repeat(280) }));

    expect(res.status).toBe(200);
  });

  it("同じ IP から 11 回目は 429 を返し、API を呼ばない", async () => {
    const { POST } = await loadRoute();

    for (let i = 0; i < 10; i++) {
      expect((await POST(request({ content: "x" }))).status).toBe(200);
    }
    const res = await POST(request({ content: "x" }));

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ isOk: false, reason: "rate_limited" });
    expect(analyzeEmotion).toHaveBeenCalledTimes(10);
  });

  it("解析に失敗したときは 503 を返す", async () => {
    analyzeEmotion.mockResolvedValue({ isOk: false });
    const { POST } = await loadRoute();

    const res = await POST(request({ content: "こんにちは" }));

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ isOk: false, reason: "unavailable" });
  });
});
