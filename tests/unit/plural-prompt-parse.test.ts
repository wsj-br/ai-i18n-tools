import { describe, expect, it } from "vitest";
import {
  parsePluralFormsJsonResponse,
  PluralFormsParseError,
} from "../../src/core/prompt-builder.js";

describe("parsePluralFormsJsonResponse", () => {
  it("parses object with required keys", () => {
    const out = parsePluralFormsJsonResponse('{"one":"a","other":"b"}', ["one", "other"]);
    expect(out).toEqual({ one: "a", other: "b" });
  });

  it("throws when key missing", () => {
    expect(() => parsePluralFormsJsonResponse('{"one":"a"}', ["one", "other"])).toThrow(
      PluralFormsParseError
    );
  });

  it("trims fenced json", () => {
    const out = parsePluralFormsJsonResponse('```json\n{"other":"z"}\n```', ["other"]);
    expect(out.other).toBe("z");
  });
});
