import { describe, expect, it } from "vitest";
import {
  extractPythonUiCalls,
  findPythonI18nCalls,
  isGeneratedI18nPy,
  lexPython,
} from "../../src/extractors/python-string-extractor.js";
import { migratePythonI18nSource } from "../../src/cli/migrate-python-i18n.js";
import { uiCatalogHash } from "../../src/extractors/ui-string-locations.js";
import {
  extractTemplateI18nCalls,
  isTemplateI18nFile,
} from "../../src/extractors/template-i18n-extractor.js";
import { extractQtUiCalls } from "../../src/extractors/qt-ui-extractor.js";
import { readPyprojectDescription } from "../../src/extractors/pyproject-toml.js";
import { pluralMultiPlaceholderMissingCount } from "../../src/extractors/ui-string-babel.js";

const FUNCS = [
  "_",
  "t",
  "translate",
  "gettext",
  "ngettext",
  "pgettext",
  "npgettext",
  "self.tr",
  "QCoreApplication.translate",
];

describe("python call extractor", () => {
  it("extracts safe templates and flags pre-evaluated lookups", () => {
    const source = [
      '_("Save")',
      't("Hello, {name}!", name=name)',
      '_(f"Hello, {name}!")',
      '_("Hello, %s!" % name)',
      '_("Hello, %s!") % name',
      '_("Hello, {name}!".format(name=name))',
      'ngettext("1 file", "{count} files", n)',
      'pgettext("menu", "File")',
      'pgettext("button", "File")',
      'translate(t"Hello, {name}!")',
      '# _(f"ignored")',
    ].join("\n");
    const calls = extractPythonUiCalls(source, "app.py", FUNCS);
    expect(calls.find((call) => call.literal === "Save")?.unsafe).toBeUndefined();
    expect(calls.filter((call) => call.literal === "Hello, {name}!" && call.unsafe)).toHaveLength(
      2
    );
    expect(calls.filter((call) => call.literal === "Hello, {name}!" && !call.unsafe)).toHaveLength(
      2
    );
    expect(calls.filter((call) => call.literal === "Hello, %s!" && call.unsafe)).toHaveLength(1);
    expect(calls.filter((call) => call.literal === "Hello, %s!" && !call.unsafe)).toHaveLength(1);
    expect(calls.some((call) => call.pluralSource === "{count} files")).toBe(true);
    expect(calls.filter((call) => call.literal === "File").map((call) => call.context)).toEqual([
      "menu",
      "button",
    ]);
    expect(uiCatalogHash("File", "menu")).not.toBe(uiCatalogHash("File", "button"));
    expect(uiCatalogHash("File")).toBe(uiCatalogHash("File"));
    expect(calls.some((call) => call.literal === "ignored")).toBe(false);
  });

  it("rewrites unsafe calls and is idempotent", () => {
    const source = [
      'label = _(f"Hello, {name}!")',
      'total = _(f"Total: ${price:,.2f}")',
      'metric = _("Hello, %s!" % name)',
      'who = _("Hello, {name}!".format(name=name))',
      'debug = _(f"{value=}")',
      'note = _("already safe")',
    ].join("\n");
    const once = migratePythonI18nSource(source, FUNCS);
    expect(once.content).toContain('t("Hello, {name}!", name=name)');
    expect(once.content).toContain('t("Total: ${price:,.2f}", price=price)');
    expect(once.content).toContain('_("Hello, %s!") % name');
    expect(once.content).toContain('t("Hello, {name}!", name=name)');
    expect(once.content).toContain('_(f"{value=}")');
    expect(once.reviews.length).toBeGreaterThan(0);
    const twice = migratePythonI18nSource(once.content, FUNCS);
    expect(twice.edits).toEqual([]);
    expect(twice.content).toBe(once.content);
    const positional = migratePythonI18nSource('_("Hello, {0}".format(user))', FUNCS);
    expect(positional.reviews.length).toBeGreaterThan(0);
    const named = migratePythonI18nSource('_("Hello, {name}".format(name))', FUNCS);
    expect(named.content).toContain('t("Hello, {name}", name=name)');
    const mixed = migratePythonI18nSource('_("Hello, {name}".format(name, extra=1))', FUNCS);
    expect(mixed.reviews.length).toBeGreaterThan(0);
  });

  it("lexes prefixes, escapes, and keyword flags", () => {
    expect(isGeneratedI18nPy("# ai-i18n-tools-i18n-py: helper")).toBe(true);
    const source = [
      "# comment",
      "x = 0x1f + 1 ** 2",
      's = "A\\n\\x41\\u0042\\U00000043\\N{SPACE}\\101"',
      't = f"{name!r} {name=} {value:{width}} {obj.meth()} {items[0]}"',
      'u = r"raw\\n"',
      'b = b"bytes"',
      'ts = t"Hi {name}"',
      'ngettext("1 file", "{count} files", n)',
      'npgettext("menu", "1 file", "{count} files", n)',
      'pgettext("menu", "File")',
      'ungettext("a", "b", n)',
      'QCoreApplication.translate("ctx", "Save")',
      't("Hello", plurals=True, zero_digit=True)',
      '_("x %s" % name)',
      '_("x {0}".format(name))',
      '_("part" "two")',
      "t('Hello, {name}!', name=name)",
      't(f"{value=}")',
      't(f"{name} extra", other=1)',
    ].join("\n");
    const tokens = lexPython(source);
    expect(tokens.some((tok) => tok.fString)).toBe(true);
    expect(tokens.some((tok) => tok.bytes)).toBe(true);
    expect(tokens.some((tok) => tok.tString)).toBe(true);
    const names = [
      ...FUNCS,
      "QCoreApplication.translate",
      "ungettext",
      "ngettext_lazy",
      "npgettext",
    ];
    const calls = findPythonI18nCalls(source, "app.py", names);
    expect(calls.some((call) => call.context === "menu")).toBe(true);
    expect(calls.some((call) => call.plurals)).toBe(true);
    expect(calls.some((call) => call.zeroDigit)).toBe(true);
    expect(calls.some((call) => call.unsafeKind === "modulo")).toBe(true);
    expect(calls.some((call) => call.unsafeKind === "format")).toBe(true);
    expect(extractPythonUiCalls(source, "app.py", names).some((call) => call.unsafe)).toBe(true);
  });

  it("requires a named count only for multi-name plural sources", () => {
    expect(pluralMultiPlaceholderMissingCount("{{user}} in {{folder}}")).toBe(true);
    expect(pluralMultiPlaceholderMissingCount("{{count}} in {{folder}}")).toBe(false);
    expect(pluralMultiPlaceholderMissingCount("%s files")).toBe(false);
    expect(pluralMultiPlaceholderMissingCount("{count} files")).toBe(false);
  });
});

