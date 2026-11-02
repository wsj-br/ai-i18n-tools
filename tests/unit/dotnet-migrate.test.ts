import { describe, expect, it } from "vitest";
import { migrateDotnetSource } from "../../src/extractors/csharp-migrate.js";

const FUNCS = ["T", "Tn", "Tp", "N", "Tr", "Loc"];

function once(source: string, wrap = false) {
  return migrateDotnetSource(source, FUNCS, "ViewModels/MainViewModel.cs", { wrap });
}

describe("migrate-dotnet-i18n rewrites", () => {
  it("numbers interpolation holes and reuses a repeated simple expression", () => {
    const source = 'T($"Expected usage reaches {shown} then, if this reading stays at {shown}.");';
    const result = once(source);
    expect(result.content).toBe(
      'T("Expected usage reaches {0} then, if this reading stays at {0}.", shown);'
    );
  });

  it("gives a cast its own index and keeps a later simple hole", () => {
    const source = 'T($"The sync server returned {(int)status} for {operation}.");';
    const result = once(source);
    expect(result.content).toBe(
      'T("The sync server returned {0} for {1}.", (int)status, operation);'
    );
  });

  it("rewrites a saved-path interpolation and a concatenation", () => {
    const source = ['T($"Saved to {path}");', 'T("Last synced " + date);'].join("\n");
    const result = once(source);
    expect(result.content).toBe(
      ['T("Saved to {0}", path);', 'T("Last synced {0}", date);'].join("\n")
    );
  });

  it("unwraps string.Format and leaves an IFormatProvider overload", () => {
    const source = [
      'T(string.Format("Hello {0}", name));',
      'T(string.Format(CultureInfo.InvariantCulture, "Hello {0}", name));',
    ].join("\n");
    const result = once(source);
    expect(result.content).toContain('T("Hello {0}", name);');
    expect(result.content).toContain("CultureInfo.InvariantCulture");
    expect(result.reviews.some((note) => note.message.includes("IFormatProvider"))).toBe(true);
  });

  it("does not rewrite plural-looking text, await, raw strings, ternaries, ref, or expression-only concat", () => {
    const source = [
      'T($" · {canonical.Samples.Count} samples");',
      'T($"Wait {await next}");',
      'T($$"""raw""");',
      'T($"Pick {flag ? one : other}");',
      'T($"See {ref value}");',
      "T(left + right);",
    ].join("\n");
    const result = once(source);
    expect(result.edits).toEqual([]);
    expect(result.content).toBe(source);
    expect(result.reviews.length).toBeGreaterThanOrEqual(5);
    expect(result.reviews.some((note) => note.message.includes("Tn"))).toBe(true);
  });

  it("is a no-op on the second run", () => {
    const source = 'T($"Saved to {path}");';
    const first = once(source);
    const second = migrateDotnetSource(first.content, FUNCS, "ViewModels/MainViewModel.cs");
    expect(second.edits).toEqual([]);
    expect(second.content).toBe(first.content);
  });
});

describe("migrate-dotnet-i18n --wrap", () => {
  it("wraps an AXAML label and reports StringFormat", () => {
    const source = [
      '<TextBlock Text="Cycle start" />',
      '<TextBlock Text="{Binding Title}" />',
      '<TextBlock Text="1D" />',
      "<TextBlock Text=\"{Binding LastMeasureCursorText, StringFormat='Cursor {0}'}\" />",
    ].join("\n");
    const result = migrateDotnetSource(source, FUNCS, "Views/MainWindow.axaml", { wrap: true });
    expect(result.content).toContain("Text=\"{loc:Tr 'Cycle start'}\"");
    expect(result.content).toContain('Text="{Binding Title}"');
    expect(result.content).toContain('Text="1D"');
    expect(result.reviews.some((note) => note.message.includes("StringFormat"))).toBe(true);
    const again = migrateDotnetSource(result.content, FUNCS, "Views/MainWindow.axaml", {
      wrap: true,
    });
    expect(again.edits).toEqual([]);
  });

  it("wraps a high-confidence assignment and dialog, and does not touch logs, attributes, nameof, comparisons, or paths", () => {
    const source = [
      'Title = "Hello";',
      'MessageBox.Show("Saved");',
      'Log.Information("hello");',
      '[JsonPropertyName("themeMode")]',
      'nameof("Open");',
      'if (header == "Open") {}',
      'Path.Combine("a", "b");',
    ].join("\n");
    const result = once(source, true);
    expect(result.content).toContain('Title = T("Hello");');
    expect(result.content).toContain('MessageBox.Show(T("Saved"));');
    expect(result.content).toContain('Log.Information("hello");');
    expect(result.content).toContain('[JsonPropertyName("themeMode")]');
    expect(result.content).toContain('nameof("Open");');
    expect(result.content).toContain('header == "Open"');
    expect(result.content).toContain('Path.Combine("a", "b");');
    const reasons = result.candidates.map((note) => note.message);
    expect(reasons.some((message) => message.startsWith("log"))).toBe(true);
    expect(reasons.some((message) => message.startsWith("attribute"))).toBe(true);
    expect(reasons.some((message) => message.startsWith("nameof"))).toBe(true);
    expect(reasons.some((message) => message.startsWith("comparison"))).toBe(true);
    expect(reasons.some((message) => message.startsWith("path"))).toBe(true);
  });
});
