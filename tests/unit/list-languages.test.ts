import { afterEach, describe, expect, it, vi } from "vitest";
import { runListLanguages, type RunListLanguagesResult } from "../../src/cli/list-languages.js";

function run(search?: string): { result: RunListLanguagesResult; output: string } {
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  try {
    const result = runListLanguages(search);
    const output = logSpy.mock.calls.map((c) => String(c[0] ?? "")).join("\n");
    return { result, output };
  } finally {
    logSpy.mockRestore();
  }
}

describe("runListLanguages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the full catalog when no search term is given", () => {
    const { result, output } = run();
    expect(result.exitCode).toBe(0);
    expect(output).toMatch(/Available UI languages — \d+ entries\./);
    expect(output).toContain("English name");
    expect(output).toContain("Afar");
  });

  it("filters by English name (case-insensitive)", () => {
    const { result, output } = run("PORTUGUESE");
    expect(result.exitCode).toBe(0);
    expect(output).toContain('matching "PORTUGUESE"');
    expect(output).toContain("pt-BR");
    expect(output).not.toContain("Afar");
  });

  it("matches the text direction field (e.g. rtl)", () => {
    const { result, output } = run("rtl");
    expect(result.exitCode).toBe(0);
    expect(output).toContain("Arabic");
  });

  it("reports zero matches without failing", () => {
    const { result, output } = run("zzznomatch");
    expect(result.exitCode).toBe(0);
    expect(output).toContain("No matching languages.");
  });
});
