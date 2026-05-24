import { describe, expect, it } from "vitest";
import { getTextDirectionFromBundledCatalog } from "../../src/runtime/ui-languages-master-direction.js";

describe("getTextDirectionFromBundledCatalog", () => {
  it("returns rtl for Arabic from the bundled catalog", () => {
    expect(getTextDirectionFromBundledCatalog("ar")).toBe("rtl");
    expect(getTextDirectionFromBundledCatalog("ar-EG")).toBe("rtl");
  });

  it("returns ltr for typical Latin-script locales", () => {
    expect(getTextDirectionFromBundledCatalog("en")).toBe("ltr");
    expect(getTextDirectionFromBundledCatalog("de-DE")).toBe("ltr");
  });

  it("normalizes locale keys like manifest entries (hyphens to underscores)", () => {
    expect(getTextDirectionFromBundledCatalog("pt-BR")).toBe("ltr");
  });

  it("returns undefined for blank or unknown locales", () => {
    expect(getTextDirectionFromBundledCatalog("")).toBeUndefined();
    expect(getTextDirectionFromBundledCatalog("   ")).toBeUndefined();
    expect(getTextDirectionFromBundledCatalog("zz-unknown-locale-xy")).toBeUndefined();
  });
});
