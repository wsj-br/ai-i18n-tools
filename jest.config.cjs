/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/cli/**"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  // TypeScript emits `import "./x.js"` for ESM-friendly paths; Jest resolves sources as `.ts`.
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
