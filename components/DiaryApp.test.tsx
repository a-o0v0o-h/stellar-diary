// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TUTORIAL_KEY = "stellar-diary:tutorial-seen";

const renderApp = async () => {
  // localStorage が使えないときのメモリ上の記録をテストごとにリセットする
  vi.resetModules();
  const { default: DiaryApp } = await import("@/components/DiaryApp");
  return render(<DiaryApp />);
};

const dialog = () => screen.queryByRole("dialog", { name: /./ });

describe("チュートリアル", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("初めて開いたときに表示される", async () => {
    await renderApp();

    expect(screen.getByRole("dialog", { name: "Stellar Diary へようこそ" })).toBeTruthy();
  });

  it("一度見たことがあれば表示されない", async () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    await renderApp();

    expect(dialog()).toBeNull();
  });

  it("次へ・戻るでページを移動し、最後に「書いてみる」で日記の入力画面を開く", async () => {
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByRole("dialog", { name: "画面全体が気持ちの地図" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(screen.getByRole("dialog", { name: "Stellar Diary へようこそ" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByRole("dialog", { name: "日記を書いてみよう" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "書いてみる" }));

    expect(dialog()).toBeNull();
    expect(screen.getByPlaceholderText("どんな1日だった？")).toBeTruthy();
    expect(localStorage.getItem(TUTORIAL_KEY)).not.toBeNull();
  });

  it("照らした ＋ ボタンを押すと、チュートリアルを閉じて入力画面を開く", async () => {
    await renderApp();

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    }
    fireEvent.click(await screen.findByTestId("tutorial-spotlight"));

    expect(dialog()).toBeNull();
    expect(screen.getByPlaceholderText("どんな1日だった？")).toBeTruthy();
    expect(localStorage.getItem(TUTORIAL_KEY)).not.toBeNull();
  });

  it.each([
    ["スキップ", () => fireEvent.click(screen.getByRole("button", { name: "スキップ" }))],
    ["× ボタン", () => fireEvent.click(screen.getByRole("button", { name: "閉じる" }))],
    ["Esc キー", () => fireEvent.keyDown(window, { key: "Escape" })],
  ])("%s で閉じると、次からは表示されない", async (_, close) => {
    await renderApp();

    close();
    expect(dialog()).toBeNull();

    cleanup();
    await renderApp();
    expect(dialog()).toBeNull();
  });

  it("初めてのチュートリアルを閉じると、? ボタンが光って見直せる場所を教える", async () => {
    await renderApp();
    expect(screen.getByText("右上の ? からいつでも見直せます。")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "スキップ" }));

    const help = screen.getByRole("button", { name: "使い方を見る" });
    expect(help.classList.contains("help-glow")).toBe(true);
  });

  it("? ボタンから見直して閉じたときは光らない", async () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    await renderApp();

    const help = screen.getByRole("button", { name: "使い方を見る" });
    fireEvent.click(help);
    fireEvent.click(screen.getByRole("button", { name: "スキップ" }));

    expect(help.classList.contains("help-glow")).toBe(false);
  });

  it("? ボタンでもう一度見られる", async () => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    await renderApp();

    fireEvent.click(screen.getByRole("button", { name: "使い方を見る" }));

    expect(screen.getByRole("dialog", { name: "Stellar Diary へようこそ" })).toBeTruthy();
  });

  it("localStorage に書き込めなくても閉じられる", async () => {
    await renderApp();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    fireEvent.click(screen.getByRole("button", { name: "スキップ" }));

    expect(dialog()).toBeNull();
  });
});
