// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Diary } from "@/lib/diaryStore";

const STORAGE_KEY = "stellar-diary:diaries";

const loadStore = async () => {
  vi.resetModules();
  return import("@/lib/diaryStore");
};

const diary = (overrides: Partial<Diary> = {}): Diary => ({
  id: "1",
  content: "テスト",
  emotion: 50,
  energy: 50,
  intensity: 50,
  createdAt: "2026-11-20T00:00:00.000Z",
  ...overrides,
});

describe("diaryStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("保存された日記を読み込む", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([diary()]));
    const { getSnapshot } = await loadStore();

    expect(getSnapshot()).toEqual([diary()]);
  });

  it("中身が変わらなければ同じ配列を返す（再レンダリングを防ぐ）", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([diary()]));
    const { getSnapshot } = await loadStore();

    expect(getSnapshot()).toBe(getSnapshot());
  });

  it.each([
    ["壊れた JSON", "{broken"],
    ["配列でない JSON", '{"id": "1"}'],
  ])("%s のときは空として扱う", async (_, raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    const { getSnapshot } = await loadStore();

    expect(getSnapshot()).toEqual([]);
  });

  it("addDiary で保存し、購読者に通知する", async () => {
    const { addDiary, getSnapshot, subscribe } = await loadStore();
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    addDiary(diary({ id: "a" }));
    addDiary(diary({ id: "b" }));

    expect(getSnapshot().map((d) => d.id)).toEqual(["a", "b"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(2);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    addDiary(diary({ id: "c" }));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("自分の日記を書くとサンプルを片付ける", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([diary({ id: "s1", isSample: true }), diary({ id: "s2", isSample: true })]),
    );
    const { addDiary, getSnapshot } = await loadStore();

    expect(addDiary(diary({ id: "a" }))).toBe(true);
    expect(getSnapshot().map((d) => d.id)).toEqual(["a"]);

    expect(addDiary(diary({ id: "b" }))).toBe(false);
    expect(getSnapshot().map((d) => d.id)).toEqual(["a", "b"]);
  });

  it("localStorage に書き込めないときはメモリ上に保持する", async () => {
    const { addDiary, getSnapshot } = await loadStore();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    addDiary(diary({ id: "a" }));

    expect(getSnapshot().map((d) => d.id)).toEqual(["a"]);
  });

  describe("seedSamplesIfFirstVisit", () => {
    it("初めて開いたときはサンプルの星を入れる", async () => {
      const { getSnapshot, seedSamplesIfFirstVisit } = await loadStore();

      seedSamplesIfFirstVisit();

      const diaries = getSnapshot();
      expect(diaries.length).toBeGreaterThan(0);
      expect(diaries.every((d) => d.isSample)).toBe(true);
    });

    it("2 回目以降は何もしない", async () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([diary()]));
      const { getSnapshot, seedSamplesIfFirstVisit } = await loadStore();

      seedSamplesIfFirstVisit();

      expect(getSnapshot()).toEqual([diary()]);
    });

    it("日記を全部消して空になっていても、サンプルは入れ直さない", async () => {
      localStorage.setItem(STORAGE_KEY, "[]");
      const { getSnapshot, seedSamplesIfFirstVisit } = await loadStore();

      seedSamplesIfFirstVisit();

      expect(getSnapshot()).toEqual([]);
    });
  });
});
