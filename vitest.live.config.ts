import { defineConfig } from "vitest/config";

/** Opt-in live LLM smokes (needs OPENROUTER_API_KEY). Not used by `pnpm test`. */
const liveVerbose =
  process.env.AI_I18N_LIVE_VERBOSE === "1" ||
  process.env.AI_I18N_LIVE_VERBOSE === "true" ||
  process.env.AI_I18N_LIVE_VERBOSE === "yes";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/live/**/*.test.ts"],
    testTimeout: 90_000,
    // When detail dumps are on, do not buffer console so prompts stay visible.
    disableConsoleIntercept: liveVerbose,
  },
});
