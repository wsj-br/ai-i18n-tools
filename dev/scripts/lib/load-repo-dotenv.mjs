import fs from "fs";
import path from "path";

/**
 * Load repository-root `.env` into `process.env` using Node's `process.loadEnvFile`
 * when available (Node 22+). Does not override variables already set in the environment.
 */
export function loadRepoDotenv(repoRoot) {
  const dotenvPath = path.join(repoRoot, ".env");
  if (!fs.existsSync(dotenvPath)) return;
  if (typeof process.loadEnvFile !== "function") {
    console.warn(
      "[ai-i18n-tools] process.loadEnvFile is missing — use Node >= 22.16 or set OPENROUTER_API_KEY in the environment."
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
