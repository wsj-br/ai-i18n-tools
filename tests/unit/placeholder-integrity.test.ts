import { describe, expect, it } from "vitest";
import { protectHtmlTags, restoreHtmlTags } from "../../src/processors/html-tag-placeholders.js";
import { hasInternalPlaceholderLeak } from "../../src/processors/translation-placeholder-leaks.js";
import {
  collectPostRestorePlaceholderErrors,
  collectPreRestorePlaceholderErrors,
  collectUnexpectedIdentErrors,
  compareHtmlTagKindSequences,
  compareIdentTokenSequences,
  extractIdentTokens,
} from "../../src/processors/placeholder-integrity.js";

const SOURCE_LI_A =
  '<li><a href="display-settings.md">Display Settings</a>: Configure theme, chart time range, chart style, format locale, auto-refresh interval, card sort order, and week start</li>';

const PROSE_DE =
  "Anzeigeeinstellungen: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart";

const BAD_RESTORED_DE =
  '<li><a href="display-settings.md">Anzeigeeinstellungen</li>: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart</li>';

const GOOD_RESTORED_DE =
  '<li><a href="display-settings.md">Anzeigeeinstellungen</a>: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart</li>';

function protectedLiA(): { protected: string; htmlTagMap: string[] } {
  return protectHtmlTags(SOURCE_LI_A);
}

describe("placeholder-integrity HTML tag map (corpus 1.1 / 2.*)", () => {
  it("2.1 fail-tag-swap: reused HTM_3 drops </a> after restore", () => {
    const p = protectedLiA();
    expect(p.htmlTagMap).toEqual(["<li>", '<a href="display-settings.md">', "</a>", "</li>"]);
    const swapped =
      "{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_3}}: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart{{HTM_3}}";
    expect(compareIdentTokenSequences(p.protected, swapped)).toMatch(/reused or dropped/);
    const restored = restoreHtmlTags(swapped, p.htmlTagMap);
    expect(restored).toBe(BAD_RESTORED_DE);
    expect(compareHtmlTagKindSequences(SOURCE_LI_A, restored)).toMatch(/tag kind mismatch/);
    expect(collectPostRestorePlaceholderErrors(SOURCE_LI_A, restored).length).toBeGreaterThan(0);
  });

  it("2.2 pass: correct token set with German prose", () => {
    const p = protectedLiA();
    const good =
      "{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart{{HTM_3}}";
    expect(compareIdentTokenSequences(p.protected, good)).toBeNull();
    const restored = restoreHtmlTags(good, p.htmlTagMap);
    expect(restored).toBe(GOOD_RESTORED_DE);
    expect(compareHtmlTagKindSequences(SOURCE_LI_A, restored)).toBeNull();
    expect(collectPostRestorePlaceholderErrors(SOURCE_LI_A, restored)).toEqual([]);
  });

  it("2.3 pass: correct tokens with untranslated English prose", () => {
    const p = protectedLiA();
    expect(compareIdentTokenSequences(p.protected, p.protected)).toBeNull();
    expect(compareHtmlTagKindSequences(SOURCE_LI_A, SOURCE_LI_A)).toBeNull();
  });

  it("2.4 fail-tag-swap: dropped closing </li>", () => {
    const p = protectedLiA();
    const model =
      "{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart";
    expect(compareIdentTokenSequences(p.protected, model)).toMatch(/reused or dropped/);
  });

  it("2.5 fail-tag-swap: dropped opening <li>", () => {
    const p = protectedLiA();
    const model =
      "{{HTM_1}}Anzeigeeinstellungen{{HTM_2}}: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart{{HTM_3}}";
    expect(compareIdentTokenSequences(p.protected, model)).toMatch(/reused or dropped/);
  });

  it("2.6 fail-tag-swap: literal </a> plus unused HTM_2", () => {
    const p = protectedLiA();
    const model =
      "{{HTM_0}}{{HTM_1}}Anzeigeeinstellungen</a>: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart{{HTM_3}}";
    // Pre-restore sequence catches missing HTM_2; after restore a literal </a> may still
    // yield a matching tag-kind sequence, so layer A is required for this case.
    expect(compareIdentTokenSequences(p.protected, model)).toMatch(/reused or dropped/);
    expect(collectPreRestorePlaceholderErrors({ text: p.protected }, model).length).toBeGreaterThan(
      0
    );
  });

  it("2.7 fail-tag-swap: open <a> and </a> swapped", () => {
    const p = protectedLiA();
    const model =
      "{{HTM_0}}{{HTM_2}}Anzeigeeinstellungen{{HTM_1}}: Konfigurieren Sie Design, Diagramm-Zeitbereich, Diagrammstil, Gebietsschema-Format, automatisches Aktualisierungsintervall, Karten-Sortierreihenfolge und Wochenstart{{HTM_3}}";
    expect(compareIdentTokenSequences(p.protected, model)).toMatch(/sequence mismatch/);
    const restored = restoreHtmlTags(model, p.htmlTagMap);
    expect(compareHtmlTagKindSequences(SOURCE_LI_A, restored)).toMatch(/tag kind mismatch/);
  });

  it("2.8 fail-tag-swap: all tokens present once but reversed order", () => {
    const p = protectedLiA();
    const model = `{{HTM_3}}{{HTM_2}}{{HTM_1}}{{HTM_0}}${PROSE_DE}`;
    expect(compareIdentTokenSequences(p.protected, model)).toMatch(/sequence mismatch/);
  });
});

