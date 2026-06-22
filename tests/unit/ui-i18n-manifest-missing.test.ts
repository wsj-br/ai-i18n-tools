import { describe, expect, it, vi } from "vitest";

// Simulate a missing/unreadable shipped manifest: every read throws.
vi.mock("node:fs", () => {
  const readFileSync = vi.fn(() => {
    throw new Error("ENOENT: no such file");
  });
  return { default: { readFileSync }, readFileSync };
});

import {
  availableUiLocales,
  loadUiManifest,
  uiLocaleDirection,
  UI_SOURCE_LOCALE,
} from "../../src/i18n/index.js";

describe("self-i18n with an unreadable manifest", () => {
  it("treats the manifest as empty without throwing", () => {
    expect(loadUiManifest()).toEqual([]);
  });

  it("still offers the source locale as the only available UI locale", () => {
    expect(availableUiLocales()).toEqual([UI_SOURCE_LOCALE]);
  });

  it("defaults the layout direction to ltr", () => {
    expect(uiLocaleDirection(UI_SOURCE_LOCALE)).toBe("ltr");
  });
});
