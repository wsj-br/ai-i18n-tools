import { describe, expect, it } from "vitest";
import { getTextDirectionFromBundledCatalog } from "../../src/runtime/ui-languages-master-direction.js";

describe("getTextDirectionFromBundledCatalog", () => {
  it("returns rtl for Arabic from the bundled catalog", () => {
    expect(getTextDirectionFromBundledCatalog("ar")).toBe("rtl");
    expect(getTextDirectionFromBundledCatalog("arz")).toBe("rtl");
  });

  it("returns ltr for typical Latin-script locales", () => {
    expect(getTextDirectionFromBundledCatalog("en-US")).toBe("ltr");
    expect(getTextDirectionFromBundledCatalog("de")).toBe("ltr");
  });

  it("normalizes locale keys like manifest entries (hyphens to underscores)", () => {
    expect(getTextDirectionFromBundledCatalog("pt-BR")).toBe("ltr");
  });

  it("returns undefined for blank or unknown locales", () => {
    expect(getTextDirectionFromBundledCatalog("")).toBeUndefined();
    expect(getTextDirectionFromBundledCatalog("   ")).toBeUndefined();
    expect(getTextDirectionFromBundledCatalog("zz-unknown-locale-xy")).toBeUndefined();
  });

  it("resolves the script-variant catalog entries (Arabic script is rtl)", () => {
    expect(getTextDirectionFromBundledCatalog("ha-Arab")).toBe("rtl");
    expect(getTextDirectionFromBundledCatalog("uz-Cyrl")).toBe("ltr");
    expect(getTextDirectionFromBundledCatalog("sd-Deva")).toBe("ltr");
    expect(getTextDirectionFromBundledCatalog("mn-Mong")).toBe("ltr");
    expect(getTextDirectionFromBundledCatalog("kk-Latn")).toBe("ltr");
    expect(getTextDirectionFromBundledCatalog("sr-Latn")).toBe("ltr");
  });
});