describe("placeholder-integrity RTL logical order", () => {
  it("passes Arabic prose between tokens when HTM sequence is unchanged", () => {
    const p = protectedLiA();
    const model = "{{HTM_0}}{{HTM_1}}إعدادات العرض{{HTM_2}}: تكوين السمة ونطاق وقت المخطط{{HTM_3}}";
    expect(compareIdentTokenSequences(p.protected, model)).toBeNull();
    const restored = restoreHtmlTags(model, p.htmlTagMap);
    expect(compareHtmlTagKindSequences(SOURCE_LI_A, restored)).toBeNull();
  });

  it("fails when HTM indices are reversed with Arabic prose", () => {
    const p = protectedLiA();
    const model = "{{HTM_3}}{{HTM_2}}إعدادات العرض{{HTM_1}}: تكوين السمة{{HTM_0}}";
    expect(compareIdentTokenSequences(p.protected, model)).toMatch(/sequence mismatch/);
  });

  it("passes with RLM/LRM outside tokens", () => {
    const p = protectedLiA();
    const rlm = "\u200F";
    const model = `${rlm}{{HTM_0}}{{HTM_1}}${rlm}إعدادات${rlm}{{HTM_2}}: نص{{HTM_3}}`;
    expect(compareIdentTokenSequences(p.protected, model)).toBeNull();
  });
});

