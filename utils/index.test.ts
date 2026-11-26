import { describe, expect, it } from "vitest";
import { normalize } from "@/utils";

describe("normalize", () => {
  it("0〜100 の値はそのまま返す", () => {
    expect(normalize(0)).toBe(0);
    expect(normalize(42)).toBe(42);
    expect(normalize(100)).toBe(100);
  });

  it("範囲外の値は 0〜100 に収める", () => {
    expect(normalize(-5)).toBe(0);
    expect(normalize(120)).toBe(100);
  });
});
