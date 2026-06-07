#!/usr/bin/env node
/**
 * Set the executable bit on the published CLI entry so that
 * `ai-i18n-tools` invoked via the package's `bin` field works
 * after a local `pnpm build`. Mirrors what npm/pnpm do to
 * `bin` files when installing the package from the registry.
 *
 * `tsc` always emits with mode 0o644, regardless of source perms.
 * `fs.chmodSync` is a no-op for the exec bit on Windows but does
 * not throw, so this script is safe to run on every platform.
 */
import { chmodSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
chmodSync(join(root, "bin", "ai-i18n-tools.mjs"), 0o755);
chmodSync(join(root, "dist", "cli", "index.js"), 0o755);
