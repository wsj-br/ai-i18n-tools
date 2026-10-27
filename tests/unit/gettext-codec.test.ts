import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  buildPoCatalog,
  compileMo,
  fromGettextLocale,
  gnuPluralRule,
  ingestPoTranslations,
  listExistingPoFiles,
  moMessagesFromCatalog,
  parsePo,
  poEntriesFromCatalog,
  serializePo,
  toGettextLocale,
  writeAtomicBuffer,
} from "../../src/core/gettext-codec.js";
import type { StringsJsonEntry } from "../../src/core/types.js";

describe("GNU plural rules", () => {
  it("covers one- through six-form families and keeps cldrForms aligned with nplurals", () => {
    const samples: Array<[string, number]> = [
      ["ja", 1],
      ["en", 2],
      ["fr", 2],
      ["pt-BR", 2],
      ["ru", 3],
      ["pl", 3],
      ["cs", 3],
      ["sl", 4],
      ["ga", 5],
      ["ar", 6],
    ];
    for (const [locale, nplurals] of samples) {
      const rule = gnuPluralRule(locale);
      expect(rule.nplurals).toBe(nplurals);
      expect(rule.cldrForms).toHaveLength(nplurals);
      expect(rule.index(0)).toBeGreaterThanOrEqual(0);
      expect(rule.index(0)).toBeLessThan(nplurals);
    }
    expect(gnuPluralRule("fr").index(0)).toBe(0);
    expect(gnuPluralRule("fr").index(2)).toBe(1);
    expect(gnuPluralRule("en").index(1)).toBe(0);
    expect(gnuPluralRule("en").index(2)).toBe(1);
    expect(gnuPluralRule("ar").index(0)).toBe(0);
    expect(gnuPluralRule("ar").index(3)).toBe(3);
    expect(gnuPluralRule("xx").index(2)).toBe(1);
    expect(gnuPluralRule("pt_BR").cldrForms).toEqual(["one", "other"]);
    expect(gnuPluralRule("ru").index(1)).toBe(0);
    expect(gnuPluralRule("ru").index(11)).toBe(2);
    expect(gnuPluralRule("ru").index(2)).toBe(1);
    expect(gnuPluralRule("ru").index(12)).toBe(2);
    expect(gnuPluralRule("pl").index(1)).toBe(0);
    expect(gnuPluralRule("pl").index(2)).toBe(1);
    expect(gnuPluralRule("pl").index(12)).toBe(2);
    expect(gnuPluralRule("cs").index(1)).toBe(0);
    expect(gnuPluralRule("cs").index(3)).toBe(1);
    expect(gnuPluralRule("cs").index(5)).toBe(2);
    expect(gnuPluralRule("sl").index(1)).toBe(0);
    expect(gnuPluralRule("sl").index(2)).toBe(1);
    expect(gnuPluralRule("sl").index(3)).toBe(2);
    expect(gnuPluralRule("sl").index(5)).toBe(3);
    expect(gnuPluralRule("ga").index(1)).toBe(0);
    expect(gnuPluralRule("ga").index(2)).toBe(1);
    expect(gnuPluralRule("ga").index(5)).toBe(2);
    expect(gnuPluralRule("ga").index(8)).toBe(3);
    expect(gnuPluralRule("ga").index(11)).toBe(4);
    expect(gnuPluralRule("ar").index(1)).toBe(1);
    expect(gnuPluralRule("ar").index(2)).toBe(2);
    expect(gnuPluralRule("ar").index(11)).toBe(4);
    expect(gnuPluralRule("ar").index(100)).toBe(5);
    expect(toGettextLocale("pt-BR", "posix")).toBe("pt_BR");
    expect(toGettextLocale("pt_BR", "bcp47")).toBe("pt-BR");
    expect(fromGettextLocale("pt_BR")).toBe("pt-BR");
  });
});

