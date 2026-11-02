import { Command } from "commander";
import { describe, expect, it } from "vitest";
import {
  SYNC_FORWARDS_FORCE_TO_UI,
  dualNegativeCliOptionSet,
  negatedCliOptionSet,
} from "../../src/cli/negated-cli-flag.js";

function syncLikeCommand(): Command {
  return new Command()
    .exitOverride()
    .option("--no-ui", "Skip UI strings translation", false)
    .option("--no-svg", "Skip SVG", false)
    .option("--no-docs", "Skip docs", false)
    .option("--no-json", "Skip JSON", false)
    .option("--no-cache", "Bypass cache", false)
    .option("--emphasis-placeholders", "Mask emphasis", false)
    .option("--no-emphasis-placeholders", "Do not mask emphasis", false)
    .option("--force", "Docs cache bypass", false);
}

describe("sync negated flags", () => {
  it("treats --no-ui as a skip and leaves the other steps on", () => {
    const cmd = syncLikeCommand();
    cmd.parse(["node", "test", "--no-ui"], { from: "node" });
    expect(negatedCliOptionSet(cmd, "ui")).toBe(true);
    expect(negatedCliOptionSet(cmd, "svg")).toBe(false);
    expect(negatedCliOptionSet(cmd, "docs")).toBe(false);
    expect(negatedCliOptionSet(cmd, "json")).toBe(false);
    expect(cmd.opts().noUi).toBeUndefined();
  });

  it("does not skip UI when --no-ui is omitted, even though the stored value is false", () => {
    const cmd = syncLikeCommand();
    cmd.parse(["node", "test"], { from: "node" });
    expect(negatedCliOptionSet(cmd, "ui")).toBe(false);
    expect(cmd.opts().ui).toBe(false);
  });

  it("reads --no-cache and --no-emphasis-placeholders from the positive Commander name", () => {
    const cmd = syncLikeCommand();
    cmd.parse(["node", "test", "--no-cache", "--no-emphasis-placeholders"], { from: "node" });
    expect(negatedCliOptionSet(cmd, "cache")).toBe(true);
    expect(dualNegativeCliOptionSet(cmd, "emphasisPlaceholders")).toBe(true);
  });

  it("does not treat --emphasis-placeholders as the negative flag", () => {
    const cmd = syncLikeCommand();
    cmd.parse(["node", "test", "--emphasis-placeholders"], { from: "node" });
    expect(dualNegativeCliOptionSet(cmd, "emphasisPlaceholders")).toBe(false);
    expect(cmd.opts().emphasisPlaceholders).toBe(true);
  });

  it("does not forward sync --force to translate-ui", () => {
    expect(SYNC_FORWARDS_FORCE_TO_UI).toBe(false);
  });
});
