import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();

vi.mock("openai", () => ({
  default: class {
    responses = { create };
  },
}));

const { analyzeEmotion } = await import("@/lib/analyzeEmotion");

describe("analyzeEmotion", () => {
  beforeEach(() => {
    create.mockReset();
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  it("JSON の解析結果を数値で返す", async () => {
    create.mockResolvedValue({
      output_text: '{"emotion": 80, "energy": 30, "intensity": 60}',
    });

    expect(await analyzeEmotion("楽しかった")).toEqual({
      emotion: 80,
      energy: 30,
      intensity: 60,
      isOk: true,
    });
  });

  it("コードブロックで囲まれた JSON も読み取れる", async () => {
    create.mockResolvedValue({
      output_text: '```json\n{"emotion": 10, "energy": 20, "intensity": 30}\n```',
    });

    expect(await analyzeEmotion("つかれた")).toMatchObject({
      emotion: 10,
      energy: 20,
      intensity: 30,
      isOk: true,
    });
  });

  it("数値以外の項目は 50 にする", async () => {
    create.mockResolvedValue({
      output_text: '{"emotion": "high", "intensity": 70}',
    });

    expect(await analyzeEmotion("ふつう")).toMatchObject({
      emotion: 50,
      energy: 50,
      intensity: 70,
      isOk: true,
    });
  });

  it("JSON として読めないときは失敗を返す", async () => {
    create.mockResolvedValue({ output_text: "わかりません" });

    expect(await analyzeEmotion("???")).toEqual({ isOk: false });
  });

  it("API がエラーになったときは失敗を返す", async () => {
    create.mockRejectedValue(new Error("insufficient_quota"));

    expect(await analyzeEmotion("こんにちは")).toEqual({ isOk: false });
  });

  it("API キーがないときは API を呼ばずに失敗を返す", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(await analyzeEmotion("こんにちは")).toEqual({ isOk: false });
    expect(create).not.toHaveBeenCalled();
  });
});