describe("template, Qt, and pyproject extractors", () => {
  it("normalizes Jinja and Django translation blocks", () => {
    const jinja = [
      "{% trans count=n %}",
      "One item",
      "{% pluralize %}",
      "{{ count }} items",
      "{% endtrans %}",
      "{{ _('Save') }}",
    ].join("\n");
    const calls = extractTemplateI18nCalls(jinja, "index.html", ["_", "gettext"]);
    expect(calls[0]).toMatchObject({
      literal: "One item",
      pluralSource: "%(count)s items",
      plurals: true,
    });
    expect(calls.some((call) => call.literal === "Save")).toBe(true);

    const django = "{% blocktrans trimmed %}Hello {{ name }}{% endblocktrans %}";
    expect(extractTemplateI18nCalls(django, "page.html", ["_"])[0]?.literal).toBe("Hello %(name)s");
    const quoted = `{% trans "Save" context "menu" %}{{ ngettext("1 file", "{count} files", n) }}{{ pgettext("menu", "File") }}`;
    const extra = extractTemplateI18nCalls(quoted, "page.jinja", ["_", "ngettext", "pgettext"]);
    expect(extra.find((call) => call.literal === "Save")?.context).toBe("menu");
    expect(extra.find((call) => call.literal === "1 file")?.pluralSource).toBe("{count} files");
    expect(extra.find((call) => call.literal === "File")?.context).toBe("menu");
    const raw = "{# note #}{% raw %}{{ _('Hidden') }}{% endraw %}{% trans %}Keep{% endtrans %}";
    const kept = extractTemplateI18nCalls(raw, "page.j2", ["_"]);
    expect(kept.some((call) => call.literal === "Hidden")).toBe(false);
    expect(kept.some((call) => call.literal === "Keep")).toBe(true);
    expect(isTemplateI18nFile("page")).toBe(false);
    expect(isTemplateI18nFile("page.JINJA")).toBe(true);
    const extraBlocks = [
      "{% raw %}{{ _('Hidden2') }}{% endraw %}",
      "{% trans %}Hi there{% endtrans %}",
      "{% translate 'Quoted' %}",
      "{% trans noop 'Skip' context 'menu' %}",
      "{% trans %}",
      "{% endtrans %}",
      "{% blocktranslate trimmed %}Hello {{ name }}{% plural %}{{ count }} items{% endblocktranslate %}",
      "{{ ngettext('1 file', '{count} files', n) }}",
      "{{ pgettext('menu', 'File') }}",
      "{{ ngettext() }}",
      "{{ pgettext('only-context') }}",
      '{% trans "Say \\"hi\\"" %}',
      "{% %}",
      "{% unfinished",
      "{# unclosed comment",
    ].join("\n");
    const more = extractTemplateI18nCalls(extraBlocks, "forms\\page.txt", [
      "_",
      "ngettext",
      "pgettext",
    ]);
    expect(more.some((call) => call.literal === "Hi there")).toBe(true);
    expect(more.some((call) => call.literal === "Skip" && call.context === "menu")).toBe(true);
    expect(more.some((call) => call.literal === "Hello %(name)s")).toBe(true);
    expect(more.some((call) => call.literal === 'Say "hi"')).toBe(true);
    expect(more.some((call) => call.literal === "Hidden2")).toBe(false);
  });

  it("reads Qt strings and skips notr", () => {
    const xml = `<ui><string>Save</string><string notr="true">Skip</string><string comment="menu">File</string></ui>`;
    const calls = extractQtUiCalls(xml, "main.ui");
    expect(calls.map((call) => call.literal)).toEqual(["Save", "File"]);
    expect(calls[1]?.context).toBe("menu");
  });

  it("reads a basic pyproject description and rejects a non-string", () => {
    expect(readPyprojectDescription('[project]\ndescription = "Hello"\n')).toMatchObject({
      ok: true,
      value: { description: "Hello", table: "project" },
    });
    expect(readPyprojectDescription("[project]\ndescription = [\n]\n").ok).toBe(false);
    expect(
      readPyprojectDescription('[tool.poetry]\ndescription = """Hello\\nthere"""\n')
    ).toMatchObject({
      ok: true,
      value: { description: "Hello\nthere", table: "poetry" },
    });
    expect(readPyprojectDescription('[project]\ndescription = "Say \\"hi\\""\n')).toMatchObject({
      ok: true,
      value: { description: 'Say "hi"' },
    });
    expect(readPyprojectDescription('[project]\nname = "demo"\n').ok).toBe(false);
  });

  it("reads spaced tables, literal strings, comments, and the first description only", () => {
    expect(readPyprojectDescription('[  project  ]\ndescription="  Hello  "\n')).toMatchObject({
      ok: true,
      value: { description: "Hello", line: 2, table: "project" },
    });
    expect(
      readPyprojectDescription("[tool.poetry]\ndescription = 'Hello # there' # tail\n")
    ).toMatchObject({
      ok: true,
      value: { description: "Hello # there", line: 2, table: "poetry" },
    });
    expect(
      readPyprojectDescription('# comment\n[project]\ndescription = "Hello # world" # trailing\n')
    ).toMatchObject({
      ok: true,
      value: { description: "Hello # world", line: 3, table: "project" },
    });
    expect(
      readPyprojectDescription(
        '[project]\ndescription = "first"\n[tool.poetry]\ndescription = "second"\n'
      )
    ).toMatchObject({
      ok: true,
      value: { description: "first", table: "project" },
    });
    expect(readPyprojectDescription('[project]\r\ndescription = """Hello"""\r\n')).toMatchObject({
      ok: true,
      value: { description: "Hello", line: 2 },
    });
    expect(readPyprojectDescription("[project]\ndescription = '''Hello'''\n")).toMatchObject({
      ok: true,
      value: { description: "Hello", table: "project" },
    });
    expect(readPyprojectDescription('[project]\ndescription = ""\n')).toMatchObject({
      ok: true,
      value: { description: "" },
    });
  });

  it("decodes basic-string escapes and keeps single-quoted backslashes literal", () => {
    expect(
      readPyprojectDescription('[project]\ndescription = "a\\nb\\tc\\\\d\\q"\n')
    ).toMatchObject({
      ok: true,
      value: { description: "a\nb\tc\\dq" },
    });
    expect(readPyprojectDescription("[project]\ndescription = 'a\\\\nb'\n")).toMatchObject({
      ok: true,
      value: { description: "a\\\\nb" },
    });
  });

  it("joins a multiline triple-quoted description and trims the ends", () => {
    const content = ["[project]", 'description = """', "Hello", "there", '"""', ""].join("\n");
    expect(readPyprojectDescription(content)).toMatchObject({
      ok: true,
      value: { description: "Hello\nthere", line: 2, table: "project" },
    });
    expect(readPyprojectDescription('[project]\ndescription = """Hello\nthere"""\n')).toMatchObject(
      {
        ok: true,
        value: { description: "Hello\nthere", line: 2 },
      }
    );
  });

  it("ignores descriptions outside project and poetry and skips non-keys", () => {
    expect(
      readPyprojectDescription(
        '[build-system]\ndescription = "nope"\n[tool.poetry]\ndescription = "yes"\n'
      )
    ).toMatchObject({
      ok: true,
      value: { description: "yes", table: "poetry" },
    });
    expect(readPyprojectDescription('description = "nope"\n[project]\nname = "x"\n').ok).toBe(
      false
    );
    expect(
      readPyprojectDescription(
        '[project]\ndescription_file = "README.md"\ndescription\nname = "x"\n'
      ).ok
    ).toBe(false);
    expect(readPyprojectDescription("").ok).toBe(false);
  });

  it("reports unsupported descriptions with the source line", () => {
    expect(readPyprojectDescription("[project]\ndescription = 1\n")).toEqual({
      ok: false,
      reason: "unsupported",
      line: 2,
    });
    expect(readPyprojectDescription('[project]\ndescription = "unterminated\n')).toEqual({
      ok: false,
      reason: "unsupported",
      line: 2,
    });
    expect(readPyprojectDescription("[project]\ndescription = 'unterminated\n")).toEqual({
      ok: false,
      reason: "unsupported",
      line: 2,
    });
    expect(readPyprojectDescription('[project]\ndescription = """Hello\n')).toEqual({
      ok: false,
      reason: "unsupported",
      line: 2,
    });
    expect(readPyprojectDescription("[project]\ndescription = { a = 1 }\n")).toEqual({
      ok: false,
      reason: "unsupported",
      line: 2,
    });
  });
});
