# .NET

Source-string catalogs for C#, Razor, XAML, and AXAML. The helper is a single file, `I18n.cs`, copied by `init -t ui-dotnet`. It targets .NET 6 or newer and uses inbox `System.Text.Json`. There is no NuGet package.

## Calls

- `T("Sign in")`, `T("Saved to {0}", path)` — lookup, then `string.Format`.
- `Tn("1 sample", "{0} samples", count)` — plural. `{0}` is the count.
- `Tp("menu", "Open")` — context plus source. The flat JSON key joins them with U+0004.
- `N("Light")` — extracted, not looked up. Display with `T(label)`.
- `I18n.Loc["Show token"]` — indexer for code that already uses a localizer shape. `Loc` is a static field, not a static class.
- `{loc:Tr 'Sign in'}` in `.xaml` and `.axaml`. The prefix does not matter. The type name must be in `funcNames` (default includes `Tr`).

Do not catalog `$"..."`, concatenation, `string.Format(...)` passed into `T`, or an arbitrary `T(variable)`. `T(label)` is valid when `label` is an `N("literal")` result. `extract` warns. `{name}` fails extraction. `placeholderStyle` is `dotnet`: `%` is literal, `{{` and `}}` are literal braces, and `{0}`, `{0,-10}`, `{0:C}` are preserved. A clean extract or migrate report is not coverage. Also review returned labels, shown validation text, progress, dictionaries, and XAML element content. Do not store `T(...)` results in a static dictionary.

## Load

Embed `locales/*.json`. `SetLocale` walks parent cultures (`pt-BR` can load `pt.json`). `Configure` can set `OpenLocale`, `FlatDirectory`, `Strict`, and `Locales`. Open order is `OpenLocale`, otherwise `FlatDirectory` with no embedded fallback, otherwise embedded resources. A missing key returns the source string unless `Strict` is set. A bad translated format can throw. Set `CurrentUICulture` before `SetLocale`, which raises `LocaleChanged` immediately. The JSON helper's locale and map are static. Do not use them as a per-user server locale. A UI a person reads gets a selector from `SupportedLocales` (`Code`, `NativeName`), labelled `T("Language")`: set both cultures, then `SetLocale`, persist the choice and restore it before the first `T`, and set flow direction from `IsRightToLeft` when the framework has one; a console app gets `--lang` (and `-L` when free) instead and does not read `AI_I18N_LANG`, and the control is skipped only when the program shows no text a person reads.

`extract` skips a file whose first bytes contain `ai-i18n-tools-i18n-cs:`.

`migrate-dotnet-i18n` rewrites `T($"...")`, `"a" + b`, and `string.Format` inside `T()` into `T("...{0}...", arg)`. It is a dry run until `--write`. `--wrap` audits unmarked XAML attributes and high-confidence C# sinks. Do not edit logs, attributes, `nameof`, comparisons, or `Path` calls. A second run is a no-op.

## resx

`init -t ui-dotnet-resx` writes `I18nResx.cs` and `ui.resx`. `translate-ui` emits `Resources/SharedResource.resx` and `SharedResource.<culture>.resx`. Keys are the source strings. Context uses U+2404. Plurals are `{singular}[{form}]`. Legacy `LoginButton` rows are ingested through the neutral value when `neutralFile` is set. Do not rewrite `Resources.LoginButton` call sites. `extract` lists those sites in `migrate-dotnet-i18n-report.md` as `Resources.LoginButton` → `T("Sign in")`. That section is a suggestion; the lines are not edited. Guide: `docs/guide/add-i18n-to-dotnet-resourcemanager.md`.

## What not to translate

Logs, JSON property names, file names, `nameof`, attribute arguments, and exception text that the operating system already localized.

Guide: `docs/guide/ui-strings/dotnet.md` and `docs/guide/add-i18n-to-dotnet.md` in the ai-i18n-tools repository.
