---
name: ai-i18n-dotnet
description: Add or maintain the I18n.cs helper and flat JSON catalogs for a .NET app.
disable-model-invocation: true
---

# .NET helper

Follow the installed `ai-i18n-tools` skill for inspection, credentials, `sync`, and generated-output rules. From that skill, read `references/dotnet.md`.

## Configure

- New config: `ai-i18n-tools init -t ui-dotnet -P <provider>`. An app that already uses `ResourceManager` or `IStringLocalizer` uses `init -t ui-dotnet-resx` instead. Do not rerun `init` over an existing config or an existing `I18n.cs` / `I18nResx.cs`.
- For `ui-dotnet`, add `<EmbeddedResource Include="locales/*.json" />` to the `.csproj`. Do not rewrite the rest of the project file.
- Call `T("Saved to {0}", path)` with a string literal. Format after lookup. Do not use `T($"…")`, an arbitrary `T(variable)`, or `{name}` placeholders. `T(label)` is for an `N("literal")` label. `migrate-dotnet-i18n` rewrites unsafe `$"…"` and concatenation. It is a dry run until `--write`. `--wrap` audits unmarked XAML and high-confidence C# sinks. A clean report is not coverage.
- Use `Tn` for plurals, `Tp` for short ambiguous words, and `N("…")` for static labels displayed later with `T`.
- In XAML, use `{loc:Tr '…'}`. Leave bindings and resource references alone. `{loc:Tr}` can only call `T`. `TrExtension` returns `I18n.T(Text)` and updates the open view on `LocaleChanged`. Add `**/TrExtension.cs` to `ui.uiExtractor.exclude`. Do not put Avalonia types in `I18n.cs`.
- A UI a person reads loads the language menu from `locales/ui-languages.json` before the first `T()` (search up from `AppContext.BaseDirectory`, then the current directory, at most 8 levels). One `I18n.Configure` sets `Locales` and `FlatDirectory` together. `Configure` replaces `Strict`, `FlatDirectory`, and `OpenLocale` on every call. If the file is missing, the menu is the source language only. Do not show `BuiltInLocales`. Persist the locale code. Set both cultures, then `SetLocale`. Avalonia: do not assign combo `ItemsSource` or `SelectedItem` inside `SelectionChanged` or inside the `LocaleChanged` that combo raised. Post the refresh. A console app gets `--lang` (and `-L` when free) instead and does not read `AI_I18N_LANG`.
- `I18n` is process-global. A test that calls `SetLocale` turns off xUnit assembly parallelization and restores cultures, the locale, and the previous `Locales` array. Do not run `glossary-generate`.
- Named resx keys such as `Resources.LoginButton` are listed in `migrate-dotnet-i18n-report.md` after `extract`. Apply those suggestions by hand. The tool does not edit them.

## Verify

- Run `ai-i18n-tools extract` and clear every warning before `translate-ui`.
- Run `ai-i18n-tools sync` only when translation is authorized.
- Check one target locale in the built app, including a string with `{0}`, a shown validation message, a stored value that stays unchanged, and a missing key (it must fall back to the source text). Set cultures before `SetLocale`. If `dotnet` is not installed, report the runtime check as skipped.
