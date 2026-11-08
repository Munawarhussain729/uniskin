import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright specs live in e2e/ and run via `pnpm run test:a11y`.
    include: ["tests/**/*.test.ts"],
  },
});
