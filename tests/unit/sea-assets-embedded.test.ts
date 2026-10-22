import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:module", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:module")>();
  return {
    ...actual,
    createRequire: (url: string | URL) => {
      const req = actual.createRequire(url);
      return ((id: string) => {
        if (id === "node:sea") {
          return {
            isSea: () => true,
            getAsset: (key: string) => {
              if (key === "missing-asset") {
                throw new Error("not packed");
              }
              return new TextEncoder().encode(`SEA:${key}`).buffer;
            },
          };
        }
        return req(id);
      }) as ReturnType<typeof createRequire>;
    },
  };
});

describe("SEA embedded asset paths", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reads packed blobs when the filesystem copy is absent", async () => {
    const sea = await import("../../src/core/sea-assets.js");
    expect(sea.isRunningInSea()).toBe(true);
    expect(sea.readSeaText("hello.txt")).toBe("SEA:hello.txt");
    expect(sea.readSeaAsset("missing-asset")).toBeNull();
    expect(sea.bundledMasterAvailable("/definitely/missing/ui-languages-complete.json")).toBe(true);
    expect(sea.readBundledMasterJson("/definitely/missing/ui-languages-complete.json")).toBe(
      "SEA:data/ui-languages-complete.json"
    );
    expect(sea.readUiLocaleAsset("de.json", "/definitely/missing/de.json")).toBe(
      "SEA:i18n/locales/de.json"
    );
  });
});
