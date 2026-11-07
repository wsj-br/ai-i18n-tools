<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# Add i18n to a .NET ResourceManager app

This page is for a .NET application that already loads strings with `ResourceManager` or ASP.NET `IStringLocalizer`, or one that will. You keep that loader. ai-i18n-tools reads `T("…")` and `{loc:Tr '…'}`, translates the messages, and writes `.resx` satellites whose keys are those source strings. The helper is `I18nResx.cs`, copied by `init -t ui-dotnet-resx`.

The quickest way is to give a coding agent the prompt on this page. It points the config at your resources, wraps your strings, checks the result, and can add a language switch. You install the CLI, choose the provider, and initialise the project yourself, because that needs your API key and your choices. You also run the translation yourself, because it spends money on your account and rewrites your `.resx` files.

A new Avalonia, WPF, MAUI, WinForms, or console app with no resource files yet uses [Add i18n to a .NET app](/guide/add-i18n-to-dotnet). That path adds `I18n.cs` and embedded JSON. Not sure which applies? See [Not your case?](#not-your-case) at the end.

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

You run this once, before the prompt. It writes the config and `I18nResx.cs`, and it uses the provider you chose above.

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

Pass `--namespace` when the project namespace is not the one `init` prints into `I18nResx.cs`. With one `.csproj` in the directory and no `--namespace`, `init` uses that file's `RootNamespace`, or the project file name. Otherwise the namespace is `AiI18n`.

The template sets `ui.flatOutput` to false and `ui.resx` to:

| Field | Default |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true, so `SharedResource.resx` holds the source text |
| `localeFormat` | `bcp47`, so the German file is `SharedResource.de.resx` and Brazilian Portuguese is `SharedResource.pt-BR.resx` |
| `ingestExistingResx` | true |

`init` writes `I18nResx.cs` when that file is missing. `ResourceBaseName` is the namespace, the output folder, and the base name joined with dots (`MyApp.Resources.SharedResource`). The SDK embeds a resx under that manifest name when the file sits in that folder. If you move the files, change `ResourceBaseName` to match. `init` does not edit the `.csproj`. Satellite assemblies are produced from `*.{culture}.resx` on build. Deploy those satellites next to the app.

Run `init` once. It rewrites `ai-i18n-tools.config.json` every time, so a second run drops edits you have made. If `I18nResx.cs` already contains the marker `ai-i18n-tools-i18n-cs`, the project is already initialised: skip this step. `init` does not overwrite an existing helper.

Then edit `sourceLocale` and `targetLocales`. `sourceLocale` is the language of the strings in the source. Any BCP-47 language is valid; the scaffold uses `en`. Point `ui.resx` at the folder and base name your app already loads (by hand, that is [Step 1](#step-1-point-the-config-at-your-resources)). `neutralFile` is the neutral resx that maps a legacy name such as `LoginButton` to its source text. When it is omitted, `{outputDir}/{baseName}.resx` is used when that file exists.

The same `ui` block can also write flat JSON. Set `flatOutput` back to true. Both outputs share one catalog. This template leaves `flatOutput` false so only `.resx` is written.

Call shapes and the JSON helper: [.NET applications](/guide/ui-strings/dotnet). Every other config key: [Configuration](/reference/configuration).

<a id="run-the-agent-prompt"></a>
## Run the agent prompt

Open the project in your coding agent (Cursor, Claude Code, Copilot, or similar), start a new chat, and paste the prompt below. The project must already be initialised. There is nothing to edit. If you want something left out, for example no language switch, say so in the same message.

The agent first checks that the CLI, the config, and `I18nResx.cs` exist, and stops with instructions if one is missing. Then it works in three parts:

- Part 1 points `ui.resx` at the catalogs the app already loads, and checks `ResourceBaseName`.
- Part 2 wraps user-facing strings in `T()` and `{loc:Tr '…'}`, and applies named-key suggestions by hand.
- Part 3 adds a language switch that stays on `ResourceManager` or `IStringLocalizer`.

It does not install or initialise anything, read your API key, or translate. It does not rewrite `.resx` files. Translation is the step after the review, and you run it.

````markdown
# Add languages to this .NET ResourceManager app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists with a `ui.resx` block, and that an
`I18nResx.cs` containing `ai-i18n-tools-i18n-cs` exists. If any of them is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-dotnet-resx -P <provider>`, then run this prompt
again. Do not install or initialise anything yourself. Do not overwrite an
existing config or an existing `I18nResx.cs`.

An app with no `.resx` and no `IStringLocalizer` belongs on the `ui-dotnet`
template (`I18n.cs` and embedded JSON). Stop and say so. Do not add both
helpers unless the user asked for both outputs.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- `init` already adds `.gitignore` patterns for the default `cacheDir`
  `.translation-cache`: `.translation-cache/*`, `!.translation-cache/cache.db`,
  `benchmark-scores.json`, `.env`, `.env.local`, `.env.*.local`, `*.tmp`, and
  `*.backup.*`. Do not replace those lines. Do not ignore the cache directory
  itself (`<cacheDir>/` drops `cache.db`). If `cacheDir` is not
  `.translation-cache`, the two cache lines must use that directory
  (`<cacheDir>/*` and `!<cacheDir>/cache.db`). If `doctor` reports a missing
  pattern, run `ai-i18n-tools doctor --fix-gitignore`. That appends a blank
  line, `# ai-i18n-tools doctor fix`, and only the missing lines. Keep the
  negation so `cache.db` stays tracked.
- Do not run `translate-ui`, `suggest-models`, or `sync`. They call the
  translation API, cost money, and `translate-ui` rewrites the `.resx` files.
  The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.resx`,
  `strings.json`, or per-locale JSON. Do not edit `I18nResx.cs` except
  `ResourceBaseName` when the files move.
- Do not introduce new semantic keys. The literal in `T("…")` is the source
  sentence and the resx name. Existing names such as `LoginButton` are
  migrated by hand from the report. Do not let the tool rewrite those lines.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Point the config at your resources

Skip a piece of this part when it is already done.

1. Make `ui.resx.outputDir` and `ui.resx.baseName` match the folder and the
   file stem the app already loads. `localeFormat` stays `bcp47` unless the
   satellites use `pt_BR` names, in which case set `posix`.
2. Set `neutralFile` when the neutral resx is not `{outputDir}/{baseName}.resx`.
   Leave `ingestExistingResx` and `writeNeutral` on so `extract` keeps
   translations that are already in the satellites and `ResourceManager` can
   fall back to the source text.
3. `ResourceBaseName` in `I18nResx.cs` is the namespace, the output folder, and
   the base name joined with dots. The SDK embeds a resx under that manifest
   name when the file sits in that folder. Change the constant when you move
   the files. Change nothing else in the helper.
4. Set `ui.sourceRoots` to the application project instead of `"."`. Point
   `ui.stringsJson` and `ui.flatOutputDir` at the resources folder.
5. Add `global using static <Namespace>.I18nResx;` or call `I18nResx.T` at
   each site. The namespace is the one already in `I18nResx.cs`.
6. `init` does not edit the `.csproj`. Satellite assemblies come from
   `*.{culture}.resx` on build. Do not add an `EmbeddedResource` item for
   JSON unless the user also turned `flatOutput` on.

## Part 2 — Wrap strings

Keep the loader. The new calls use the source sentence as the key. With the
source locale active, the app must behave exactly as before.

- Call shapes: `T("Sign in")`, `T("Saved to {0}", path)`,
  `Tn("1 sample", "{0} samples", count)`, `Tp("menu", "Open")`, `N("Light")`.
  Placeholders are `{0}`, `{0,-10}`, and `{0:C}`. `{name}` stops `extract`.
  Look up first. Never `T($"…")`, `T("a" + b)`, or `T(string.Format(…))`.
- XAML and AXAML: `{loc:Tr 'Sign in'}`. Leave `{Binding}` and
  `{StaticResource}` alone. Element content is not extracted. A literal that
  contains an apostrophe uses `&quot;`.
- `IStringLocalizer` already treats the name you pass as the key and returns
  that name when the resource is missing. `extract` records `T`, `Tn`, `Tp`,
  `N`, `Tr`, and `Loc`. A field named `_localizer` is invisible until that
  name is added to `ui.uiExtractor.funcNames`. Prefer `T("Sign in")` or
  `I18nResx.T("Sign in")` so the default names match.
- Do not rewrite `Resources.LoginButton` yourself in bulk. After `extract`,
  `migrate-dotnet-i18n-report.md` lists those sites as suggestions, for
  example `Resources.LoginButton` → `T("Sign in")`. Apply that list by hand.
  The command does not edit those lines.
- Wrap text a person sees. Leave logs, JSON keys, file names, `nameof`,
  attribute arguments, and exception text that is not shown. A stored option
  keeps its source value. Translate the caption when it is shown. Do not fill
  a static dictionary with `T(…)` at startup.
- resx has no plural forms. Each CLDR form is its own entry, named
  `{singular}[{form}]`, for example `1 sample[one]`. `Tn` selects the form.
  You do not type the plural suffix yourself. Context uses U+2404 between the
  context and the source, because U+0004 is illegal in XML. `Tp("menu", "Open")`
  looks that key up. You do not type the separator.

Work in passes: wrap, run `ai-i18n-tools extract`, read the named-key
suggestions, apply them by hand, then run `extract` again.

Then run `ai-i18n-tools migrate-dotnet-i18n` without `--write` and read the
report. Apply `--write` only for the unsafe `T($"…")` and concatenation
edits, after reading them. Never expect `--write` to rewrite
`Resources.LoginButton`. `--wrap` audits unmarked XAML and high-confidence C#
sinks. A clean report is not coverage. Do not commit the report. Do not edit
`.resx` files. `translate-ui` regenerates the neutral file and every satellite.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app gets `--lang <code>`
(and `-L` when that name is free), not a widget. Do not read `AI_I18N_LANG`.

`T` looks up with `CultureInfo.CurrentUICulture`, so a framework that sets the
UI culture for the request or the window gets the right satellite.
`I18nResx.SetLocale` sets `CurrentUICulture` and `CurrentCulture` together, then
raises `LocaleChanged`. It also stores one locale in a static field, and `Tn`
reads that field when it picks a plural form. Do not call `SetLocale` as a
per-user switch while other requests are in flight. A multi-user server keeps
`IStringLocalizer` and the request culture for ordinary strings.

- ASP.NET Core: `AddLocalization` with `ResourcesPath` set to the resx folder.
  An empty `SharedResource` class is the type argument of
  `IStringLocalizer<SharedResource>`. Its manifest name must equal
  `ResourceBaseName`. Set the request culture from the explicit choice, then
  the cookie, then `Accept-Language`, then the source locale. Accept only
  `sourceLocale` and `targetLocales`.
- Desktop: restore the saved culture before the first `T`, call
  `I18nResx.SetLocale`, and refresh visible text from `LocaleChanged`. Build
  the menu from the configured cultures. Label it `T("Language")`. When the
  framework has a flow direction, set it from `CultureInfo.TextInfo.IsRightToLeft`.
  `I18nResx` has no `SupportedLocales` list.
- `I18nResx.cs` does not reference `Microsoft.Extensions.Localization`. A
  console or desktop project does not take that dependency. Add the package
  only in the ASP.NET project, and put plural helpers there:

```csharp
public static LocalizedString Plural(
    this IStringLocalizer localizer,
    string singular,
    string plural,
    int count)
{
    return new LocalizedString(singular, I18nResx.Tn(singular, plural, count), false);
}
```

## Verify and report

The project's build and tests pass. `extract` writes a catalog of the
sentences you wrapped and keeps values ingested from the existing resx. With
the source locale, the output is unchanged. Your `.resx` files are untouched.

Report the files changed, each string you skipped with file, line, surface,
and reason, named keys you did not apply, one word with two meanings, and
plurals left as one string. With a satellite present, one test sets a target
culture and asserts that a shown validation message and a caption change,
while the stored value stays in the source language. If `dotnet` is not
installed, say the runtime check was skipped.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools translate-ui`, then
rebuild so the satellites are embedded. Remind the user to commit first,
because `translate-ui` rewrites the `.resx` files, and to fill
`glossary-user.csv` before that run.
````

<a id="review-the-result"></a>
## Review the result

The agent ends with a report. Check it before you translate:

- The diff. Wrapped calls, the config, `ResourceBaseName` if the files moved, and the language switch should have changed. Your `.resx` files should be untouched until you translate.
- `ai-i18n-tools.config.json`: `resx.outputDir` and `baseName` point at the catalogs your app loads, and `sourceRoots` covers the application project.
- `ResourceBaseName` matches the manifest name the SDK will embed.
- `ai-i18n-tools extract` lists the new messages and keeps translations already in the satellites.
- The dry run of `migrate-dotnet-i18n` lists nothing left to fix except named-key suggestions you chose to postpone. Those lines are still `Resources.LoginButton` until you edit them.
- Your tests pass, and the app looks the same in the source language.
- No throwaway script or `migrate-dotnet-i18n-report.md` was left behind.

Commit this state. `translate-ui` rewrites your `.resx` files, so you will want a clean diff to review.

<a id="choose-models-and-translate"></a>
## Choose models and translate

You run this part. It uses your API key, spends money on your account, and rewrites your `.resx` files, so commit first.

The model list from `init` is a starting point. Rank the active provider's chat models and, when the shortlist looks right, write it into `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` replaces only `translationModels`. The same ranking is on the [Models](/guide/translation-dashboard/models) tab of `ai-i18n-tools dashboard`.

Fill the glossary before the first `translate-ui`. `init` points `glossary.userGlossary` at `glossary-user.csv` and does not create the file. If the file is missing, run `ai-i18n-tools glossary-generate`, then add domain terms. Use **Force** for names that must be copied unchanged.

Then extract and translate:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui` writes the neutral file and one satellite per target language. Keys are the source strings. The `<comment>` records the context and the first source location. A hand edit in a satellite is kept only if `extract` ingests it before the next translation, the same contract as `.po` files. Leave the generated files unedited from now on, because the next run regenerates them. Review the first diff before you commit it.

Entries with a `type` or `mimetype` (images and other binaries) are skipped. `ResourceManager.GetString` returns the neutral value when that culture has no entry.

Rebuild so the SDK embeds the new satellites, then restart the app.

<a id="check-one-language"></a>
### Check one language

Switch to one target language and open a screen with a few wrapped strings. Text that is still in the source language was not wrapped, still uses a named key that was not applied, or the satellite was not rebuilt. A translation that drops `{0}` or renames it can throw `FormatException` or omit the value. `string.Format` does not fall back to the source template. Check the satellite for that sentence before you suspect the code.

<a id="keep-it-translated"></a>
## Keep it translated

Re-run `ai-i18n-tools sync` (or `extract` then `translate-ui`) after changing source text. The cache means only new or changed strings go to the model. Run it in CI so translations do not drift. Rebuild after a translation run so the satellites are embedded again. `ai-i18n-tools dashboard` opens the [Translation Dashboard](/guide/translation-dashboard/) to review translations.

`purge-locale` deletes `SharedResource.<culture>.resx` and leaves `SharedResource.resx`.

To refresh a copied `I18nResx.cs`, scaffold the same template in a disposable directory and copy only the generated file you intend to replace. Do not rerun `init` in the app to upgrade the helper.

To translate `README.md` in the same run, scaffold with `--with-readme` (or add the block to an existing config). See [Add i18n to your README and Markdown docs](/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Do it by hand

Work through these steps if you prefer to make the changes yourself, or you want to know what the prompt does. Each step matches a part of the prompt. You still [install the CLI](#install-and-choose-a-provider), [initialise the project](#initialise-the-project), and [translate](#choose-models-and-translate) at the end.

1. [Point the config at your resources](#step-1-point-the-config-at-your-resources).
2. [Wrap strings](#step-2-wrap-strings) in `T()` or `{loc:Tr '…'}`.
3. [Apply named resource keys](#step-3-apply-named-resource-keys).
4. [Switch language at runtime](#step-4-switch-language-at-runtime).

<a id="step-1-point-the-config-at-your-resources"></a>
## Step 1: Point the config at your resources

The template writes this shape. Change the folder and the base name to the catalogs your app already loads:

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "Resources/strings.json",
    "flatOutputDir": "Resources",
    "flatOutput": false,
    "resx": {
      "outputDir": "Resources",
      "baseName": "SharedResource",
      "writeNeutral": true,
      "ingestExistingResx": true,
      "localeFormat": "bcp47"
    }
  }
}
```

Check four things against your project:

- `outputDir` and `baseName` are where the neutral file and the satellites already live. German is `SharedResource.de.resx`. Brazilian Portuguese is `SharedResource.pt-BR.resx` when `localeFormat` is `bcp47`.
- `neutralFile` is set when that neutral file is not `{outputDir}/{baseName}.resx`. Ingestion maps a legacy name (`LoginButton`) through the neutral value (`Sign in`). The German `LoginButton` value is then stored under the source string `Sign in`.
- `ResourceBaseName` in `I18nResx.cs` is the namespace, the output folder, and the base name joined with dots. Move the constant when the files move. Leave the rest of the helper alone.
- `sourceRoots` is the application project, not `"."`.

A plain string's resx name is the source text: `Sign in`, `Saved to {0}`, a value that contains a quote or an ampersand. Context uses U+2404 between the context and the source. resx has no plural forms. Each CLDR form is its own entry, named `{singular}[{form}]`. `Tn` selects the form with the same rules as the `.po` writer. You do not type the separator or the plural suffix.

Confirm with `ai-i18n-tools extract`. The catalog should list strings ingested from the neutral file.

<a id="step-2-wrap-strings"></a>
## Step 2: Wrap strings

`extract` records a string only when it is a literal passed to `T()`, `Tn`, `Tp`, `N`, or `{loc:Tr '…'}`. The same shapes as the [JSON helper](/guide/add-i18n-to-dotnet#step-2-wrap-strings) apply. Placeholders are `{0}`, not `{name}`.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer` looks up whatever name you pass and returns that name when the resource is missing. The default extractor names are `T`, `Tn`, `Tp`, `N`, `Tr`, and `Loc`. A call such as `_localizer["Sign in"]` is invisible until `_localizer` is added to `ui.uiExtractor.funcNames`. Calling `T("Sign in")` or `I18nResx.T("Sign in")` needs no extra name.

XAML uses `{loc:Tr '…'}`. Element content is not extracted. Leave `{Binding}` and `{StaticResource}` alone.

Leave logs, JSON keys, file names, `nameof`, and exception text that is not shown. A stored value stays in the source language. Translate the caption at the control.

Unsafe calls (`T($"…")`, concatenation, `string.Format` inside `T`) are the next step's report, together with legacy names such as `Resources.LoginButton`.

<a id="step-3-apply-named-resource-keys"></a>
## Step 3: Apply named resource keys

`migrate-dotnet-i18n` is a dry run until you pass `--write`. It rewrites arguments of `T` that were built before lookup, the same edits as [Check wrapped calls](/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls).

When `extract` has ingested a neutral `.resx`, the report also gains a named-keys section:

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

That list is for you to apply. The command does not edit those lines. `--write` does not either. After you change a call to `T("Sign in")`, run `extract` again.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

Read `migrate-dotnet-i18n-report.md`. When the unsafe-call edits look right:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

Run the dry run again. Stop when it lists no unsafe-call edits. Named keys you have not applied yet stay in the suggestion list. Delete the report or git-ignore it. Do not edit the `.resx` files in this step.

<a id="step-4-switch-language-at-runtime"></a>
## Step 4: Switch language at runtime

`T` reads `CultureInfo.CurrentUICulture`. `I18nResx.SetLocale` sets that culture and `CurrentCulture`, then raises `LocaleChanged`. The locale it stores for `Tn` is static, so a server that handles concurrent requests should not use `SetLocale` as the per-user switch.

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer` is request-local. Point it at the resx the tool writes. The empty class is only the type argument. The manifest base name has to match `ResourceBaseName`.

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

In a Razor page or a service, call `T` so `extract` sees the literal. Keep an existing `IStringLocalizer<SharedResource>` when a call site already uses it. Add that receiver's name to `ui.uiExtractor.funcNames` if the lookup stays on the indexer.

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer` has no plural or context parameter. An extension can call `I18nResx`, which reads the same satellites. Put it in the ASP.NET project. `I18nResx.cs` does not reference `Microsoft.Extensions.Localization`, so a console or desktop project does not take that package.

```csharp
public static LocalizedString Plural(
    this IStringLocalizer localizer,
    string singular,
    string plural,
    int count)
{
    return new LocalizedString(singular, I18nResx.Tn(singular, plural, count), false);
}
```

Choose the request culture in this order: the visitor's explicit choice (`?lang=` or a form post), the cookie that remembers it, the `Accept-Language` header, then the source locale. Ignore codes that are not in `sourceLocale` or `targetLocales`. `pt-BR` is the satellite name. A header that sends `pt-br` still has to be matched onto that name before you assign `CurrentUICulture`.

<a id="desktop-and-console"></a>
### Desktop and console

Restore the saved culture before the window is built, call `I18nResx.SetLocale`, and refresh visible text from `LocaleChanged`. Build the menu from `sourceLocale` and `targetLocales`. Label it `T("Language")`. Flow direction comes from `CultureInfo.TextInfo.IsRightToLeft`. There is no `SupportedLocales` list on this helper.

A console program has no widget. Add `--lang <code>` (and `-L` when that name is free), then call `SetLocale` before the first `T`. Do not read `AI_I18N_LANG`.

Skip this step when the program shows no text a person reads.

That is the last manual step. Continue at [Choose models and translate](#choose-models-and-translate).

<a id="not-your-case"></a>
## Not your case?

| Your code today | Read |
| --- | --- |
| No `.resx` and no `IStringLocalizer` yet | [Add i18n to a .NET app](/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | xUnit checks of `I18nResx.cs`: source-string keys, quotes, context, plurals, real satellites |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | The JSON helper, for an app that is not on `ResourceManager` |

These directories check the helpers. They are not apps to translate, and they do not need an API key. `dotnet test` in `dotnet-resx` runs the satellite checks. A real app starts from `init` on this page. Copy one with `npx degit`, or download `ai-i18n-tools-dotnet-examples.zip` from the GitHub Release. That zip also contains `assets/dotnet`, which the project compiles. Commands: [Examples](/examples#net-examples).
