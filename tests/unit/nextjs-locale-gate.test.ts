import { describe, expect, it } from "vitest";
import {
  isCurrentRequest,
  pickLocale,
} from "../../examples/nextjs-app/src/lib/locale-gate.js";

const valid = new Set(["en-GB", "de", "pt-BR"]);

describe("nextjs example locale gate", () => {
  it("uses a direct target-locale query and falls back when the code is unknown", () => {
    expect(pickLocale("de", valid, "en-GB")).toBe("de");
    expect(pickLocale("nope", valid, "en-GB")).toBe("en-GB");
    expect(pickLocale(null, valid, "en-GB")).toBe("en-GB");
  });

  it("ignores an older load when the visitor has already switched", () => {
    expect(isCurrentRequest(1, 1)).toBe(true);
    expect(isCurrentRequest(1, 2)).toBe(false);
  });
});
