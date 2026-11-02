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

`StringFormat` on a binding is invisible. Use `T("Cursor {0}", value)` on the view model. An enum combo keeps the enum and returns `T("Light")` from its caption, then rebuilds the items on `LocaleChanged`. A tray item uses `Tp("tray", "Open")` and a stable command parameter. Match the parameter, not the header. A service stores the English error sentence. The display site maps known sentences through `T`. `T()` at the failure freezes that language. Linux `.desktop` `Name=` and `Comment=` stay in the source language. Duration tokens that are compared (`2d`, `7h 47m`) stay untranslated. Translate `T("now")` and `T("in {0}", duration)` at the display site. Move a leading or trailing space into the format string or the layout. `Tn` may correct a source sentence that was always plural (`1 samples`).

## Load

Embed `locales/*.json`. `SetLocale` walks parent cultures (`pt-BR` can load `pt.json`). `Configure` can set `OpenLocale`, `FlatDirectory`, `Strict`, and `Locales`. Every call replaces `Strict`, `FlatDirectory`, and `OpenLocale`. A null `Locales` array leaves the current list in place and does not restore `BuiltInLocales`. Open order is `OpenLocale`, otherwise `FlatDirectory` with no embedded fallback, otherwise embedded resources. A missing key returns the source string unless `Strict` is set. A bad translated format can throw. Set both cultures before `SetLocale`, which raises `LocaleChanged` immediately. Persist the locale code.

Before the first `T()`, search upward from `AppContext.BaseDirectory`, then from the current directory, at most 8 directories each, for `locales/ui-languages.json`. The first file wins. Map `code`, `label`, and `englishName` to `LocaleInfo` (`label` is `NativeName`) and pass that array as `Locales`, with `FlatDirectory` set to that `locales` directory in the same `Configure` call. If the file is missing, pass a one-element source-language list and do not set `FlatDirectory`. Do not show `BuiltInLocales`. Development then reads the catalogs `sync` just wrote, with no rebuild. A published build with no manifest nearby uses the embedded catalogs and shows the source language only. An installer that should follow `sync` ships `ui-languages.json` and the locale JSON next to the app.

Label the control `T("Language")`. On `LocaleChanged`, refresh view-model properties that call `T`. For Avalonia, WPF, and MAUI, `TrExtension` returns `I18n.T(Text)` and updates the target on `LocaleChanged`. Unsubscribe when the control leaves the visual tree. Keep Avalonia types out of `I18n.cs`. Add `**/TrExtension.cs` to `ui.uiExtractor.exclude`. Avalonia only: ignore `SelectionChanged` unless `e.Source` is the owning control. Do not assign `ItemsSource` or `SelectedItem` inside that handler, or inside a `LocaleChanged` that this combo's `SetLocale` raised. Post the refresh with `Dispatcher.UIThread.Post` and guard the handler while code sets `SelectedItem`. A parent `TabControl` that sets `ItemsSource` again from the bubbled event crashes the process (exit 139, empty `crash.log`). Set flow direction from `IsRightToLeft` when the framework has one. The JSON helper's locale and map are static. Do not use them as a per-user server locale.

`I18n` and the two cultures are process-global. xUnit runs test classes in parallel by default. When a test calls `SetLocale`, turn assembly parallelization off and restore `CurrentCulture`, `CurrentUICulture`, the locale, and the previous `Locales` array before it returns. One test sets a target locale and checks a caption, a shown validation message, and an unchanged stored value. Do not add a test that only checks the menu against `ui-languages.json` unless the user asks. Do not run `glossary-generate`. It only writes an empty CSV. The user fills `glossary-user.csv` before the first `translate-ui`. Follow that project's changelog and user-doc rules when visible behaviour changes. The full prompt is `docs/guide/add-i18n-to-dotnet.md`.

`extract` skips a file whose first bytes contain `ai-i18n-tools-i18n-cs:`.

`migrate-dotnet-i18n` rewrites `T($"...")`, `"a" + b`, and `string.Format` inside `T()` into `T("...{0}...", arg)`. It is a dry run until `--write`. `--wrap` audits unmarked XAML attributes and high-confidence C# sinks. Do not edit logs, attributes, `nameof`, comparisons, or `Path` calls. A second run is a no-op.

## resx

`init -t ui-dotnet-resx` writes `I18nResx.cs` and `ui.resx`. `translate-ui` emits `Resources/SharedResource.resx` and `SharedResource.<culture>.resx`. Keys are the source strings. Context uses U+2404. Plurals are `{singular}[{form}]`. Legacy `LoginButton` rows are ingested through the neutral value when `neutralFile` is set. Do not rewrite `Resources.LoginButton` call sites. `extract` lists those sites in `migrate-dotnet-i18n-report.md` as `Resources.LoginButton` → `T("Sign in")`. That section is a suggestion; the lines are not edited. Guide: `docs/guide/add-i18n-to-dotnet-resourcemanager.md`.

## What not to translate

Logs, JSON property names, file names, `nameof`, attribute arguments, and exception text that the operating system already localized.

Guide: `docs/guide/ui-strings/dotnet.md` and `docs/guide/add-i18n-to-dotnet.md` in the ai-i18n-tools repository.
