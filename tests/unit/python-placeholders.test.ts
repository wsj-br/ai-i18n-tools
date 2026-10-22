import { describe, expect, it } from "vitest";
import {
  assertUIBatchPlaceholders,
  canonicalPlaceholderFamily,
  collectPlaceholderFamilies,
  extractUiPlaceholderTokens,
  isNounOnlyPluralSource,
  isQuantityPlaceholderFamily,
  UiBatchPlaceholderError,
} from "../../src/core/ui-placeholders.js";

describe("python placeholder tokens", () => {
  it("keeps i18next tokens and adds printf, format, and python-i18n tokens", () => {
    const tokens = extractUiPlaceholderTokens(
      "Hi {{name}} and {0} and %s and %(user)s and {price:,.2f} and %{count} and 100%"
    );
    expect(tokens).toEqual(["{{name}}", "{0}", "%s", "%(user)s", "{price:,.2f}", "%{count}"]);
  });

  it("treats %% as a literal percent", () => {
    expect(extractUiPlaceholderTokens("100%% done %s")).toEqual(["%s"]);
  });

  it("does not treat prose braces as placeholders", () => {
    expect(extractUiPlaceholderTokens("use { not a field")).toEqual([]);
  });

  it("does not treat a modulo operator in prose as printf", () => {
    expect(extractUiPlaceholderTokens('_("..." % expr)')).toEqual([]);
    expect(extractUiPlaceholderTokens("% and % calls")).toEqual([]);
    expect(extractUiPlaceholderTokens("100% complete")).toEqual([]);
    expect(extractUiPlaceholderTokens("width %s")).toEqual(["%s"]);
  });

  it("keeps format specs in the family key and still canonicalizes mustache names", () => {
    expect(canonicalPlaceholderFamily("{{ count }}")).toBe("count");
    expect(canonicalPlaceholderFamily("{ 0 }")).toBe("{0}");
    expect(canonicalPlaceholderFamily("{price:,.2f}")).toBe("{price:,.2f}");
    expect(canonicalPlaceholderFamily("{name!r}")).toBe("{name!r}");
    expect(collectPlaceholderFamilies("Save {{count}}").has("count")).toBe(true);
    expect(collectPlaceholderFamilies("Save {count}").has("{count}")).toBe(true);
  });

  it("recognizes quantity families used by plural checks", () => {
    for (const family of [
      "count",
      "%d",
      "%i",
      "{count}",
      "{count:,}",
      "%(count)d",
      "%{n}",
      "{0}",
    ]) {
      expect(isQuantityPlaceholderFamily(family)).toBe(true);
    }
    expect(isQuantityPlaceholderFamily("{user}")).toBe(false);
    expect(isQuantityPlaceholderFamily("%s")).toBe(false);
  });

  it("parses dotted fields, indexes, conversions, and printf width/precision", () => {
    expect(
      extractUiPlaceholderTokens(
        "{user.name} {user[0]} {user['id']} {item[\"sku\"]} {} {name!s} {name!r:.2f} %*.*s %.2f %#04x"
      )
    ).toEqual([
      "{user.name}",
      "{user[0]}",
      "{user['id']}",
      '{item["sku"]}',
      "{}",
      "{name!s}",
      "{name!r:.2f}",
      "%*.*s",
      "%.2f",
      "%#04x",
    ]);
    expect(extractUiPlaceholderTokens("{user[")).toEqual([]);
    expect(extractUiPlaceholderTokens("{name!x}")).toEqual([]);
    expect(extractUiPlaceholderTokens("{{name")).toEqual([]);
    expect(extractUiPlaceholderTokens("%(bad name)s")).toEqual([]);
    expect(extractUiPlaceholderTokens("%.f")).toEqual([]);
    expect(canonicalPlaceholderFamily("{{ leftover")).toBe("{{ leftover");
    expect(canonicalPlaceholderFamily("%s")).toBe("%s");
    expect(isQuantityPlaceholderFamily("%u")).toBe(true);
    expect(isQuantityPlaceholderFamily("{count!r:,}")).toBe(true);
    expect(isQuantityPlaceholderFamily("%(count)d")).toBe(true);
    expect(isNounOnlyPluralSource("files")).toBe(true);
    expect(isNounOnlyPluralSource("3 files")).toBe(false);
    expect(isNounOnlyPluralSource("{count} files")).toBe(false);
  });

  it("rejects a translation that drops or invents a placeholder", () => {
    expect(() => assertUIBatchPlaceholders(["Hello, {name}!"], ["Hola!"])).toThrow(
      UiBatchPlaceholderError
    );
    expect(() => assertUIBatchPlaceholders(["Total: {price:,.2f}"], ["Total: {price}"])).toThrow(
      UiBatchPlaceholderError
    );
    expect(() => assertUIBatchPlaceholders(["Hello, {name}!"], ["¡Hola, {name}!"])).not.toThrow();
  });
});
