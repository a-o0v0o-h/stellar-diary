import { expect, type Page, test } from "@playwright/test";

const DIARIES_KEY = "stellar-diary:diaries";
const TUTORIAL_KEY = "stellar-diary:tutorial-seen";

const stars = (page: Page) => page.getByRole("button", { name: /の日記$/ });

/** チュートリアルを見たことにして、日記を入れた状態で開く */
const openWith = async (page: Page, diaries?: object[]) => {
  await page.addInitScript(
    ({ diariesKey, tutorialKey, diaries }) => {
      localStorage.setItem(tutorialKey, "true");
      if (diaries && localStorage.getItem(diariesKey) === null) {
        localStorage.setItem(diariesKey, JSON.stringify(diaries));
      }
    },
    { diariesKey: DIARIES_KEY, tutorialKey: TUTORIAL_KEY, diaries },
  );
  await page.goto("/");
};

test("初めて開くと、チュートリアルとサンプルの星が出る", async ({ page }) => {
  await page.goto("/");

  const tutorial = page.getByRole("dialog", { name: "Stellar Diary へようこそ" });
  await expect(tutorial).toBeVisible();
  await tutorial.getByRole("button", { name: "スキップ" }).click();
  await expect(tutorial).toBeHidden();

  await expect(stars(page)).toHaveCount(7);
});

test("日記を書くと星が生まれ、サンプルの星は片付く", async ({ page }) => {
  await openWith(page);
  await expect(stars(page)).toHaveCount(7);

  await page.getByRole("button", { name: "日記を書く" }).click();
  await page.getByPlaceholder("どんな1日だった？").fill("友達とごはんに行った");
  await page.getByRole("button", { name: "星をつくる" }).click();

  await expect(page.getByText("星が生まれました")).toBeVisible();
  await expect(page.getByText("サンプルの星を片付けました")).toBeVisible();
  await expect(stars(page)).toHaveCount(1);

  // 生まれた星の日記がそのまま表示される
  await expect(page.getByText("友達とごはんに行った")).toBeVisible();

  // 読み込み直しても残っている
  await page.reload();
  await expect(stars(page)).toHaveCount(1);
});

test("カレンダーで日記を見返し、月をふりかえる", async ({ page }) => {
  const now = Date.now();
  const diaries = ["朝から散歩した", "仕事が忙しかった", "新しいカフェを見つけた"].map(
    (content, i) => ({
      id: `own-${i}`,
      content,
      emotion: 60,
      energy: 50,
      intensity: 40,
      // 月をまたがないように、いまから数分ずつ前にする
      createdAt: new Date(now - (3 - i) * 60_000).toISOString(),
    }),
  );
  await openWith(page, diaries);

  await page.getByRole("button", { name: "カレンダーを開く" }).click();
  const calendar = page.getByRole("dialog", { name: "カレンダー" });
  await expect(calendar).toBeVisible();
  await expect(calendar.getByText("新しいカフェを見つけた")).toBeVisible();

  await calendar.getByRole("button", { name: "この月をふりかえる" }).click();
  await expect(calendar.getByText("テスト用のふりかえりです。")).toBeVisible();
  await expect(calendar.getByRole("link", { name: "青空文庫" })).toBeVisible();

  // 閉じて開き直しても、ふりかえりは残っている
  await calendar.getByRole("button", { name: "閉じる" }).click();
  await page.getByRole("button", { name: "カレンダーを開く" }).click();
  await expect(page.getByText("テスト用のふりかえりです。")).toBeVisible();
});
