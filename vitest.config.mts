import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // e2e/ は Playwright で動かす
    exclude: [...configDefaults.exclude, "e2e/**"],
    restoreMocks: true,
    unstubEnvs: true,
  },
});
