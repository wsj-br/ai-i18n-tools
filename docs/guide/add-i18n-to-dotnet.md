<a id="add-i18n-to-a-dotnet-app"></a>
# Add i18n to a .NET app

This page takes a .NET app (Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET, or a console tool) that has a single language and adds locales with ai-i18n-tools. It follows one path: the `ui-dotnet` template, a small `I18n.cs` helper, and JSON files of translations. `extract` records a UI string only when it is a string literal inside `T()`, `Tn`, `Tp`, `N`, or a XAML `{loc:Tr '…'}`, so a catalog of plain source text would be empty.

The quickest way is to give a coding agent the prompt on this page. It places the helper, embeds the locale JSON, wraps your strings, and can add a language switch. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account.

An app that already loads strings with `ResourceManager` or ASP.NET `IStringLocalizer` uses [Add i18n to a .NET ResourceManager app](/guide/add-i18n-to-dotnet-resourcemanager). That path keeps the loader and writes `.resx` satellites. Not sure which applies? See [Not your case?](#not-your-case) at the end.

The flow:

1. [Install the CLI and choose a provider](#install-and-choose-a-provider).
2. [Initialise the project](#initialise-the-project) with `init`.
3. [Run the agent prompt](#run-the-agent-prompt).
4. [Review the result](#review-the-result).
5. [Choose models and translate](#choose-models-and-translate), then check one language.
6. [Keep it translated](#keep-it-translated).

Prefer to make the changes yourself, or want to know what the prompt does? [Do it by hand](#do-it-by-hand) walks through the same steps one at a time.

<a id="install-and-choose-a-provider"></a>
## Install and choose a provider

You do this part, not the agent. The installer changes your machine, and the API key is a secret that belongs in your shell, not in a prompt.

Use the npm package when the machine already has Node.js `>=22.16.0` ([Installation](/guide/installation)). For a .NET project, install the standalone executable (no Node.js).

Linux and macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

The installer checks `SHA256SUMS.txt`, installs the command as `ai-i18n-tools`, and adds it to `PATH`. The binaries are not notarised or Authenticode-signed. Manual steps and asset names: [Standalone executables](/guide/installation#standalone-executables).

Check the install:

```bash
ai-i18n-tools --version
```

Then choose a provider and set its API key in the shell that will run the translation. For example, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama needs no key. Other presets: [Built-in providers](/guide/providers-and-models#built-in-providers). Note the provider name, because you pass it to `init` in the next step. The agent never needs the key: it only runs commands that make no model calls. You use the key later, when you [translate](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Initialise the project

You run this once, before the prompt. It writes the config and `I18n.cs`, and it uses the provider you chose above.

This page uses one template, `ui-dotnet`. It writes the config, the `I18n.cs` helper, and JSON catalogs. It fits these apps:

| Your app | Notes |
| --- | --- |
| Avalonia, WPF, MAUI | Labels in XAML need a markup extension. The helper does not reference those assemblies |
| WinForms | Rebuild visible text when the locale changes |
| Blazor and a single-user ASP.NET app | The helper's catalog is static, which is enough for one user at a time |
| A multi-user server | Keep `IStringLocalizer` or `ResourceManager`. Use the [ResourceManager page](/guide/add-i18n-to-dotnet-resourcemanager) |
| Console tools | A `--lang` option, not a widget |

Run init with the provider you chose (OpenRouter in this example):

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

Pass `--namespace` when the project namespace is not the one `init` prints into `I18n.cs`. With one `.csproj` in the directory and no `--namespace`, `init` uses that file's `RootNamespace`, or the project file name. Otherwise the namespace is `AiI18n`.

Then edit `sourceLocale` and `targetLocales` in `ai-i18n-tools.config.json`. `sourceLocale` is the language of the strings in the source. Any BCP-47 language is valid; the scaffold uses `en`. The same list is stamped into `I18n.cs` as `BuiltInLocales`, between the `ai-i18n-tools-locales` markers, and `SourceLocale` is a const. `SupportedLocales` reads that array. After you change the config, update the stamp or pass a new `Locales` array to `I18n.Configure`. Do not rerun `init` in the app to refresh the helper.

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made. If `I18n.cs` already contains the marker `ai-i18n-tools-i18n-cs`, the project is already initialised: skip this step. `init` does not overwrite an existing `I18n.cs`, and it does not edit the `.csproj`.

`init` sets `ui.sourceRoots` to `"."`, so `extract` would scan the whole repository. The prompt narrows it to your application code (by hand, that is [Step 1](#step-1-place-the-helper-and-embed-the-catalogs)). The scan already skips directories named `bin`, `obj`, `.vs`, `TestResults`, and `packages`, and the template excludes `**/Tests/**` and `**/*.Tests/**`.

Call shapes: [.NET applications](/guide/ui-strings/dotnet). Every other config key: [Configuration](/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If you want something left out, for example no language switch, say so in the same message.

The agent first checks that the CLI, the config, and `I18n.cs` exist, and stops with instructions if one is missing. Then it works in three parts:

- Part 1 puts `I18n.cs` and `locales/` where the project keeps its code, embeds the JSON, and points the config at them.
- Part 2 wraps the user-facing strings in `T()`, `Tn`, `Tp`, `N`, and `{loc:Tr '…'}`, then checks unsafe calls with `migrate-dotnet-i18n`.
- Part 3 adds a language switch, or a CLI language option.

It does not install or initialise anything, read your API key, or translate. Translation is the step after the review, and you run it.

````markdown
# Add languages to this .NET app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists with a `ui` block, and that an `I18n.cs`
containing `ai-i18n-tools-i18n-cs` exists. If any of them is missing, stop now
and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-dotnet -P <provider>`, then run this prompt again.
Pass `--namespace` when the printed namespace is wrong. Do not install or
initialise anything yourself. Do not overwrite an existing config or an
existing `I18n.cs`.

If the app already loads strings with `ResourceManager` or
`IStringLocalizer`, stop and tell the user to use the `ui-dotnet-resx`
template instead. Do not add `I18n.cs` beside that loader.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `I18n.cs`
  except `SourceLocale` and the `BuiltInLocales` array between the
  `ai-i18n-tools-locales` markers, and only when `sourceLocale` or
  `targetLocales` changed after init. Do not edit generated files
  (`strings.json`, per-locale JSON, `ui-languages.json`, `.resx`). Do not add
  another helper module.
- Do not introduce semantic keys (`LoginButton`, `nav.home`). The literal in
  `T("…")` is the source-language sentence and the catalog key.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and embed the catalogs

Skip this part when `I18n.cs` and `locales/` already sit with the code that
uses them, the config points at them, and the project embeds `locales/*.json`.

1. Move `I18n.cs` and `locales/` together into the application project. A
   single-project repo can leave them where `init` wrote them. `I18n.cs` loads
   embedded JSON by resource name. Do not edit paths inside it.
2. Add `<EmbeddedResource Include="locales/*.json" />` to that project's
   `.csproj`. The path is relative to the project file. Do not rewrite the
   rest of the project file. .NET Framework 4.8 also needs the
   `System.Text.Json` package before `I18n.cs` will compile.
3. In `ai-i18n-tools.config.json`, point `ui.stringsJson` and
   `ui.flatOutputDir` at the new `locales/`. Set `ui.sourceRoots` to the
   application project instead of `"."`.
4. Add `global using static <Namespace>.I18n;` in that project, or call
   `I18n.T` at each site. The namespace is the one already in `I18n.cs`.
5. `BuiltInLocales` inside `I18n.cs`, between the `ai-i18n-tools-locales`
   markers, is the list stamped at init. `SupportedLocales` reads it. If
   `sourceLocale` or `targetLocales` was edited after that, update
   `SourceLocale` and that array, or call `I18n.Configure` with a new
   `Locales` array. Do not rewrite the rest of the helper.
6. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `T("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text
that is already wrapped needs no change.

- Call shapes: `T("Sign in")`, `T("Saved to {0}", path)`,
  `Tn("1 sample", "{0} samples", count)`, `Tp("menu", "Open")`, `N("Light")`.
  `{0}` is the count in `Tn`. Extra arguments follow it (`{1}`, `{2}`).
  `Tp` is for one short word with two meanings (`Open` the window and `Open`
  the file). `N` returns its argument so a static field can hold a literal
  `extract` can see. Show it later with `T(label)`. `T(label)` is valid only
  when `label` comes from `N("literal")`.
- Placeholders are `{0}`, `{0,-10}`, `{0:C}`, and `{0,-10:C}`. `%` is ordinary
  text. Doubled braces (`{{` and `}}`) are literal braces and must be copied
  unchanged. `{name}` is an error: `extract` stops.
  `string.Format` throws on a named item.
- Look up first, then format. Never `T($"…")`, `T("a" + b)`, or
  `T(string.Format(…))`. The argument must be a string literal, so
  `T(variable)` is invisible apart from a warning.
- XAML and AXAML: `{loc:Tr 'Sign in'}`. The prefix does not matter. The type
  name must be `Tr`. `{Binding}`, `{DynamicResource}`, `{StaticResource}`,
  `{TemplateBinding}`, and `{x:Static}` stay as they are. Element content
  (`<TextBlock>Hello</TextBlock>`) is not extracted. Move it onto an attribute.
  A literal that contains an apostrophe uses `&quot;` so the XML attribute can
  stay in double quotes: `Content="{loc:Tr &quot;Don't&quot;}"`.
- Avalonia, WPF, and MAUI each have their own markup-extension base class. Add
  a `TrExtension` in the app. `ProvideValue` returns `I18n.T(Text)`. Do not
  reference those UI assemblies from `I18n.cs`.
- Wrap text a person sees: labels, titles, captions, messages, validation
  text that is shown, progress, accessibility names, dialogs. Also review
  returned labels, dictionaries, variable-backed captions, and XAML element
  content. Leave logs, JSON keys, file names, `nameof`, attribute arguments,
  comparisons, `Path` calls, and exception text that is not shown.
- A stored option keeps its source value. Translate the caption when the
  control is shown. Do not fill a static dictionary with `T(…)` at startup.
  `T()` at startup runs once and freezes.

```csharp
const string PresetLast12 = "Last 12 months";

string PresetCaption() => T("Last 12 months");
```

- Tray or menu items found by their header should use `Tp` and a stable tag,
  not the translated header.
- Text sent to a model stays in the source locale even when it is built from
  labels. Build that text before any user-locale `SetLocale`, or format it
  from the source strings. Do not change the static locale around asynchronous
  work. The catalog and the current locale are static. Setting
  `CurrentUICulture` does not give each request its own map. A multi-user
  server keeps `IStringLocalizer` or `ResourceManager`.

Work in passes: list string literals that are not passed to `T`, `Tn`, `Tp`,
or `N`, wrap the user-facing ones, then list again. Treat any bulk rewrite as
a draft and review its diff.

Then run `ai-i18n-tools extract`. Fix every warning. A literal that contains
`{name}` stops the run. Run `ai-i18n-tools migrate-dotnet-i18n` without
`--write` and read `migrate-dotnet-i18n-report.md`. It rewrites `T($"…")`,
concatenation, and `string.Format` inside `T` into `T("…{0}…", arg)`. Apply
`--write` only after reading the edits, run `extract` again, and repeat until
the dry run lists nothing you still need to fix. `--wrap` is an audit of
unmarked XAML label attributes and high-confidence C# sinks (`Text`, `Title`,
`Message`, `MessageBox.Show`). It does not edit logs, attributes, `nameof`,
comparisons, or `Path` calls. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

A phrase that looks like a plural (`{0} samples`) should be `Tn`, not `T`.
Lines the command leaves in place (`await`, a raw `$$"""` string, a `? :`
hole, `ref` or `out`, a concatenation with no literal) are fixed by hand.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app still gets this
part: `--lang <code>` (and `-L` when that name is free), not a widget. Do not
read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Goal: one chosen language applies to every `T()` in that process, and a screen
can remember the choice. Accept only codes from `I18n.SupportedLocales`
(`Code`, `NativeName`).

- Restore the saved locale at startup, before the first `T`. Set
  `CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture` to that
  culture, then call `I18n.SetLocale`. `SetLocale` raises `LocaleChanged`
  immediately, so the cultures have to be set first. `string.Format` uses the
  current UI culture, so `{0:C}` follows it.
- Add a control labelled `T("Language")` whose options come from
  `SupportedLocales`. On change, set both cultures, then call `SetLocale`, and
  persist the choice.
- Refresh visible text from `LocaleChanged`. View-model properties that call
  `T` raise `PropertyChanged` from that event. WinForms and other toolkits
  that copy text into controls rebuild those properties in the handler. A
  markup extension that returns a plain string updates the next time the view
  is built.
- When the framework has a flow direction, set it from
  `I18n.IsRightToLeft(code)`.
- Do not use this helper as a per-user selector in a multi-user server. Keep
  `IStringLocalizer` or `ResourceManager` for that case.

## Verify and report

The project's build and tests pass. `extract` writes a non-empty catalog of
the sentences you wrapped, with no warnings. With the source locale, the
output is unchanged. A missing key returns the source string unless `Strict`
is set. A bad format in a translation can throw `FormatException`. A dropped
`{0}` can omit the value. `string.Format` does not fall back to the source
template.

Report the files changed, each string you skipped with file, line, surface,
and reason, the same word used with different meanings, sentences built from
translated pieces, plurals left as one string, and any `T()` that runs at
startup. With a locale file present, one test sets a target locale and asserts
that a validation message and a caption change, while the stored option value
stays in the source language. If `dotnet` is not installed, say the runtime
check was skipped.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools translate-ui`, then
restart the app. Remind the user to fill `glossary-user.csv` before the first
translation.
````

<a id="review-the-result"></a>
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. Wrapped text should read the same as before, with no unrelated reformatting. `git diff --stat` shows how much changed. The helper placement, the `EmbeddedResource` item, the wrapped calls, and the language switch are the expected edits.
- Generated catalogs (`strings.json`, per-locale JSON, `ui-languages.json`) are untouched apart from what `extract` wrote. `I18n.cs` is untouched apart from a locale stamp you asked to refresh.
- `ai-i18n-tools extract` runs clean, and `strings.json` lists the sentences you expect. No warning remains, and no literal still contains `{name}`.
- The dry run of `migrate-dotnet-i18n` lists nothing that is left to fix. A clean report does not prove every sentence was wrapped. The skipped strings in the agent's report are the rest of that check.
- Your tests pass, and the app looks the same in the source language.
- No throwaway script or `migrate-dotnet-i18n-report.md` was left behind.
- `SourceLocale` in `I18n.cs` equals `sourceLocale` in the config, character for character. `BuiltInLocales` lists the same languages as the config.

Strings the agent missed show up as text that stays in the source language later.

<a id="choose-models-and-translate"></a>
## Choose models and translate

You run this part. It uses your API key and spends money on your account.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab of `ai-i18n-tools dashboard`.

Fill the glossary before the first `translate-ui`. `init` points `glossary.userGlossary` at `glossary-user.csv` and does not create the file. If the file is missing, run `ai-i18n-tools glossary-generate`, then add domain terms. Use **Force** for names that must be copied unchanged. A second `translate-ui` of an unchanged string can come back worded differently. The glossary is what makes the two runs agree.

Then extract and translate:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract` writes `strings.json` and `ui-languages.json`. `translate-ui` writes one JSON file per target language under `ui.flatOutputDir`. Leave those generated files unedited. `sync` runs `extract` and `translate-ui` together when `features.translateUIStrings` is on.

`T()` looks up the source sentence in the locale JSON. The id in `strings.json` is not the lookup key. A missing file or a missing key returns the source sentence, unless `I18n.Strict` is set. `string.Format` then runs on the translated template. An invalid format can throw `FormatException`. A dropped `{0}` can omit the argument. There is no fallback to the source template after a format error.

<a id="check-one-language"></a>
### Check one language

Restart the app, switch to one target language, and open a screen with a few wrapped strings. Use the language switch the agent added, or set both cultures and call `I18n.SetLocale` yourself. Text that is still in the source language was not wrapped, was copied into a control before `SetLocale`, or has no entry in the locale JSON. Check the JSON for the sentence before you suspect the code.

`SetLocale` walks `CultureInfo.Parent` until a catalog opens (`pt-BR` can load `pt.json`). Embedded resources are used when neither `OpenLocale` nor `FlatDirectory` is set. A configured `FlatDirectory` does not fall through to embedded JSON when a file is missing.

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` (or `extract` then `translate-ui`) after changing source text. The cache means only new or changed strings go to the model. Run it in CI so translations do not drift. Rebuild or restart the app after a translation run so the embedded JSON is picked up. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

To refresh a copied `I18n.cs`, scaffold the same template in a disposable directory and copy only the generated file you intend to replace. Do not rerun `init` in the app to upgrade the helper.

To translate `README.md` in the same run, scaffold with `--with-readme` (or add the block to an existing config). See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. Each step matches a part of the prompt. You still [install the CLI](#install-and-choose-a-provider), [initialise the project](#initialise-the-project), and [translate](#choose-models-and-translate) at the end.

1. [Place the helper and embed the catalogs](#step-1-place-the-helper-and-embed-the-catalogs).
2. [Wrap strings](#step-2-wrap-strings) in `T()`, `Tn`, `Tp`, `N`, or `{loc:Tr '…'}`.
3. [Check wrapped calls](#step-3-check-wrapped-calls) with `migrate-dotnet-i18n`.
4. [Add a language switch](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## Step 1: Place the helper and embed the catalogs

`init` writes these at the repository root:

| File | What it is | Edit it? |
| --- | --- | --- |
| `I18n.cs` | The helper your code calls (`T`, `Tn`, `Tp`, `SetLocale`) | No. It is generated. `init` will not overwrite it |
| `locales/strings.json` | The extraction cache. The app never reads it | No. `extract` writes it |
| `locales/<code>.json` | The translations the app loads, one file per language | No. `translate-ui` writes them |
| `locales/ui-languages.json` | The language list for the tool. The helper uses `BuiltInLocales` in `I18n.cs` | No. `extract` writes it |

Move `I18n.cs` and `locales/` into the application project. Add the embed to that `.csproj` and leave the rest of the file alone:

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

The include path is relative to the project file. .NET Framework 4.8 also needs the `System.Text.Json` package. .NET 6 or newer already has it.

Update the config to the new place, and point `sourceRoots` at the application project so tests and build output stay out of the catalog:

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

Add `global using static MyApp.I18n;` (use the namespace printed in `I18n.cs`), or call `I18n.T` at each site.

`SourceLocale` in the helper must equal `sourceLocale` in the config. `BuiltInLocales`, between the `ai-i18n-tools-locales` markers, is the list `init` stamped. `SupportedLocales` reads it. After you change `targetLocales`, update that array or pass a new `Locales` array to `I18n.Configure`. Scaffold a disposable directory when you need a fresh helper. Do not rerun `init` here.

Confirm with `ai-i18n-tools extract`. The catalog should appear in the new `locales/` folder. Expect 0 strings until something is wrapped.

<a id="step-2-wrap-strings"></a>
## Step 2: Wrap strings

`extract` records a string only when it is a literal passed to `T()`, `Tn`, `Tp`, `N`, or `{loc:Tr '…'}`. A receiver such as `I18n.T` matches because the last name is `T`.

Look up the catalog entry first, then pass the result to `string.Format`:

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

These are extracted and then rejected, because the catalog would not match what the program looks up:

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract` prints a warning for the first three and stops on `{name}`. The [next step](#step-3-check-wrapped-calls) rewrites the first three.

Placeholders stay in .NET form: `{0}`, `{0,-10}`, `{0:C}`. `%` is ordinary text, so a translation such as `10% off` is not a printf token. Doubled braces (<code v-pre>{{</code> and `}}`) are literal braces and must be copied unchanged. More call shapes: [Calls that translate](/guide/ui-strings/dotnet#calls-that-translate).

XAML and AXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

The prefix is ignored. `{Binding}` and `{StaticResource}` are left alone. Text written as element content is not extracted. A literal that contains an apostrophe is written with `&quot;` so the attribute can stay in double quotes.

Avalonia, WPF, and MAUI each supply their own `MarkupExtension` base class. One shape, in the application project:

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

Formatted sentences stay in C# (`T("Saved to {0}", path)`), which keeps the extractor on a single literal. The same call works from a view model, a tray tooltip, and a dialog.

A value that is both stored and shown keeps the stored value in the source language. Translate the caption when the control is built. `N("Last 12 months")` exists so a static field can hold a literal the extractor sees. `T()` in a static dictionary runs once, on the first type load, and stays on that language.

Leave these alone: logs, JSON property names, file names, `nameof`, attribute arguments, object keys used as identifiers, and exception text the program matches rather than shows.

Run `ai-i18n-tools extract` again. The catalog should now list the sentences you wrapped.

<a id="step-3-check-wrapped-calls"></a>
## Step 3: Check wrapped calls

Use this step when a call formats the string before the catalog lookup:

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n` rewrites those into a lookup that happens first. A second run changes nothing.

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

The command is a dry run until you pass `--write`. It writes `migrate-dotnet-i18n-report.md`. Read that report. When the edits look right:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Run the dry run again. Stop when it lists no edits, then run the project's tests. Lines left in place (`await`, a raw interpolated raw string, a conditional hole, `ref` or `out`, a concatenation with no literal, an `IFormatProvider` passed to `string.Format`) are fixed by hand. A phrase that looks like a plural belongs in `Tn`. Generated `I18n.cs` is skipped. Delete the report or git-ignore it.

`--wrap` also marks unmarked XAML `Text`, `Header`, `Content`, and the other label attributes as `{loc:Tr '…'}`, plus C# assignments whose name ends in `Text`, `Title`, or `Message`, and `MessageBox.Show`. Without `--write` that is an audit. It does not edit logs, attributes, `nameof`, comparisons, or `Path` calls.

A report with no edits means the wrapped calls are safe. It does not mean every user-facing sentence was wrapped. Bare labels, returned strings, and element content are invisible to it. Details: [Rewrite unsafe calls](/guide/ui-strings/dotnet#migrate).

<a id="step-4-add-a-language-switch"></a>
## Step 4: Add a language switch

Set the cultures before `SetLocale`, because `LocaleChanged` fires inside that call:

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

Build the options from `I18n.SupportedLocales`. Each row has `Code`, `NativeName`, and `EnglishName`. Label the control with `T("Language")`. Persist the choice and restore it at startup, before the first `T`. On `LocaleChanged`, raise `PropertyChanged` for view-model strings, or rebuild controls that copied their text. When the framework has a flow direction, set it from `I18n.IsRightToLeft(code)`.

A console program has no widget. Add `--lang <code>` (and `-L` when that name is free). Accept only codes listed in `SupportedLocales`. Do not read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Skip this step when the program shows no text a person reads.

The catalog and the current locale are static. That is safe for a desktop process. It is not a per-request locale for a multi-user server. Keep `IStringLocalizer` or `ResourceManager` there, and follow [Add i18n to a .NET ResourceManager app](/guide/add-i18n-to-dotnet-resourcemanager). Setting `CurrentUICulture` does not give each request its own map.

That is the last manual step. Continue at [Choose models and translate](#choose-models-and-translate).

<a id="not-your-case"></a>
## Not your case?

| Your code today | Read |
| --- | --- |
| `ResourceManager`, `.resx` satellites, or ASP.NET `IStringLocalizer` | [Add i18n to a .NET ResourceManager app](/guide/add-i18n-to-dotnet-resourcemanager) |
| Already `T("…")` with the source-language sentence | [UI strings](/guide/ui-strings/) steps 2–3, and [.NET applications](/guide/ui-strings/dotnet) |
| A JS/TS app | [Add i18n to a JS/TS app](/guide/add-i18n-to-js) |
| A Python app | [Add i18n to a Python app](/guide/add-i18n-to-python) |
| Django, Flask-Babel catalogs, or GNU gettext | [Add i18n to a Django / Python gettext app](/guide/add-i18n-to-django-gettext) |
| A website or docs site | [Add i18n to a website or docs site](/guide/add-i18n-to-website) |
| A repository README or other Markdown files | [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Examples

| Example | What it shows |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | xUnit checks of `I18n.cs`: embedded JSON, culture fallback, `{0}`, plurals |

These directories check the helper. They are not apps to translate, and they do not need an API key. `dotnet test` in that directory runs the checks. A real app starts from `init` on this page.
