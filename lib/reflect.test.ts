import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUOTES } from "@/lib/quotes";

const create = vi.fn();

vi.mock("openai", () => ({
  default: class {
    responses = { create };
  },
}));

const { CANDIDATE_COUNT, generateReflection, moodOf, pickCandidates } = await import(
  "@/lib/reflect"
);

const diary = (emotion: number, energy: number, content = "いい日だった") => ({
  content,
  emotion,
  energy,
  intensity: 50,
  date: "2026-11-25",
});

/** AI に渡した候補の id（json_schema の enum） */
const candidateIds = (): string[] =>
  create.mock.calls[0][0].text.format.schema.properties.quoteId.enum;

describe("moodOf", () => {
  it.each([
    ["ポジティブで元気", [diary(80, 70), diary(60, 60)], "bright"],
    ["ポジティブでのんびり", [diary(80, 20), diary(60, 40)], "calm"],
    ["ネガティブで元気", [diary(20, 80), diary(30, 60)], "restless"],
    ["ネガティブでのんびり", [diary(20, 20), diary(40, 30)], "tired"],
  ])("%s の週は %s", (_, diaries, mood) => {
    expect(moodOf(diaries)).toBe(mood);
  });
});

describe("pickCandidates", () => {
  it("気持ちに合う名言を、重複なく決められた数だけ選ぶ", () => {
    const candidates = pickCandidates("tired");

    expect(candidates).toHaveLength(CANDIDATE_COUNT);
    expect(new Set(candidates.map((q) => q.id)).size).toBe(CANDIDATE_COUNT);
    expect(candidates.every((q) => q.moods.includes("tired"))).toBe(true);
  });

  it("元のリストの並びは変えない", () => {
    const before = QUOTES.map((q) => q.id);
    pickCandidates("bright");
    expect(QUOTES.map((q) => q.id)).toEqual(before);
  });
});

describe("generateReflection", () => {
  const diaries = [diary(80, 70, "友達とごはん"), diary(70, 60), diary(60, 80)];

  beforeEach(() => {
    create.mockReset();
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  it("コメントと、候補から選ばれた名言を返す", async () => {
    create.mockImplementation(async (params) => ({
      output_text: JSON.stringify({
        comment: "  にぎやかな星が並んだ週でした。  ",
        quoteId: params.text.format.schema.properties.quoteId.enum[0],
      }),
    }));

    const result = await generateReflection(diaries);

    expect(result.isOk).toBe(true);
    if (!result.isOk) return;
    expect(result.comment).toBe("にぎやかな星が並んだ週でした。");
    expect(result.quote.id).toBe(candidateIds()[0]);
  });

  it("日記の本文と、週の気持ちに合う候補だけを AI に渡す", async () => {
    create.mockResolvedValue({ output_text: "{}" });

    await generateReflection(diaries);

    const params = create.mock.calls[0][0];
    expect(params.input).toContain("友達とごはん");
    expect(candidateIds()).toHaveLength(CANDIDATE_COUNT);
    for (const id of candidateIds()) {
      expect(QUOTES.find((q) => q.id === id)?.moods).toContain("bright");
    }
  });

  it.each([
    ["候補にない id", () => ({ comment: "よい週でした", quoteId: "q999" })],
    ["空のコメント", (ids: string[]) => ({ comment: "  ", quoteId: ids[0] })],
    ["形が違う", () => ["よい週でした"]],
  ])("%s が返ってきたら失敗にする", async (_, output) => {
    create.mockImplementation(async (params) => ({
      output_text: JSON.stringify(output(params.text.format.schema.properties.quoteId.enum)),
    }));

    expect(await generateReflection(diaries)).toEqual({ isOk: false });
  });

  it("API キーがなければ API を呼ばずに失敗にする", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");

    expect(await generateReflection(diaries)).toEqual({ isOk: false });
    expect(create).not.toHaveBeenCalled();
  });

  it("API がエラーになったら失敗にする", async () => {
    create.mockRejectedValue(new Error("network"));

    expect(await generateReflection(diaries)).toEqual({ isOk: false });
  });
});
