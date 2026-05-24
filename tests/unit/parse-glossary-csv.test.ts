import { describe, expect, it, vi } from "vitest";
import { parseGlossaryCsv } from "../../src/glossary/parse-glossary-csv.js";

describe("parseGlossaryCsv", () => {
  it("parses valid glossary CSV with headers", () => {
    const content = [
      "Original language string,locale,Translation,Force",
      "hello,de,hallo,yes",
    ].join("\n");
    const rows = parseGlossaryCsv("/data/glossary-user.csv", content);
    expect(rows).toEqual([
      {
        "Original language string": "hello",
        locale: "de",
        Translation: "hallo",
        Force: "yes",
      },
    ]);
  });

  it("wraps csv-parse failures with the basename of filepath", () => {
    expect(() => parseGlossaryCsv("/path/to/glossary-user.csv", '"unclosed')).toThrow(
      /^glossary-user\.csv: /
    );
  });

  it("stringifies non-Error throws from csv-parse", async () => {
    vi.resetModules();
    vi.doMock("csv-parse/sync", () => ({
      parse: () => {
        // Exercises parseGlossaryCsv `String(e)` when csv-parse does not throw Error.
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- deliberate non-Error throw
        throw "csv blew up";
      },
    }));
    const { parseGlossaryCsv: parseWithMock } =
      await import("../../src/glossary/parse-glossary-csv.js");
    expect(() => parseWithMock("terms.csv", "a,b\n")).toThrow(/^terms\.csv: csv blew up$/);
    vi.doUnmock("csv-parse/sync");
    vi.resetModules();
  });
});
