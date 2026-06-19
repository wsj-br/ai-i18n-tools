import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
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
