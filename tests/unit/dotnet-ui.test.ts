import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { initConfigTemplates, parseI18nConfig } from "../../src/core/config.js";
import { gnuPluralRule } from "../../src/core/gettext-codec.js";
import {
  assertUIBatchPlaceholders,
  extractUiPlaceholderTokens,
  hasDotnetNamedPlaceholder,
} from "../../src/core/ui-placeholders.js";
import { isExcludedRelPath } from "../../src/cli/file-utils.js";
import { renderDotnetI18nHelper } from "../../src/cli/dotnet-init-scaffold.js";
import { UIStringExtractor } from "../../src/extractors/ui-string-extractor.js";
import { extractCSharpUiCalls } from "../../src/extractors/csharp-string-extractor.js";
import { extractXamlMarkupCalls } from "../../src/extractors/xaml-markup-extractor.js";
import { extractUiCallsFromFileContent } from "../../src/extractors/ui-string-babel.js";

const FUNCS = ["T", "Tn", "Tp", "N", "Tr", "Loc"];

describe("dotnet placeholder style", () => {
  it("treats percent text as literal and keeps composite items", () => {
    expect(extractUiPlaceholderTokens("10% and 20%", "dotnet")).toEqual([]);
    expect(extractUiPlaceholderTokens("10% e 20%", "dotnet")).toEqual([]);
    expect(extractUiPlaceholderTokens("Value {0,-10:C}", "dotnet")).toEqual(["{0,-10:C}"]);
    expect(extractUiPlaceholderTokens("Use {{ and }}", "dotnet")).toEqual(["{{", "}}"]);
    expect(extractUiPlaceholderTokens("Keep {{GLS_0}}", "dotnet")).toEqual(["{{GLS_0}}"]);
    expect(() =>
      assertUIBatchPlaceholders(["10% and 20%"], ["10% e 20%"], "", "dotnet")
    ).not.toThrow();
    expect(() => assertUIBatchPlaceholders(["10% and 20%"], ["10% e 20%"], "")).toThrow();
  });

  it("flags named format items", () => {
    expect(hasDotnetNamedPlaceholder("Hello {name}")).toBe(true);
    expect(hasDotnetNamedPlaceholder("Hello {0}")).toBe(false);
  });
});

