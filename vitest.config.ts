import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Live OpenRouter smokes live under tests/live/ — run with `pnpm test:live`
    // (excluded from default `pnpm test` / CI even when OPENROUTER_API_KEY is set).
    include: ["tests/unit/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/cli/**",
        "src/types/i18next-scanner.d.ts",
        // Auto-generated sources (e.g. build-info.generated.ts). Keep this `.generated.ts`
        // convention for any future generated file so it is excluded from coverage too.
        "src/**/*.generated.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
