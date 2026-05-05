import { describe, expect, it } from "vitest";
import {
  getAttributeMetadataForPrompt,
  protectJsxAttributes,
  restoreJsxAttributes,
} from "../../src/processors/jsx-attribute-placeholders.js";

describe("jsx-attribute-placeholders", () => {
  describe("protectJsxAttributes", () => {
    it("replaces double-quoted label values with placeholders", () => {
      const src = '<Button label="Save changes" />';
      const r = protectJsxAttributes(src);
      expect(r.protected).toBe("<Button {{JXA_0}} />");
      expect(r.attributeMap).toEqual(["Save changes"]);
      expect(r.attributeMetadata).toEqual([
        { attributeName: "label", originalValue: "Save changes", placeholderIndex: 0 },
      ]);
    });

    it("replaces single-quoted tooltip values", () => {
      const src = "<Hint tooltip='Tap here to continue' />";
      const r = protectJsxAttributes(src);
      expect(r.protected).toContain("{{JXA_0}}");
      expect(r.attributeMap).toEqual(["Tap here to continue"]);
      expect(r.attributeMetadata[0]?.attributeName).toBe("tooltip");
    });

    it("extracts label then tooltip in pattern order (single tag)", () => {
      const src = '<Panel label="First step" tooltip="Second step" />';
      const r = protectJsxAttributes(src);
      expect(r.attributeMap).toEqual(["First step", "Second step"]);
    });

    it("extracts aria-label on its own", () => {
      const r = protectJsxAttributes('<Panel aria-label="Screen title" />');
      expect(r.attributeMap).toEqual(["Screen title"]);
    });

    it("matches the substring `label=` inside `aria-label` (naive label regex)", () => {
      const src = '<Panel aria-label="Only this" />';
      const r = protectJsxAttributes(src);
      expect(r.attributeMap).toEqual(["Only this"]);
      expect(r.protected).toMatch(/\{\{JXA_0\}\}/);
    });

    it("skips empty values and numeric or boolean-like strings", () => {
      const src = '<X label="" label="42" label="true" label="false" label="Use me" />';
      const r = protectJsxAttributes(src);
      expect(r.attributeMap).toEqual(["Use me"]);
      expect(r.protected).toContain("{{JXA_0}}");
    });

    it("skips identifier-like values except allowed id and value", () => {
      const r1 = protectJsxAttributes('<X label="internalKey" />');
      expect(r1.attributeMap).toEqual([]);

      const r2 = protectJsxAttributes('<X label="id" label="value" />');
      expect(r2.attributeMap).toEqual(["id", "value"]);
    });

    it("skips values that look like URLs or selectors", () => {
      const r1 = protectJsxAttributes('<X label="https://example.com" />');
      expect(r1.attributeMap).toEqual([]);

      const r2 = protectJsxAttributes('<X label="foo.bar" />');
      expect(r2.attributeMap).toEqual([]);

      const r3 = protectJsxAttributes('<X label="#anchor" />');
      expect(r3.attributeMap).toEqual([]);

      const r4 = protectJsxAttributes('<X label="@user" />');
      expect(r4.attributeMap).toEqual([]);
    });
  });

  describe("restoreJsxAttributes", () => {
    it("substitutes map values for placeholders (attribute name and quotes are not reinserted)", () => {
      const p = protectJsxAttributes('<Btn label="Hello world" />');
      expect(p.protected).toBe("<Btn {{JXA_0}} />");
      expect(restoreJsxAttributes(p.protected, ["Hola mundo"])).toBe("<Btn Hola mundo />");
    });

    it("accepts lenient placeholder spelling with hyphen or spaces", () => {
      const map = ["Restored"];
      expect(restoreJsxAttributes("x {{JXA_0}} y", map)).toBe("x Restored y");
      expect(restoreJsxAttributes("x {{JXA-0}} y", map)).toBe("x Restored y");
      expect(restoreJsxAttributes("x {{ JXA_0 }} y", map)).toBe("x Restored y");
    });

    it("returns text unchanged when the map is empty", () => {
      expect(restoreJsxAttributes("no placeholders", [])).toBe("no placeholders");
    });

    it("replaces higher indices before lower to avoid corrupting nested-like patterns", () => {
      const map = ["a", "b"];
      const text = "{{JXA_0}} {{JXA_1}}";
      expect(restoreJsxAttributes(text, map)).toBe("a b");
    });
  });

  describe("getAttributeMetadataForPrompt", () => {
    it("formats metadata lines for prompts", () => {
      const r = protectJsxAttributes('<X label="Hi there" tooltip="Over here" />');
      expect(getAttributeMetadataForPrompt(r.attributeMetadata)).toEqual([
        'label: "Hi there"',
        'tooltip: "Over here"',
      ]);
    });

    it("returns empty array when there is no metadata", () => {
      expect(getAttributeMetadataForPrompt([])).toEqual([]);
    });
  });
});