describe("po and mo codecs", () => {
  it("round-trips msgid, context, and plurals", () => {
    const source = [
      'msgid ""',
      'msgstr ""',
      '"Language: es\\n"',
      "",
      'msgctxt "menu"',
      'msgid "File"',
      'msgstr "Archivo"',
      "",
      'msgid "Hello"',
      'msgstr "Hola"',
      "",
    ].join("\n");
    const parsed = parsePo(source);
    const file = parsed.entries.find((entry) => entry.msgid === "File");
    expect(file?.context).toBe("menu");
    expect(file?.msgstr).toEqual(["Archivo"]);
    const again = parsePo(serializePo(parsed));
    expect(again.entries.find((entry) => entry.msgid === "Hello")?.msgstr).toEqual(["Hola"]);
    const fuzzy = [
      "#. translator note",
      "#, fuzzy",
      "#: app.py:4",
      '#~ msgid "Old"',
      '#~ msgstr "Viejo"',
      "",
      'msgid "One"',
      'msgid_plural "Many"',
      'msgstr[0] "Uno"',
      'msgstr[1] "Muchos"',
      "",
    ].join("\n");
    const ingested = ingestPoTranslations(fuzzy, "es");
    expect(ingested.some((row) => row.plural && row.source === "One")).toBe(true);
    expect(ingested.some((row) => row.source === "Old")).toBe(false);
  });

  it("loads a compiled catalog with Python gettext when python3 is available", () => {
    const probe = spawnSync("python3", ["--version"], { encoding: "utf8" });
    if (probe.status !== 0) {
      expect(probe.status).not.toBe(0);
      return;
    }
    const strings: Record<string, StringsJsonEntry> = {
      a: { source: "Hello", translated: { es: "Hola" } },
      b: {
        source: "Café",
        context: "menu",
        translated: { es: "Café es" },
      },
      c: {
        plural: true,
        source: "1 file",
        pluralSource: "{count} files",
        translated: { es: { one: "1 archivo", other: "{count} archivos" } },
      },
    };
    const messages = moMessagesFromCatalog(strings, "es");
    const mo = compileMo(messages);
    expect(mo.readUInt32LE(0)).toBe(0x950412de);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-mo-"));
    const localeDir = path.join(dir, "es", "LC_MESSAGES");
    fs.mkdirSync(localeDir, { recursive: true });
    fs.writeFileSync(path.join(localeDir, "messages.mo"), mo);
    const script = `
import gettext
tr = gettext.translation("messages", ${JSON.stringify(dir)}, languages=["es"])
print(tr.gettext("Hello"))
print(tr.pgettext("menu", "Café"))
print(tr.ngettext("1 file", "{count} files", 2))
`;
    const result = spawnSync("python3", ["-c", script], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("Hola\nCafé es\n{count} archivos\n");
  });

  it("parses continued strings, flags, and empty translations", () => {
    const source = [
      'msgid ""',
      'msgstr ""',
      '"Language: de\\n"',
      "",
      "#. translator note",
      "#, python-format",
      "#: app.py:4 helper.py:9",
      'msgctxt "button"',
      'msgid ""',
      '"Save"',
      'msgstr ""',
      '"Speichern"',
      "",
      "# orphan comment",
      "",
      'msgid "Empty"',
      'msgstr ""',
      "",
      'msgid "One"',
      'msgid_plural "Many"',
      'msgstr[0] ""',
      'msgstr[1] ""',
      "",
      "#: no-line-here",
      'msgid "Plain"',
      'msgstr "Klar"',
    ].join("\n");
    const parsed = parsePo(source);
    expect(parsed.entries.find((entry) => entry.msgid === "Save")?.context).toBe("button");
    expect(ingestPoTranslations(source, "de").map((row) => row.source)).toEqual(["Save", "Plain"]);
    const long = "Word ".repeat(20).trim();
    const serialized = serializePo({
      entries: [
        ...parsed.entries,
        {
          comments: ["# leftover"],
          flags: ["python-format"],
          references: ["old.py:1"],
          context: "ctx",
          msgid: `${long}\n${long}`,
          msgidPlural: "Many",
          msgstr: ["a", "b"],
          fuzzy: true,
          obsolete: true,
        },
      ],
    });
    expect(serialized).toContain("#~ msgid");
    expect(serialized).toContain("python-format");
  });

  it("rebuilds a catalog from previous entries and lists on-disk po files", () => {
    const previousEpoch = process.env.SOURCE_DATE_EPOCH;
    process.env.SOURCE_DATE_EPOCH = "1700000000";
    try {
      const previous = [
        'msgid ""',
        'msgstr ""',
        '"Project-Id-Version: demo\\n"',
        "",
        "#. keep",
        'msgid "Hello"',
        'msgstr "Hola"',
        "",
        '#~ msgid "Gone"',
        '#~ msgstr "Fue"',
        "",
        'msgid "Unused"',
        'msgstr "Sin uso"',
      ].join("\n");
      const catalog = buildPoCatalog({
        locale: "es",
        domain: "messages",
        previous,
        entries: [
          { msgid: "Hello", msgstr: ["Hola"], references: ["app.py:1"] },
          { msgid: "Hello", msgstr: ["dup"], references: [] },
          {
            context: "menu",
            msgid: "File",
            msgidPlural: "Files",
            msgstr: ["Archivo", "Archivos"],
            references: ["app.py:2"],
          },
        ],
      });
      expect(catalog.entries.some((entry) => entry.msgid === "Hello" && !entry.obsolete)).toBe(
        true
      );
      expect(catalog.entries.some((entry) => entry.msgid === "Unused" && entry.obsolete)).toBe(
        true
      );
      expect(catalog.entries.some((entry) => entry.msgid === "Gone" && entry.obsolete)).toBe(true);

      const rows = poEntriesFromCatalog(
        {
          skip: { source: "   ", translated: {} },
          plain: { source: "Hello", translated: { es: "Hola" } },
          ctx: { source: "File", context: "menu", translated: {} },
          plural: {
            plural: true,
            source: "1 file",
            pluralSource: "{count} files",
            context: "docs",
            translated: { es: { one: "1 archivo", other: "{count} archivos" } },
            locations: [{ file: "app.py", line: 3 }],
          },
        },
        "es"
      );
      expect(rows.some((row) => row.msgid === "Hello")).toBe(true);
      expect(rows.some((row) => row.context === "docs" && row.msgidPlural)).toBe(true);

      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ai-i18n-po-list-"));
      const localeDir = path.join(dir, "locales", "es", "LC_MESSAGES");
      fs.mkdirSync(localeDir, { recursive: true });
      fs.writeFileSync(path.join(dir, "locales", "readme.txt"), "skip");
      const poPath = path.join(localeDir, "messages.po");
      writeAtomicBuffer(poPath, Buffer.from('msgid "Hi"\nmsgstr "Hola"\n', "utf8"));
      const potPath = path.join(dir, "messages.pot");
      fs.writeFileSync(potPath, 'msgid "Hi"\nmsgstr ""\n');
      const listed = listExistingPoFiles(dir, "locales", "messages", potPath);
      expect(listed.some((item) => item.locale === "es")).toBe(true);
      expect(listed.some((item) => item.locale === "")).toBe(true);
      expect(listExistingPoFiles(dir, "missing", "messages")).toEqual([]);
    } finally {
      if (previousEpoch === undefined) {
        delete process.env.SOURCE_DATE_EPOCH;
      } else {
        process.env.SOURCE_DATE_EPOCH = previousEpoch;
      }
    }
  });
});
