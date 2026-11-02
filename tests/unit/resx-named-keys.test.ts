import { describe, expect, it } from "vitest";
import {
  findResxNamedKeyUsages,
  legacyNamedResxKeys,
  renderNamedKeySection,
  upsertNamedKeySection,
} from "../../src/extractors/resx-named-key-usages.js";

describe("named resx key suggestions", () => {
  it("maps a property to T() and leaves the call site unchanged", () => {
    const keys = legacyNamedResxKeys([
      { name: "LoginButton", value: "Sign in" },
      { name: "Sign in", value: "Sign in" },
      { name: "Icon", value: "AAAA", type: "System.Drawing.Bitmap" },
    ]);
    expect([...keys.entries()]).toEqual([["LoginButton", "Sign in"]]);
    const source = "button.Text = Resources.LoginButton;\n";
    const found = findResxNamedKeyUsages(source, "MainWindow.axaml.cs", keys);
    expect(found).toEqual([
      {
        file: "MainWindow.axaml.cs",
        line: 1,
        expression: "Resources.LoginButton",
        source: "Sign in",
        replacement: 'T("Sign in")',
      },
    ]);
    const section = renderNamedKeySection(found);
    expect(section).toContain('- MainWindow.axaml.cs:1 Resources.LoginButton → T("Sign in")');
    const report = upsertNamedKeySection("# migrate-dotnet-i18n\n\nNo unsafe calls.\n", section);
    expect(report).toContain("Resources.LoginButton");
    const again = upsertNamedKeySection(report, section);
    expect(again.split("Named resource keys").length).toBe(2);
  });
});