describe("placeholder-integrity emphasis float vs numbered order", () => {
  const hardenProtected =
    "1. Keep port {{ILC_0}} off the public internet.\n" +
    "2. Create [API keys]({{URL_0}}) and enable {{SE}}Require API keys for external APIs{{SE}}.\n" +
    "3. Serve {{SE}}duplistatus{{SE}} through a [reverse proxy with HTTPS]({{URL_1}}).\n" +
    "4. Add the address to {{SE}}Trusted proxies{{SE}} (or {{ILC_1}}).\n" +
    "5. Enable [IP allowlists]({{URL_2}}), using {{SE}}Detected IP{{SE}}.";

  it("passes when {{URL_1}} moves before a {{SE}} pair (CJK-style word order)", () => {
    // Same failure signature as duplistatus harden-duplistatus-security.md zh-Hans:
    // index 4 expected {{SE}}, got {{URL_1}} under the old full-sequence compare.
    const reordered =
      "1. Keep port {{ILC_0}} off the public internet.\n" +
      "2. Create [API keys]({{URL_0}}) and enable {{SE}}Require API keys for external APIs{{SE}}.\n" +
      "3. Serve [reverse proxy with HTTPS]({{URL_1}}) 提供 {{SE}}duplistatus{{SE}}.\n" +
      "4. Add the address to {{SE}}Trusted proxies{{SE}} (or {{ILC_1}}).\n" +
      "5. Enable [IP allowlists]({{URL_2}}), using {{SE}}Detected IP{{SE}}.";
    expect(compareIdentTokenSequences(hardenProtected, reordered)).toBeNull();
    expect(collectPreRestorePlaceholderErrors({ text: hardenProtected }, reordered)).toEqual([]);
  });

  it("passes when {{BLD_0}} precedes reordered {{SE}} (ja concurrent example)", () => {
    const protectedSrc =
      "substituindo chamadas {{SE}}síncronas{{SE}} por {{BLD_0}} sempre que possível";
    const model = "可能な限り{{BLD_0}}を使用して{{SE}}同期{{SE}}呼び出しを置き換える";
    expect(compareIdentTokenSequences(protectedSrc, model)).toBeNull();
  });

  it("passes when content {{URL_N}} / {{ILC_N}} tokens reorder (restore-by-id)", () => {
    const swapped =
      "1. Keep port {{ILC_0}} off the public internet.\n" +
      "2. Create [API keys]({{URL_1}}) and enable {{SE}}Require API keys for external APIs{{SE}}.\n" +
      "3. Serve {{SE}}duplistatus{{SE}} through a [reverse proxy with HTTPS]({{URL_0}}).\n" +
      "4. Add the address to {{SE}}Trusted proxies{{SE}} (or {{ILC_1}}).\n" +
      "5. Enable [IP allowlists]({{URL_2}}), using {{SE}}Detected IP{{SE}}.";
    expect(compareIdentTokenSequences(hardenProtected, swapped)).toBeNull();
  });

  it("passes when {{ILC_3}} precedes {{ILC_1}} (hi write-heading-ids prose)", () => {
    // docs/reference/cli-commands/documents.md hash 657a41dfd6362bbf — models reorder
    // contentPaths (ILC_3) ahead of .md (ILC_1) for Hindi word order.
    const protectedSrc =
      "Requires at least one {{ILC_0}} block. Collects {{ILC_1}} / {{ILC_2}} under each block's {{ILC_3}} (honours {{ILC_4}}).";
    const reordered =
      "प्रत्येक ब्लॉक के {{ILC_3}} के अंतर्गत कम से कम एक {{ILC_0}} ब्लॉक आवश्यक। {{ILC_1}} / {{ILC_2}} एकत्र करता है ({{ILC_4}} का सम्मान)।";
    expect(compareIdentTokenSequences(protectedSrc, reordered)).toBeNull();
  });

  it("fails when a {{SE}} pair is dropped", () => {
    const dropped =
      "1. Keep port {{ILC_0}} off the public internet.\n" +
      "2. Create [API keys]({{URL_0}}) and enable Require API keys for external APIs.\n" +
      "3. Serve {{SE}}duplistatus{{SE}} through a [reverse proxy with HTTPS]({{URL_1}}).\n" +
      "4. Add the address to {{SE}}Trusted proxies{{SE}} (or {{ILC_1}}).\n" +
      "5. Enable [IP allowlists]({{URL_2}}), using {{SE}}Detected IP{{SE}}.";
    expect(compareIdentTokenSequences(hardenProtected, dropped)).toMatch(
      /expected 13 \{\{\u2026\}\} token\(s\), got 11/
    );
  });

  it("fails when an {{ILC_N}} id is reused and another dropped", () => {
    const protectedSrc = "Use {{ILC_0}} then {{ILC_1}} then {{ILC_2}}.";
    const bad = "Use {{ILC_0}} then {{ILC_2}} then {{ILC_2}}.";
    expect(compareIdentTokenSequences(protectedSrc, bad)).toMatch(/{{ILC_1}}|{{ILC_2}}/);
  });
});

