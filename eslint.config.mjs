import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "**/*.cjs",
      "src/edit-cache-app/**",
      "vitest.config.ts",
      "examples/**/.next/**",
      "examples/**/node_modules/**",
      "examples/**/.docusaurus/**",
      "examples/**/docs-site/build/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // ESLint 10 @eslint/js: rethrow sites use plain Error; optional follow-up to chain `cause`.
      "preserve-caught-error": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        describe: true,
        it: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        vi: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["examples/**/*.mjs", "examples/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.node,
    },
  },
  {
    files: ["scripts/**/*.{mjs,js}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.node,
    },
  }
);
