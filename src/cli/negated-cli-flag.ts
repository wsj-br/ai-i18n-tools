import type { Command } from "commander";

/**
 * `sync --force` bypasses the docs, JSON, and SVG segment cache.
 * It is not forwarded to `translate-ui`; that command has its own `--force`.
 */
export const SYNC_FORWARDS_FORCE_TO_UI = false;

/**
 * True when argv included a lone `--no-<positiveName>` option.
 * Commander stores that flag on the positive name (`--no-ui` → `ui`) and, with an
 * explicit default of `false`, leaves the value false whether or not the flag was passed.
 */
export function negatedCliOptionSet(cmd: Command, positiveName: string): boolean {
  return cmd.getOptionValueSource(positiveName) === "cli";
}

/**
 * True when a dual pair (`--name` / `--no-name`) was passed as the negative flag.
 * Both options share `positiveName`; only a CLI value of `false` is the negative form.
 */
export function dualNegativeCliOptionSet(cmd: Command, positiveName: string): boolean {
  if (cmd.getOptionValueSource(positiveName) !== "cli") {
    return false;
  }
  const value = (cmd.opts() as Record<string, unknown>)[positiveName];
  return value === false;
}
