import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright specs live in e2e/ and run via `pnpm run test:e2e`.
    include: ["tests/**/*.test.ts"],
    testTimeout: 60_000,
  },
});
