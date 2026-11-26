import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadRateLimit = async (limit?: string) => {
  vi.resetModules();
  if (limit) vi.stubEnv("DAILY_ANALYZE_LIMIT", limit);
  return import("@/lib/rateLimit");
};

describe("consumeRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("デフォルトでは 1 日 10 回まで許可する", async () => {
    const { consumeRateLimit } = await loadRateLimit();

    const results = Array.from({ length: 11 }, () => consumeRateLimit("1.1.1.1"));

    expect(results.slice(0, 10).every(Boolean)).toBe(true);
    expect(results[10]).toBe(false);
  });

  it("DAILY_ANALYZE_LIMIT で回数を変更できる", async () => {
    const { consumeRateLimit } = await loadRateLimit("2");

    expect(consumeRateLimit("1.1.1.1")).toBe(true);
    expect(consumeRateLimit("1.1.1.1")).toBe(true);
    expect(consumeRateLimit("1.1.1.1")).toBe(false);
  });

  it("IP ごとに別々に数える", async () => {
    const { consumeRateLimit } = await loadRateLimit("1");

    expect(consumeRateLimit("1.1.1.1")).toBe(true);
    expect(consumeRateLimit("1.1.1.1")).toBe(false);
    expect(consumeRateLimit("2.2.2.2")).toBe(true);
  });

  it("24 時間たつと回数がリセットされる", async () => {
    const { consumeRateLimit } = await loadRateLimit("1");

    expect(consumeRateLimit("1.1.1.1")).toBe(true);
    expect(consumeRateLimit("1.1.1.1")).toBe(false);

    vi.advanceTimersByTime(24 * 60 * 60 * 1000);

    expect(consumeRateLimit("1.1.1.1")).toBe(true);
  });
});
