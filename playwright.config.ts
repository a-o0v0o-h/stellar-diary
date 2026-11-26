import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const MOCK_OPENAI_PORT = 4010;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      name: "OpenAI mock",
      command: "node e2e/mock-openai.mjs",
      url: `http://localhost:${MOCK_OPENAI_PORT}`,
      env: { MOCK_OPENAI_PORT: String(MOCK_OPENAI_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      name: "Next.js",
      // 開発サーバー（3000 番）とぶつからないように別のポートで本番ビルドを動かす
      command: `npm run build && npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      timeout: 180_000,
      env: {
        OPENAI_API_KEY: "e2e-dummy-key",
        OPENAI_BASE_URL: `http://localhost:${MOCK_OPENAI_PORT}/v1`,
        // テストのたびに回数制限にかからないようにする
        DAILY_ANALYZE_LIMIT: "1000",
        DAILY_REFLECT_LIMIT: "1000",
      },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
