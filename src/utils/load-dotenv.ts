import fs from "fs";
import path from "path";

/**
 * Load a `.env` file from `cwd` into `process.env` using Node's `process.loadEnvFile`
 * (Node 22+). Variables already present in the environment are never overridden, so
 * real CI/production environment values always win over the file.
 *
 * This lets CLI commands pick up `.env` automatically in non-interactive shells
 * (e.g. agent-run commands) that do not source `.envrc`/`direnv`.
 */
export function loadDotenv(cwd: string = process.cwd()): void {
  const dotenvPath = path.join(cwd, ".env");
  if (!fs.existsSync(dotenvPath)) return;
  if (typeof process.loadEnvFile !== "function") {
    console.warn(
      "[ai-i18n-tools] process.loadEnvFile is missing — use Node >= 22.16 or set provider API keys in the environment."
    );
    return;
  }
  try {
    process.loadEnvFile(dotenvPath);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[ai-i18n-tools] Could not load .env: ${msg}`);
  }
}
