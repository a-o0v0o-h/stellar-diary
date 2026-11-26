import { describe, expect, it } from "vitest";
import { MOODS, QUOTES } from "@/lib/quotes";

describe("QUOTES", () => {
  it("id が重複していない", () => {
    const ids = QUOTES.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("本文・作者・作品名が空でない", () => {
    for (const q of QUOTES) {
      expect(q.text.trim(), q.id).not.toBe("");
      expect(q.author.trim(), q.id).not.toBe("");
      expect(q.work.trim(), q.id).not.toBe("");
    }
  });

  it("出典は青空文庫の図書カード", () => {
    for (const q of QUOTES) {
      expect(q.source, q.id).toMatch(/^https:\/\/www\.aozora\.gr\.jp\/cards\/\d+\/card\d+\.html$/);
    }
  });

  it("moods は決められた値だけで、少なくとも 1 つある", () => {
    for (const q of QUOTES) {
      expect(q.moods.length, q.id).toBeGreaterThan(0);
      expect(new Set(q.moods).size, q.id).toBe(q.moods.length);
      for (const mood of q.moods) expect(MOODS, q.id).toContain(mood);
    }
  });

  it.each(MOODS)("%s の名言が AI に渡す候補として十分にある", (mood) => {
    const count = QUOTES.filter((q) => q.moods.includes(mood)).length;
    expect(count).toBeGreaterThanOrEqual(20);
  });
});