describe("placeholder-integrity invented braces (corpus 3.*)", () => {
  const apiKeysSource =
    "- Optional [API keys](settings/api-keys-settings.md) for Duplicati uploads and Homepage widgets, with upload size and rate limits";

  it("3.1 fail-invented-braces: {{TAM}}", () => {
    const bad =
      "- [Claves de API](settings/api-keys-settings.md) opcionales para las subidas de Duplicati y los widgets de Homepage, con límites de tasa y de {{TAM}} de subida";
    expect(hasInternalPlaceholderLeak(bad)).toBe(false);
    const errs = collectUnexpectedIdentErrors(apiKeysSource, bad);
    expect(errs.some((e) => e.includes("Unexpected {{…}} token") && e.includes("{{TAM}}"))).toBe(
      true
    );
    expect(collectPostRestorePlaceholderErrors(apiKeysSource, bad).length).toBeGreaterThan(0);
  });

  it("3.2 / 3.3 fail case variants {{tam}} / {{Tam}}", () => {
    expect(
      collectUnexpectedIdentErrors(apiKeysSource, "… de {{tam}} de subida").length
    ).toBeGreaterThan(0);
    expect(
      collectUnexpectedIdentErrors(apiKeysSource, "… de {{Tam}} de subida").length
    ).toBeGreaterThan(0);
  });

  it("3.4 / 3.5 / 3.6 / 3.11 leftover official tokens fail", () => {
    for (const token of ["{{GLS_0}}", "{{HTM_0}}", "{{HTM-0}}", "{{MDX_0}}"]) {
      const errs = collectUnexpectedIdentErrors(apiKeysSource, `… de ${token} de subida`);
      expect(errs.some((e) => e.includes("placeholder leaked") || e.includes("Unexpected"))).toBe(
        true
      );
    }
  });

  it("3.7 pass: good Spanish without braces", () => {
    const good =
      "- [Claves de API](settings/api-keys-settings.md) opcionales para las subidas de Duplicati y los widgets de Homepage, con límites de tasa y de tamaño de subida";
    expect(collectPostRestorePlaceholderErrors(apiKeysSource, good)).toEqual([]);
  });

  it("3.8 pass: plain Tam glossary abbreviation", () => {
    expect(collectUnexpectedIdentErrors(apiKeysSource, "… de Tam de subida")).toEqual([]);
  });

  it("3.9 pass: source already contains {{count}}", () => {
    const source = 'Use t("{{count}} backups selected") in examples';
    const out = 'Use t("{{count}} backups selected") in examples';
    expect(collectUnexpectedIdentErrors(source, out)).toEqual([]);
    expect(collectPostRestorePlaceholderErrors(source, out)).toEqual([]);
  });

  it("3.10 pass: single braces in URL badge", () => {
    const src = "![versión](https://img.shields.io/badge/version-{VERSION}-blue)";
    expect(collectUnexpectedIdentErrors(src, src)).toEqual([]);
    expect(extractIdentTokens(src)).toEqual([]);
  });

  it("3.12 / 3.13 fail {{FOO}} and {{ count }}", () => {
    expect(collectUnexpectedIdentErrors("hello", "x {{FOO}} y").length).toBeGreaterThan(0);
    expect(collectUnexpectedIdentErrors("hello", "x {{ count }} y").length).toBeGreaterThan(0);
  });
});

describe("placeholder-integrity section 5 guards", () => {
  it("passes markdown links without HTML tags", () => {
    const src = "- Optional [API keys](settings/api-keys-settings.md) for Duplicati uploads";
    const out = "- [Claves de API](settings/api-keys-settings.md) opcionales para Duplicati";
    expect(collectPostRestorePlaceholderErrors(src, out)).toEqual([]);
  });

  it("passes author {{count}} present in source", () => {
    const src = "Selected {{count}} items";
    const out = "Seleccionados {{count}} elementos";
    expect(collectPostRestorePlaceholderErrors(src, out)).toEqual([]);
  });

  it("passes heading id and MDX comment forms without inventing IDENT", () => {
    const src = "## Overview {#overview}\n{/* #heading-id */}";
    const out = "## Resumen {#overview}\n{/* #heading-id */}";
    expect(collectUnexpectedIdentErrors(src, out)).toEqual([]);
  });

  it("passes style={{…}} MDX expression (not IDENT token)", () => {
    const src = '<td style={{verticalAlign: "top"}}>Size</td>';
    const out = '<td style={{verticalAlign: "top"}}>Tamaño</td>';
    expect(extractIdentTokens(src)).toEqual([]);
    expect(collectUnexpectedIdentErrors(src, out)).toEqual([]);
  });
});

describe("collectPreRestorePlaceholderErrors", () => {
  it("flags sequence mismatch against protect state", () => {
    const p = protectedLiA();
    const errs = collectPreRestorePlaceholderErrors(
      { text: p.protected },
      "{{HTM_0}}{{HTM_1}}x{{HTM_3}}: y{{HTM_3}}",
      "abc"
    );
    expect(errs.length).toBeGreaterThan(0);
    expect(errs[0]).toContain("hash abc");
  });

  it("returns empty when sequences match", () => {
    const p = protectedLiA();
    expect(collectPreRestorePlaceholderErrors({ text: p.protected }, p.protected)).toEqual([]);
  });
});
