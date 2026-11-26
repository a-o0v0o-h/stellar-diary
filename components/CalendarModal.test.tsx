// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Diary } from "@/lib/diaryStore";

const post = vi.fn();
const toastError = vi.fn();

vi.mock("axios", () => ({ default: { post } }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const diary = (id: string, createdAt: string, overrides: Partial<Diary> = {}): Diary => ({
  id,
  content: `日記 ${id}`,
  emotion: 70,
  energy: 40,
  intensity: 60,
  createdAt,
  ...overrides,
});

const renderCalendar = async (diaries: Diary[], onClose = vi.fn()) => {
  // localStorage が使えないときのメモリ上の記録をテストごとにリセットする
  vi.resetModules();
  const { default: CalendarModal } = await import("@/components/CalendarModal");
  return render(<CalendarModal diaries={diaries} onClose={onClose} />);
};

const okResponse = {
  data: {
    isOk: true,
    comment: "やわらかな光のひと月でした。",
    quote: {
      text: "雨が　すきか\nわたしはすきだ",
      author: "八木重吉",
      work: "貧しき信徒",
      source: "https://www.aozora.gr.jp/cards/000013/card542.html",
    },
  },
};

// 今日は 2026-11-26（木）
const THIS_MONTH = [
  diary("a", "2026-11-23T09:00:00"),
  diary("b", "2026-11-24T21:00:00"),
  diary("c", "2026-11-26T08:00:00"),
];

describe("カレンダー", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-26T12:00:00"));
    localStorage.clear();
    post.mockReset();
    toastError.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("今月を表示し、今日の日記を見せる", async () => {
    await renderCalendar(THIS_MONTH);

    expect(screen.getByText("2026年11月")).toBeTruthy();
    expect(screen.getByRole("button", { name: "11月26日（日記 1 件）" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("日記 c")).toBeTruthy();
  });

  it("日付を押すと、その日の日記を見せる", async () => {
    await renderCalendar(THIS_MONTH);

    fireEvent.click(screen.getByRole("button", { name: "11月24日（日記 1 件）" }));

    expect(screen.getByText("日記 b")).toBeTruthy();
    expect(screen.queryByText("日記 c")).toBeNull();
  });

  it("前の月に移動でき、今月より先には進めない", async () => {
    await renderCalendar([diary("old", "2026-10-03T10:00:00")]);

    expect((screen.getByRole("button", { name: "次の月" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "前の月" }));

    expect(screen.getByText("2026年10月")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "10月3日（日記 1 件）" }));
    expect(screen.getByText("日記 old")).toBeTruthy();
  });

  it("日記が 3 件に満たない月は、あと何件で ふりかえれるかを案内する（サンプルは数えない）", async () => {
    await renderCalendar([
      diary("a", "2026-11-23T09:00:00"),
      diary("s", "2026-11-24T09:00:00", { isSample: true }),
    ]);

    expect(screen.getByText(/あと 2 件書くと、この月をふりかえれます。/)).toBeTruthy();
    expect(screen.getByText(/サンプルの日記は含まれません/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "この月をふりかえる" })).toBeNull();
  });

  it("ふりかえると、表示している月の日記を送ってコメントと名言を見せ、次からも残っている", async () => {
    post.mockResolvedValue(okResponse);
    await renderCalendar([...THIS_MONTH, diary("last-month", "2026-10-31T09:00:00")]);

    fireEvent.click(screen.getByRole("button", { name: "この月をふりかえる" }));

    expect(await screen.findByText("やわらかな光のひと月でした。")).toBeTruthy();
    expect(screen.getByText(/わたしはすきだ/)).toBeTruthy();
    expect(screen.getByText(/八木重吉『貧しき信徒』/)).toBeTruthy();

    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/api/reflect");
    expect(body.diaries.map((d: { date: string }) => d.date)).toEqual([
      "2026-11-23",
      "2026-11-24",
      "2026-11-26",
    ]);

    cleanup();
    await renderCalendar([...THIS_MONTH, diary("last-month", "2026-10-31T09:00:00")]);
    expect(screen.getByText("やわらかな光のひと月でした。")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "この月をふりかえる" })).toBeNull();
  });

  it("ふりかえったあとに日記を書き足すと、作り直せる", async () => {
    post.mockResolvedValue(okResponse);
    await renderCalendar(THIS_MONTH);
    fireEvent.click(screen.getByRole("button", { name: "この月をふりかえる" }));
    await screen.findByText("やわらかな光のひと月でした。");

    cleanup();
    await renderCalendar([...THIS_MONTH, diary("d", "2026-11-26T20:00:00")]);

    expect(screen.getByRole("button", { name: "書き足した日記でふりかえり直す" })).toBeTruthy();
  });

  it("ふりかえったあとも、もう一度つくり直せる", async () => {
    post.mockResolvedValueOnce(okResponse).mockResolvedValueOnce({
      data: { ...okResponse.data, comment: "静かな星がまたたくひと月でした。" },
    });
    await renderCalendar(THIS_MONTH);
    fireEvent.click(screen.getByRole("button", { name: "この月をふりかえる" }));
    await screen.findByText("やわらかな光のひと月でした。");

    fireEvent.click(screen.getByRole("button", { name: "もう一度ふりかえる" }));

    expect(await screen.findByText("静かな星がまたたくひと月でした。")).toBeTruthy();
    expect(screen.queryByText("やわらかな光のひと月でした。")).toBeNull();
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("失敗したら理由を知らせる", async () => {
    post.mockResolvedValue({ data: { isOk: false, reason: "rate_limited" } });
    await renderCalendar(THIS_MONTH);

    fireEvent.click(screen.getByRole("button", { name: "この月をふりかえる" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("今日のふりかえりはここまでです。また明日試してください。"),
    );
    expect(screen.getByRole("button", { name: "この月をふりかえる" })).toBeTruthy();
  });

  it("Esc キーで閉じる", async () => {
    const onClose = vi.fn();
    await renderCalendar(THIS_MONTH, onClose);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});