describe("C# and XAML extraction", () => {
  const source = `
    class App {
      void Run(string path, int shown, string variable) {
        T("Sign in");
        I18n.T("Saved to {0}", path);
        Tn("1 sample", "{0} samples", shown);
        Tp("menu", "Open");
        N("Light");
        Loc["Show token"];
        T($"Saved to {path}");
        T("Last synced " + path);
        T(variable);
        T("Hello {shown}");
        T("Updated: ");
        T(@"line\\n");
        T("""Raw text""");
        // T("commented")
        var note = "don't";
      }
    }
  `;

  it("catalogs literals and reports unsafe calls", () => {
    const calls = extractCSharpUiCalls(source, "ViewModels/MainViewModel.cs", FUNCS);
    const catalog = calls.filter((call) => !call.skipCatalog).map((call) => call.literal);
    expect(catalog).toContain("Sign in");
    expect(catalog).toContain("Saved to {0}");
    expect(catalog).toContain("1 sample");
    expect(catalog).toContain("Open");
    expect(catalog).toContain("Light");
    expect(catalog).toContain("Show token");
    expect(catalog).toContain("Updated: ");
    expect(catalog).toContain("Raw text");
    expect(catalog).not.toContain("commented");
    expect(calls.find((call) => call.literal.includes("Saved to {path}"))?.unsafe).toBe(true);
    expect(calls.find((call) => call.literal.includes("Last synced"))?.unsafe).toBe(true);
    expect(calls.some((call) => call.nonLiteral)).toBe(true);
    expect(calls.find((call) => call.literal === "Hello {shown}")?.namedPlaceholders).toBe(true);
    expect(calls.find((call) => call.literal === "Updated: ")?.edgeWhitespace).toBe(true);
    const plural = calls.find((call) => call.plurals);
    expect(plural?.pluralSource).toBe("{0} samples");
    expect(calls.find((call) => call.literal === "Open")?.context).toBe("menu");
  });

  it("does not treat an apostrophe in Razor text as a character literal", () => {
    const razor = `<p>don't</p>\n@T("Export CSV")\n<!-- T("hidden") -->\n`;
    const calls = extractCSharpUiCalls(razor, "Views/Home.razor", FUNCS, { razor: true });
    expect(calls.map((call) => call.literal)).toEqual(["Export CSV"]);
  });

  it("extracts markup extension literals and skips bindings", () => {
    const axaml = `
      <TextBlock Text="{loc:Tr 'Sign in'}" />
      <TextBlock Text="{Binding Title}" />
      <TextBlock Text="{x:Static local:UsageChartRange.Day}" />
      <TabItem Header="{loc:Tr 'Startup &amp; Display'}" />
      <TextBlock Text="{loc:Tr 'Cursor {0}'}" />
      <TextBlock>Hello</TextBlock>
      <Button Content="{loc:Tr &quot;Don't&quot;}" />
    `;
    const calls = extractXamlMarkupCalls(axaml, "Views/MainWindow.axaml", FUNCS);
    expect(calls.map((call) => call.literal)).toEqual([
      "Sign in",
      "Startup & Display",
      "Cursor {0}",
      "Don't",
    ]);
  });

  it("routes .cs files away from Babel and skips catalog flags", () => {
    const calls = extractUiCallsFromFileContent('T("Sign in");', "Program.cs", FUNCS);
    expect(calls.map((call) => call.literal)).toEqual(["Sign in"]);
    const extractor = new UIStringExtractor({
      extensions: [".cs"],
      funcNames: FUNCS,
    });
    const segments = extractor.extract('T($"no");\nT("Yes");\n', "App.cs");
    expect(segments.map((segment) => segment.content)).toEqual(["Yes"]);
  });
});

describe("ui-dotnet scaffold", () => {
  it("parses the init template and stamps I18n.cs", () => {
    const raw = initConfigTemplates.uiDotnet();
    const parsed = parseI18nConfig({
      ...raw,
      provider: "openrouter",
      providers: { openrouter: { translationModels: ["test-model"] } },
    });
    expect(parsed.ui[0]?.uiExtractor?.placeholderStyle).toBe("dotnet");
    expect(parsed.ui[0]?.uiExtractor?.funcNames).toContain("Loc");
    const helper = renderDotnetI18nHelper({
      namespace: "CursorPace",
      sourceLocale: "en",
      locales: [
        { code: "en", nativeName: "English", englishName: "English" },
        { code: "de", nativeName: "Deutsch", englishName: "German" },
      ],
    });
    expect(helper).toContain("namespace CursorPace");
    expect(helper).toContain('new LocaleInfo("de", "Deutsch", "German")');
    expect(helper).toContain("ai-i18n-tools-i18n-cs:");
    expect(
      isExcludedRelPath("Tests/MainViewModelTests.cs", parsed.ui[0]?.uiExtractor?.exclude)
    ).toBe(true);
    expect(isExcludedRelPath("Views/TrExtension.cs", parsed.ui[0]?.uiExtractor?.exclude)).toBe(
      true
    );
    const resx = parseI18nConfig({
      ...initConfigTemplates.uiDotnetResx(),
      provider: "openrouter",
      providers: { openrouter: { translationModels: ["test-model"] } },
    });
    expect(isExcludedRelPath("Views/TrExtension.cs", resx.ui[0]?.uiExtractor?.exclude)).toBe(true);
  });

  it("matches the C# plural selector fixture to the GNU table", () => {
    const file = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../assets/dotnet/plural-parity.json"
    );
    const rows = JSON.parse(fs.readFileSync(file, "utf8")) as Array<{
      locale: string;
      n: number;
      form: string;
    }>;
    for (const row of rows) {
      const rule = gnuPluralRule(row.locale);
      expect(rule.cldrForms[rule.index(row.n)]).toBe(row.form);
    }
  });
});
