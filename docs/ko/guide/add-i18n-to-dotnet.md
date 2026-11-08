<a id="add-i18n-to-a-net-app"></a>
# .NET 앱에 i18n 적용

이 페이지에서는 단일 언어를 사용하는 .NET 앱(Avalonia, WPF, MAUI, WinForms, Blazor, ASP.NET 또는 콘솔 도구)에 ai-i18n-tools를 사용하여 로케일을 추가하는 방법을 설명합니다. 이 방법은 `ui-dotnet` 템플릿, 작은 `I18n.cs` 헬퍼, 그리고 번역 JSON 파일을 따릅니다. `extract`는 `T()`, `Tn`, `Tp`, `N` 또는 XAML `{loc:Tr '…'}` 내의 문자열 리터럴인 경우에만 UI 문자열을 기록하므로, 일반 소스 텍스트 카탈로그는 비어 있을 것입니다.

가장 빠른 방법은 이 페이지의 프롬프트를 코딩 에이전트에게 주는 것입니다. 에이전트는 헬퍼를 배치하고, 로케일 JSON을 포함하며, 문자열을 래핑하고, 언어 전환 기능을 추가할 수 있습니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화해야 합니다. 이는 API 키와 선택 사항이 필요하기 때문입니다. 또한 번역도 직접 실행해야 합니다. 이는 사용자 계정으로 비용이 발생하기 때문입니다.

이미 `ResourceManager` 또는 ASP.NET `IStringLocalizer`로 문자열을 로드하는 앱은 [Add i18n to a .NET ResourceManager app](/ko/guide/add-i18n-to-dotnet-resourcemanager)을 사용합니다. 이 방법은 로더를 유지하고 `.resx` 위성 어셈블리를 작성합니다. 어떤 방법이 적용되는지 확실하지 않으신가요? 마지막에 있는 [Not your case?](#not-your-case)를 참조하세요.

흐름:

1. [CLI 설치 및 공급자 선택](#install-and-choose-a-provider).
2. `init`를 사용하여 [프로젝트 초기화](#initialise-the-project).
3. [에이전트 프롬프트 실행](#run-the-agent-prompt).
4. [결과 검토](#review-the-result).
5. [모델 선택 및 번역](#choose-models-and-translate) 후 한 언어를 확인합니다.
6. [번역 유지](#keep-it-translated).

변경 사항을 직접 적용하고 싶거나 프롬프트가 무엇을 하는지 알고 싶으신가요? [수동으로 진행하기](#do-it-by-hand)에서 동일한 단계를 하나씩 안내합니다.

<a id="install-and-choose-a-provider"></a>
## 설치 및 공급자 선택

이 부분은 에이전트가 아닌 사용자가 직접 수행합니다. 설치 프로그램은 사용자 시스템을 변경하며, API 키는 프롬프트가 아닌 셸에 속하는 비밀 정보입니다.

머신에 이미 Node.js `>=22.16.0`가 설치되어 있다면 npm 패키지를 사용하세요 ([Installation](/ko/guide/installation)). .NET 프로젝트의 경우 독립 실행 파일(Node.js 불필요)을 설치하세요.

Linux 및 macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

설치 프로그램은 `SHA256SUMS.txt`를 확인하고, 명령어를 `ai-i18n-tools`로 설치하며, `PATH`에 추가합니다. 바이너리는 공증되거나 Authenticode 서명되지 않았습니다. 수동 단계 및 자산 이름: [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables).

설치 확인:

```bash
ai-i18n-tools --version
```

그런 다음 공급자를 선택하고 번역을 실행할 셸에 API 키를 설정합니다. 예를 들어, OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ollama는 키가 필요 없습니다. 다른 사전 설정: [내장 공급자](/ko/guide/providers-and-models#built-in-providers). 다음 단계에서 `init`에 전달해야 하므로 공급자 이름을 기록해 두세요. 에이전트는 키가 필요 없습니다. 모델 호출을 하지 않는 명령만 실행합니다. 키는 나중에 [번역](#choose-models-and-translate)할 때 사용합니다.

<a id="initialise-the-project"></a>
## 프로젝트 초기화

이것은 프롬프트 전에 한 번 실행합니다. 구성과 `I18n.cs`를 작성하고, 위에서 선택한 공급자를 사용합니다.

이 페이지는 하나의 템플릿인 `ui-dotnet`를 사용합니다. 이 템플릿은 구성, `I18n.cs` 헬퍼, 그리고 JSON 카탈로그를 작성합니다. 다음 앱에 적합합니다:

| 앱 | 참고 |
| --- | --- |
| Avalonia, WPF, MAUI | XAML의 레이블에는 마크업 확장이 필요합니다. 헬퍼는 해당 어셈블리를 참조하지 않습니다 |
| WinForms | 로케일이 변경될 때 보이는 텍스트를 다시 빌드합니다 |
| Blazor 및 단일 사용자 ASP.NET 앱 | 헬퍼의 카탈로그는 정적이므로 한 번에 한 명의 사용자에게 충분합니다 |
| 다중 사용자 서버 | `IStringLocalizer` 또는 `ResourceManager`을 유지합니다. [ResourceManager page](/ko/guide/add-i18n-to-dotnet-resourcemanager)를 사용하세요 |
| 콘솔 도구 | 위젯이 아닌 `--lang` 옵션 |

선택한 공급자(이 예에서는 OpenRouter)로 init을 실행합니다:

```bash
ai-i18n-tools init -t ui-dotnet -P openrouter
```

프로젝트 네임스페이스가 `init`이 `I18n.cs`에 출력하는 네임스페이스가 아닌 경우 `--namespace`를 전달하세요. 디렉터리에 `.csproj`가 하나 있고 `--namespace`가 없는 경우, `init`는 해당 파일의 `RootNamespace` 또는 프로젝트 파일 이름을 사용합니다. 그렇지 않으면 네임스페이스는 `AiI18n`입니다.

그런 다음 `ai-i18n-tools.config.json`에서 `sourceLocale` 및 `targetLocales`을(를) 편집합니다. `sourceLocale`은(는) 소스에 있는 문자열의 언어입니다. 모든 BCP-47 언어가 유효하며, 스캐폴드는 `en`을(를) 사용합니다. `init`은(는) 해당 목록을 `ai-i18n-tools-locales` 마커 사이에 `BuiltInLocales`으로(으로) `I18n.cs`에 스탬프하며, `SourceLocale`은(는) 상수입니다. 해당 스탬프는 언어 메뉴가 아닙니다. `extract`은(는) 구성에서 `locales/ui-languages.json`을(를) 다시 작성하고, 앱은 시작 시 해당 파일을 읽습니다. 도우미를 새로 고치기 위해 앱에서 `init`을(를) 다시 실행하지 마십시오.

`init`를 한 번 실행합니다. 매번 `ai-i18n-tools.config.json`을 다시 작성하므로, 두 번째 실행은 사용자가 변경한 내용을 삭제합니다. `I18n.cs`에 이미 마커 `ai-i18n-tools-i18n-cs`가 포함되어 있다면 프로젝트는 이미 초기화된 것입니다. 이 단계를 건너뛰세요. `init`는 기존 `I18n.cs`를 덮어쓰지 않으며, `.csproj`를 편집하지 않습니다.

`init`은(는) `ui.sourceRoots`을(를) `"."`(으)로 설정하므로, `extract`은(는) 전체 저장소를 스캔합니다. 프롬프트는 이를 애플리케이션 코드로 좁힙니다(수동으로, 즉 [1단계](#step-1-place-the-helper-and-embed-the-catalogs)입니다). 스캔은 이미 `bin`, `obj`, `.vs`, `TestResults`, `packages`이라는 이름의 디렉터리를 건너뛰며, 템플릿은 `**/Tests/**`, `**/*.Tests/**`, `**/TrExtension.cs`을(를) 제외합니다.

호출 형태: [.NET applications](/ko/guide/ui-strings/dotnet). 다른 모든 구성 키: [Configuration](/ko/reference/configuration).

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 등)에서 프로젝트를 열고, 새 채팅을 시작한 다음 아래 프롬프트를 붙여넣으세요. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 예를 들어 언어 전환을 원하지 않는 등 제외하고 싶은 것이 있다면 같은 메시지에 명시하세요.

에이전트는 먼저 CLI, 구성, 그리고 `I18n.cs`가 존재하는지 확인하고, 하나라도 누락되면 지침과 함께 중단됩니다. 그런 다음 세 부분으로 작동합니다:

- 1부에서는 `I18n.cs`와 `locales/`을 프로젝트가 코드를 보관하는 곳에 배치하고, JSON을 포함하며, 구성이 해당 파일을 가리키도록 합니다.
- 2부에서는 사용자 대면 문자열을 `T()`, `Tn`, `Tp`, `N`, `{loc:Tr '…'}`로 래핑한 다음, `migrate-dotnet-i18n`로 안전하지 않은 호출을 확인합니다.
- 3부에서는 언어 전환 또는 CLI 언어 옵션을 추가합니다.

에이전트는 아무것도 설치하거나 초기화하지 않으며, API 키를 읽거나 번역하지 않습니다. 번역은 검토 후 단계이며, 사용자가 실행합니다.

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
- Do not run `translate-ui`, `suggest-models`, `sync`, or `glossary-generate`.
  The first three call the translation API and cost money. `glossary-generate`
  only writes an empty CSV and does not call the translator. The user runs
  them after reviewing your work, and fills `glossary-user.csv` before the
  first `translate-ui`. Do not read `.env` or the environment to fill it.
- Do not translate, reword, or rename source text. Do not edit `I18n.cs`
  except `SourceLocale` and the `BuiltInLocales` array between the
  `ai-i18n-tools-locales` markers, and only when `sourceLocale` drifted after
  init. That stamp is not the language menu. Loading
  `locales/ui-languages.json` does not require editing the helper. Do not edit
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`,
  `.resx`). Do not add another helper module.
- Follow that project's changelog and user-doc rules in the same session when
  visible behaviour changes.
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
5. `BuiltInLocales`, between the `ai-i18n-tools-locales` markers, is only the
   list stamped at init. It is not the language menu. If `sourceLocale`
   drifted after init, update the `SourceLocale` const so it matches the
   config. Leave the rest of the helper alone. Part 3 loads the menu from
   `locales/ui-languages.json`.
6. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `T("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. The
exception is `Tn`: it may correct a sentence that was always plural
(`1 samples` becomes the singular form). Text that is already wrapped needs
no change.

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
  a `TrExtension` in the app. Do not reference those UI assemblies from
  `I18n.cs`. `ProvideValue` returns `I18n.T(Text)` and sets that same property
  again on `LocaleChanged`, so a screen that is already open updates.
  Unsubscribe when the control leaves the visual tree. Add `**/TrExtension.cs`
  to `ui.uiExtractor.exclude`. `extract` otherwise warns that `T(Text)` is not
  a literal. The XAML literals are already extracted through `Tr`. `{loc:Tr}`
  can only call `T`. When one short word has two meanings, set those controls
  in code with `Tp`.
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

- `StringFormat` on a binding (`StringFormat='Cursor {0}'`) is invisible to
  `extract`. Move it to the view model as `T("Cursor {0}", value)`, and raise
  `PropertyChanged` from `LocaleChanged`.
- A combo bound to an enum (`System`, `Light`, `Dark`) shows `ToString()`.
  Keep the stored enum. Return `T("Light")` from the caption, and rebuild the
  item list on `LocaleChanged` so the old caption is not cached.
- Tray or menu items use `Tp("tray", "Open")` and a stable `CommandParameter`.
  Match the parameter, not the translated header.
- An error built in a service and shown later stays in the source language
  until the display site. Store the English sentence. The display site maps
  known sentences through `T`, so a later `LocaleChanged` can translate them.
  `T()` at the moment of the failure freezes that sentence.
- Linux `.desktop` `Name=` and `Comment=` are launcher metadata. Leave them in
  the source language. Translating `Name=` replaces the desktop file's default
  name.
- Compact durations that are compared before display (`2d`, `7h 47m`) stay as
  tokens. Translate `T("now")` and `T("in {0}", duration)` at the display
  site. Do not translate the tokens inside the comparison.
- A literal with leading or trailing spaces (`Updated: `) is an extract
  warning. Move the space into the format string (`T("Updated: {0}", value)`)
  or into the layout. The helper trims the catalog key and puts the spaces
  back. Clear the warning anyway.
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
`Tn` may change the source-locale sentence when the old text was always
plural (`1 samples`).

Lines the command leaves in place (`await`, a raw `$$"""` string, a `? :`
hole, `ref` or `out`, a concatenation with no literal) are fixed by hand.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads, or when the
user asked you to leave language choice out. A console app still gets this
part: `--lang <code>` (and `-L` when that name is free), not a widget. Do not
read `AI_I18N_LANG`. That variable is only for the ai-i18n-tools CLI.

Goal: one chosen language applies to every `T()` in that process, and a screen
can remember the choice. Persist the locale code, not the native name.

Load the language menu from `locales/ui-languages.json` on disk at startup,
before the first `T()`. Search upward from `AppContext.BaseDirectory`, then
from the current directory, at most 8 directories each. The first
`locales/ui-languages.json` wins. Map `code`, `label`, and `englishName` to
`LocaleInfo` (`label` is `NativeName`) and pass that array to `I18n.Configure`
as `Locales`. When the file is found, set `FlatDirectory` to that `locales`
directory in the same call. `Configure` replaces `Strict`, `FlatDirectory`,
and `OpenLocale` on every call, even when the caller only set `Locales`. A
later call that sets the language list clears a `FlatDirectory` set earlier.
`Locales: null` does not restore the previous list.

If `ui-languages.json` is missing, pass a one-element `Locales` array for the
source language and do not set `FlatDirectory`. The menu is the source
language only. Do not show `BuiltInLocales`. In development, `FlatDirectory`
is the `locales` folder that contained the manifest, so `sync` updates
sentences without a rebuild. A published build with no manifest nearby uses
the embedded catalogs and shows the source language only. An installer that
should follow `sync` must ship `ui-languages.json` and the locale JSON next
to the app.

Accept only codes from the list just passed. Set
`CultureInfo.CurrentUICulture` and `CultureInfo.CurrentCulture`, then call
`I18n.SetLocale`, before the first `T()`. `SetLocale` raises `LocaleChanged`
immediately, so the cultures have to be set first. `string.Format` uses the
current UI culture, so `{0:C}` follows it. Restore the saved code the same
way at startup.

Add a control labelled `T("Language")` whose options are that list (`Code`,
`NativeName`). On change, set both cultures, then call `SetLocale`, and
persist the code.

On `LocaleChanged`, refresh view-model properties that call `T`. WinForms and
other toolkits that copy text into controls rebuild those properties in the
handler. For Avalonia, WPF, and MAUI, `TrExtension` returns `I18n.T(Text)` and
updates the target property on `LocaleChanged`. Exclude `TrExtension.cs` from
extraction. When the framework has a flow direction, set it from
`I18n.IsRightToLeft(code)`.

Avalonia only: ignore `SelectionChanged` unless `e.Source` is the control that
owns the handler. Do not assign `ItemsSource`, `SelectedItem`, or other combo
state inside a `SelectionChanged` handler, including from `LocaleChanged` if
that event was raised by the combo. Post the refresh with
`Dispatcher.UIThread.Post` so it runs after the selection event returns. Guard
the language handler with a flag while the code itself sets `SelectedItem`,
or the refresh will set the locale again. Avalonia will crash (exit code 139,
`SIGSEGV`, no managed stack in `crash.log`) if a parent `TabControl` handles
a child combo's `SelectionChanged` by setting `ItemsSource` again.

Do not use this helper as a per-user selector in a multi-user server. Keep
`IStringLocalizer` or `ResourceManager` for that case.

## Verify and report

The project's build and tests pass. `extract` writes a non-empty catalog of
the sentences you wrapped, with no warnings. With the source locale, the
output is unchanged, except a `Tn` singular that corrects a sentence that was
always plural. A missing key returns the source string unless `Strict` is
set. A bad format in a translation can throw `FormatException`. A dropped
`{0}` can omit the value. `string.Format` does not fall back to the source
template.

`I18n` and the two cultures are process-global. xUnit runs test classes in
parallel by default. When a test calls `SetLocale`, turn assembly
parallelization off and restore `CurrentCulture`, `CurrentUICulture`, the
locale, and the previous `Locales` array before the test returns. `Configure`
with `Locales: null` does not restore the list. With a locale file present,
one test sets a target locale and asserts that a validation message and a
caption change, while the stored option value stays in the source language,
then restores that static state. Do not add a test that only checks the menu
against `ui-languages.json` unless the user asks. If `dotnet` is not
installed, say the runtime check was skipped.

Report the files changed, each string you skipped with file, line, surface,
and reason, the same word used with different meanings, sentences built from
translated pieces, plurals left as one string, and any `T()` that runs at
startup.

Then list the commands for the user, and do not run them:
`ai-i18n-tools suggest-models` (optional), `ai-i18n-tools glossary-generate`
when `glossary-user.csv` is missing, then fill that file,
`ai-i18n-tools translate-ui`, then restart the app. With `FlatDirectory`
pointed at the `locales` folder, a restart picks up new sentences. A rebuild
is needed only when the manifest was not found and the app is still reading
embedded JSON. Also list these checks, and do not perform them: change
`targetLocales`, run `sync`, and launch with no further code edit (the menu
matches `ui-languages.json` and the sentences match the new locale file);
hide `ui-languages.json` and launch again (the menu is the source language
only); switch language from a combo inside a `TabControl` with that page
already open (the process stays up and the open labels change).
````

<a id="review-the-result"></a>
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점. 래핑된 텍스트는 관련 없는 재포맷 없이 이전과 동일하게 읽혀야 합니다. `git diff --stat`은(는) 변경된 양을 보여줍니다. 도우미 배치, `EmbeddedResource` 항목, 래핑된 호출 및 언어 전환이 예상되는 편집 내용입니다.
- 생성된 카탈로그(`strings.json`, 로케일별 JSON, `ui-languages.json`)는 `extract`이(가) 작성한 것을 제외하고는 변경되지 않습니다. `I18n.cs`은(는) 해당 상수가 변경되었을 때 `SourceLocale` 스탬프를 제외하고는 변경되지 않습니다. 메뉴는 `ui-languages.json`에서 로드됩니다. 해당 파일이 발견되면 하나의 `Configure` 호출이 `Locales` 및 `FlatDirectory`을(를) 함께 설정합니다. `TrExtension`은(는) 추출에서 제외되며 `LocaleChanged`의 열린 보기를 업데이트합니다.
- `ai-i18n-tools extract`은(는) 깨끗하게 실행되고, `strings.json`은(는) 예상하는 문장을 나열합니다. 경고가 남아 있지 않으며, 어떤 리터럴도 여전히 `{name}`을(를) 포함하지 않습니다.
- `migrate-dotnet-i18n`의 드라이 런은 수정할 것이 남아 있지 않음을 보여줍니다. 깨끗한 보고서가 모든 문장이 래핑되었음을 증명하지는 않습니다. 에이전트 보고서의 건너뛴 문자열은 해당 검사의 나머지 부분입니다.
- 테스트가 통과하고, 앱은 소스 언어에서 동일하게 보입니다.
- 임시 스크립트나 `migrate-dotnet-i18n-report.md`이(가) 남아 있지 않습니다.
- `I18n.cs`의 `SourceLocale`은(는) 구성의 `sourceLocale`과(와) 문자 하나하나까지 동일합니다. 언어 메뉴는 `BuiltInLocales`을(를) 읽지 않습니다.

에이전트가 놓친 문자열은 나중에 원본 언어로 남아 있는 텍스트로 나타납니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 사용자가 실행합니다. 사용자 API 키를 사용하며 사용자 계정에서 비용이 발생합니다.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`는 `translationModels`만 대체합니다. 동일한 순위는 `ai-i18n-tools dashboard`의 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다.

첫 번째 `translate-ui` 전에 용어집을 채우세요. `init`은(는) `glossary.userGlossary`가 `glossary-user.csv`을(를) 가리키도록 하며 파일을 생성하지 않습니다. 파일이 없으면 `ai-i18n-tools glossary-generate`을(를) 실행한 다음 도메인 용어를 추가하세요. 변경되지 않고 복사되어야 하는 이름에는 **Force**를 사용하세요. 변경되지 않은 문자열의 두 번째 `translate-ui`은(는) 다르게 표현되어 돌아올 수 있습니다. 용어집은 두 실행이 일치하도록 하는 것입니다.

그런 다음 추출하고 번역합니다.

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`extract`은(는) `strings.json`과(와) `ui-languages.json`를 작성합니다. `translate-ui`은(는) `ui.flatOutputDir` 아래에 대상 언어당 하나의 JSON 파일을 작성합니다. 이 생성된 파일들을 편집하지 않은 상태로 두세요. `sync`은(는) `features.translateUIStrings`이(가) 켜져 있을 때 `extract`과(와) `translate-ui`을(를) 함께 실행합니다.

`T()`은(는) 로케일 JSON에서 원본 문장을 조회합니다. `strings.json`의 ID는 조회 키가 아닙니다. `I18n.Strict`가 설정되지 않은 경우를 제외하고, 파일 누락 또는 키 누락 시 원본 문장을 반환합니다. 그런 다음 `string.Format`은(는) 번역된 템플릿에서 실행됩니다. 잘못된 형식은 `FormatException`을(를) 발생시킬 수 있습니다. 누락된 `{0}`은(는) 인수를 생략할 수 있습니다. 형식 오류 후에는 원본 템플릿으로 폴백(fallback)되지 않습니다.

<a id="check-one-language"></a>
### 한 언어 확인

앱을 다시 시작하고, 하나의 대상 언어로 전환한 다음, 몇 개의 래핑된 문자열이 있는 화면을 여세요. 에이전트가 추가한 언어 전환을 사용하거나, 두 문화권을 모두 설정하고 직접 `I18n.SetLocale`을(를) 호출하세요. 여전히 원본 언어로 되어 있는 텍스트는 래핑되지 않았거나, `SetLocale` 전에 컨트롤에 복사되었거나, 로케일 JSON에 항목이 없는 경우입니다. 코드를 의심하기 전에 해당 문장에 대해 JSON을 확인하세요.

`SetLocale`은(는) 카탈로그가 열릴 때까지 `CultureInfo.Parent`을(를) 탐색합니다 (`pt-BR`는 `pt.json`을(를) 로드할 수 있습니다). `OpenLocale`도 `FlatDirectory`도 설정되지 않은 경우 임베디드 리소스가 사용됩니다. 구성된 `FlatDirectory`은(는) 파일이 없는 경우 임베디드 JSON으로 폴백(fall through)되지 않습니다.

시작 시 `locales/ui-languages.json`을(를) 찾으면, `FlatDirectory`은(는) 해당 디렉터리이므로, 보이는 문장은 `sync`이(가) 방금 작성한 파일입니다. 해당 매니페스트를 숨기고 다시 시작하면: 메뉴는 소스 언어만 제공하고, 문자열은 마지막 빌드에 포함된 임베디드 리소스에서 가져옵니다. `sync`을(를) 따라야 하는 설치된 빌드는 `ui-languages.json`와 로케일 JSON을 앱 옆에 함께 제공해야 합니다.

<a id="keep-it-translated"></a>
## 번역 유지

소스 텍스트를 변경한 후 `ai-i18n-tools sync`(또는 `extract` 다음 `translate-ui`)을(를) 다시 실행합니다. 캐시는 새로 추가되거나 변경된 문자열만 모델로 전송됨을 의미합니다. 번역이 변경되지 않도록 CI에서 실행합니다. `FlatDirectory`이(가) `locales` 폴더를 가리키도록 한 후 앱을 다시 시작합니다. 매니페스트를 찾을 수 없고 앱이 여전히 임베디드 JSON을 읽고 있을 때만 다시 빌드해야 합니다. `ai-i18n-tools dashboard`은(는) 번역을 검토하기 위해 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

복사된 `I18n.cs`을(를) 새로 고치려면, 일회용 디렉터리에 동일한 템플릿을 스캐폴드하고 교체하려는 생성된 파일만 복사하세요. 헬퍼를 업그레이드하기 위해 앱에서 `init`을(를) 다시 실행하지 마세요.

동일한 실행에서 `README.md`를 번역하려면, `--with-readme`로 스캐폴드합니다 (또는 기존 구성에 블록을 추가합니다). [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르십시오. 각 단계는 프롬프트의 한 부분과 일치합니다. 마지막에는 여전히 [CLI를 설치](#install-and-choose-a-provider)하고, [프로젝트를 초기화](#initialise-the-project)하며, [번역](#choose-models-and-translate)해야 합니다.

1. [헬퍼를 배치하고 카탈로그를 임베드하세요](#step-1-place-the-helper-and-embed-the-catalogs).
2. `T()`, `Tn`, `Tp`, `N` 또는 `{loc:Tr '…'}`에서 [문자열을 래핑하세요](#step-2-wrap-strings).
3. `migrate-dotnet-i18n`을(를) 사용하여 [래핑된 호출을 확인하세요](#step-3-check-wrapped-calls).
4. [언어 전환을 추가하세요](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-embed-the-catalogs"></a>
## 1단계: 헬퍼를 배치하고 카탈로그를 임베드하세요

`init`은(는) 저장소 루트에 다음을 작성합니다.

| 파일 | 내용 | 편집 여부 |
| --- | --- | --- |
| `I18n.cs` | 코드가 호출하는 헬퍼 (`T`, `Tn`, `Tp`, `SetLocale`) | 아니요. 생성됩니다. `init`은(는) 덮어쓰지 않습니다 |
| `locales/strings.json` | 추출 캐시. 앱은 이를 읽지 않습니다 | 아니요. `extract`이(가) 작성합니다 |
| `locales/<code>.json` | 앱이 로드하는 번역, 언어당 하나의 파일 | 아니요. `translate-ui`이(가) 작성합니다 |
| `locales/ui-languages.json` | 언어 메뉴. 앱은 시작 시 `code`, `label`, `englishName`을(를) 읽습니다. | 아니요. `extract`이(가) 작성합니다. |

`I18n.cs`과(와) `locales/`을(를) 애플리케이션 프로젝트로 이동하세요. 해당 `.csproj`에 임베드를 추가하고 파일의 나머지는 그대로 두세요:

```xml
<ItemGroup>
  <EmbeddedResource Include="locales/*.json" />
</ItemGroup>
```

포함 경로는 프로젝트 파일에 상대적입니다. .NET Framework 4.8은 `System.Text.Json` 패키지도 필요합니다. .NET 6 또는 그 이상은 이미 가지고 있습니다.

구성을 새 위치로 업데이트하고, 테스트 및 빌드 출력이 카탈로그에 포함되지 않도록 `sourceRoots`를 애플리케이션 프로젝트로 지정하십시오.

```json
{
  "ui": {
    "sourceRoots": ["src/MyApp"],
    "stringsJson": "src/MyApp/locales/strings.json",
    "flatOutputDir": "src/MyApp/locales"
  }
}
```

`global using static MyApp.I18n;`를 추가하거나 (`I18n.cs`에 인쇄된 네임스페이스를 사용하십시오), 각 사이트에서 `I18n.T`를 호출하십시오.

도우미의 `SourceLocale`은(는) 구성의 `sourceLocale`과(와) 같아야 합니다. `ai-i18n-tools-locales` 마커 사이에 있는 `BuiltInLocales`은(는) `init`이(가) 스탬프한 목록입니다. 그것은 메뉴가 아닙니다. `targetLocales`을(를) 변경한 후, `extract`은(는) `ui-languages.json`을(를) 다시 작성하고, 앱은 해당 파일을 읽습니다. 새로운 도우미가 필요할 때 일회용 디렉터리를 스캐폴드합니다. 여기에서 `init`을(를) 다시 실행하지 마십시오.

`ai-i18n-tools extract`로 확인하십시오. 카탈로그는 새 `locales/` 폴더에 나타나야 합니다. 무언가가 래핑될 때까지 0개의 문자열을 예상하십시오.

<a id="step-2-wrap-strings"></a>
## 2단계: 문자열 래핑

`extract`는 `T()`, `Tn`, `Tp`, `N` 또는 `{loc:Tr '…'}`에 전달된 리터럴일 때만 문자열을 기록합니다. `I18n.T`와 같은 수신자는 마지막 이름이 `T`이므로 일치합니다.

먼저 카탈로그 항목을 조회한 다음, 결과를 `string.Format`에 전달하십시오.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
N("Light")
```

카탈로그가 프로그램이 찾는 것과 일치하지 않으므로, 이들은 추출된 다음 거부됩니다.

```csharp
T($"Saved to {path}")
T("Last synced " + when)
T(variable)
T("Hello {name}")
```

`extract`는 처음 세 개에 대해 경고를 출력하고 `{name}`에서 중지합니다. [다음 단계](#step-3-check-wrapped-calls)에서 처음 세 개를 다시 작성합니다.

자리 표시자는 .NET 형식으로 유지됩니다: `{0}`, `{0,-10}`, `{0:C}`. `%`는 일반 텍스트이므로 `10% off`와 같은 번역은 printf 토큰이 아닙니다. 이중 중괄호 (<code v-pre>{{</code> 및 `}}`)는 리터럴 중괄호이며 변경 없이 복사해야 합니다. 더 많은 호출 형태: [번역되는 호출](/ko/guide/ui-strings/dotnet#calls-that-translate).

XAML 및 AXAML:

```xml
<TextBlock Text="{loc:Tr 'Sign in'}" />
```

접두사는 무시됩니다. `{Binding}` 및 `{StaticResource}`은 그대로 둡니다. 요소 콘텐츠로 작성된 텍스트는 추출되지 않습니다. 아포스트로피를 포함하는 리터럴은 속성이 이중 따옴표 안에 유지되도록 `&quot;`로 작성됩니다.

Avalonia, WPF 및 MAUI는 각각 자체 `MarkupExtension` 기본 클래스를 제공합니다. 도우미는 해당 어셈블리를 참조하지 않습니다. `ProvideValue`은(는) `I18n.T(Text)`을(를) 반환하고 `LocaleChanged`에서 해당 속성을 다시 설정한 다음, 컨트롤이 시각적 트리에서 벗어날 때 구독을 취소합니다. 하나의 Avalonia 모양(`IProvideValueTarget`은(는) `Avalonia.Metadata`에 있습니다):

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }

    public override object ProvideValue(IServiceProvider serviceProvider)
    {
        var text = I18n.T(Text);
        if (serviceProvider.GetService(typeof(IProvideValueTarget)) is IProvideValueTarget target
            && target.TargetObject is AvaloniaObject control
            && target.TargetProperty is AvaloniaProperty property)
        {
            void Refresh() => control.SetValue(property, I18n.T(Text));
            I18n.LocaleChanged += Refresh;
            if (control is StyledElement element)
            {
                element.DetachedFromVisualTree += (_, _) => I18n.LocaleChanged -= Refresh;
            }
        }
        return text;
    }
}
```

WPF와 MAUI는 자체 속성 유형으로 동일하게 작동합니다. `ui.uiExtractor.exclude`에 `**/TrExtension.cs`을(를) 추가합니다. `T(Text)`은(는) 리터럴이 아니며, XAML 리터럴은 이미 `Tr`을(를) 통해 추출되었습니다. `{loc:Tr}`은(는) `T`만 호출할 수 있습니다. 하나의 짧은 단어에 대한 두 가지 의미는 `Tp`을(를) 사용하여 코드에 설정됩니다.

서식 있는 문장은 C#(`T("Cursor {0}", value)`)에 남아 있으며, 이는 추출기를 단일 리터럴에 유지합니다. 바인딩의 `StringFormat`은(는) `extract`에 보이지 않습니다. 동일한 호출이 뷰 모델, 트레이 툴팁 및 대화 상자에서 작동합니다. 뷰 모델 문자열의 경우 `LocaleChanged`에서 `PropertyChanged`을(를) 발생시킵니다.

저장되고 표시되는 값은 저장된 값을 원본 언어로 유지합니다. 열거형 콤보는 열거형을 유지하고 캡션에서 `T("Light")`을(를) 반환한 다음, `LocaleChanged`에서 항목을 다시 빌드합니다. 추출기가 보는 리터럴을 정적 필드가 보유할 수 있도록 `N("Last 12 months")`이(가) 존재합니다. 정적 사전의 `T()`은(는) 첫 번째 형식 로드 시 한 번 실행되며 해당 언어로 유지됩니다. 서비스는 영어 오류 문장을 저장합니다. 표시 사이트는 `T`를 통해 알려진 문장을 매핑하여 나중에 로케일이 변경될 때 번역할 수 있도록 합니다. 실패 시 `T()`은(는) 해당 문장을 고정합니다.

트레이 항목은 `Tp("tray", "Open")`과(와) 안정적인 `CommandParameter`을(를) 사용합니다. 헤더가 아닌 매개변수를 일치시키세요. Linux `.desktop` `Name=` 및 `Comment=`은(는) 원본 언어로 유지됩니다. 비교되는 기간 토큰(`2d`, `7h 47m`)은(는) 번역되지 않은 상태로 유지됩니다. 텍스트가 표시되는 곳에서 `T("now")`과(와) `T("in {0}", duration)`을(를) 번역하세요. 선행 또는 후행 공백이 있는 리터럴(`Updated: `)은(는) 여전히 추출 경고입니다. 공백을 서식 문자열 또는 레이아웃으로 이동하세요. `Tn`은(는) 항상 복수였던 원본 문장(`1 samples`)을(를) 변경할 수 있습니다.

다음은 그대로 두십시오: 로그, JSON 속성 이름, 파일 이름, `nameof`, 특성 인수, 식별자로 사용되는 개체 키, 그리고 프로그램이 표시하는 대신 일치시키는 예외 텍스트.

`ai-i18n-tools extract`를 다시 실행하세요. 이제 카탈로그에 래핑한 문장들이 나열되어야 합니다.

<a id="step-3-check-wrapped-calls"></a>
## 3단계: 래핑된 호출 확인

호출이 카탈로그 조회 전에 문자열을 형식화할 때 이 단계를 사용하십시오.

```csharp
T($"Saved to {path}")
T("Last synced " + date)
T(string.Format("Hello {0}", name))
```

`migrate-dotnet-i18n`는 이를 먼저 발생하는 조회로 다시 작성합니다. 두 번째 실행은 아무것도 변경하지 않습니다.

```csharp
T("Saved to {0}", path)
T("Last synced {0}", date)
T("Hello {0}", name)
```

`--write`를 전달할 때까지 이 명령은 드라이 런입니다. `migrate-dotnet-i18n-report.md`을(를) 작성합니다. 해당 보고서를 읽으십시오. 편집 내용이 올바르게 보이면:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

드라이 런을 다시 실행하세요. 편집 내용이 없다고 표시되면 중지하고 프로젝트 테스트를 실행하세요. 제자리에 남겨진 줄(`await`, 원시 보간 원시 문자열, 조건부 구멍, `ref` 또는 `out`, 리터럴이 없는 연결, `string.Format`에 전달된 `IFormatProvider`)은(는) 수동으로 수정됩니다. 복수형처럼 보이는 구문은 `Tn`에 속하며, 이는 항상 복수형이었던 원본 문장을 수정할 수 있습니다. 생성된 `I18n.cs`은(는) 건너뜁니다. 보고서를 삭제하거나 git-ignore하세요.

`--wrap`는 또한 표시되지 않은 XAML `Text`, `Header`, `Content` 및 다른 레이블 특성을 `{loc:Tr '…'}`로 표시하며, 이름이 `Text`, `Title` 또는 `Message`로 끝나는 C# 할당과 `MessageBox.Show`도 표시합니다. `--write`가 없으면 이는 감사입니다. 로그, 특성, `nameof`, 비교 또는 `Path` 호출은 편집하지 않습니다.

수정 사항이 없는 보고서는 래핑된 호출이 안전하다는 것을 의미합니다. 이는 모든 사용자 대면 문장이 래핑되었다는 것을 의미하지는 않습니다. 원시 레이블, 반환된 문자열 및 요소 콘텐츠는 보고서에 표시되지 않습니다. 자세한 내용: [안전하지 않은 호출 다시 작성](/ko/guide/ui-strings/dotnet#rewrite-unsafe-calls).

<a id="step-4-add-a-language-switch"></a>
## 4단계: 언어 전환 추가

첫 번째 `T()` 전에 `locales/ui-languages.json`을(를) 찾으세요. `AppContext.BaseDirectory`에서 위로 검색한 다음, 현재 디렉터리에서 각 최대 8개 디렉터리를 검색하세요. 첫 번째 파일이 우선합니다. `code`, `label` 및 `englishName`을(를) `LocaleInfo`으로(으로) 구문 분석합니다 (`label`은(는) `NativeName`입니다). 해당 배열을 `Locales`으로, `FlatDirectory`을(를) 파일을 포함하는 `locales` 디렉터리로 설정하여 `Configure`을(를) 한 번 호출합니다. `Configure`은(는) 모든 호출에서 `Strict`, `FlatDirectory` 및 `OpenLocale`을(를) 대체합니다. `Locales`만 설정하는 나중 호출은 `FlatDirectory`을(를) 지웁니다. `Locales: null`은(는) 이전 목록을 복원하지 않습니다.

파일이 없으면 원본 언어에 대해 한 요소 `Locales` 배열을 전달하고 `FlatDirectory`을(를) 설정하지 마세요. 메뉴는 원본 언어로만 제공됩니다. `BuiltInLocales`을(를) 표시하지 마세요. 개발은 `sync`이(가) 방금 작성한 카탈로그를 읽습니다. 근처에 매니페스트가 없는 게시된 빌드는 내장된 카탈로그를 유지합니다. `sync`를 따라야 하는 설치 프로그램은 `ui-languages.json`와(과) 로케일 JSON을 앱 옆에 배포합니다.

기본 이름이 아닌 로케일 코드를 유지하세요. `SetLocale` 전에 두 문화권을 모두 설정하세요. `LocaleChanged`이(가) 해당 호출 내에서 발생하기 때문입니다.

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

`T("Language")`으로(으로) 컨트롤에 레이블을 지정하세요. 전달한 목록의 코드만 허용하세요. `LocaleChanged`에서 뷰 모델 문자열에 대해 `PropertyChanged`을(를) 발생시키거나 텍스트를 복사한 컨트롤을 다시 빌드하세요. `TrExtension`은(는) [2단계](#step-2-wrap-strings)에서와 같이 열린 뷰를 업데이트합니다. 프레임워크에 흐름 방향이 있으면 `I18n.IsRightToLeft(code)`에서 설정하세요.

Avalonia: `e.Source`이(가) 핸들러를 소유하는 컨트롤이 아닌 한 `SelectionChanged`을(를) 무시하세요. 해당 핸들러 내부 또는 이 콤보의 `SetLocale`이(가) 발생시킨 `LocaleChanged` 내부에서 `ItemsSource` 또는 `SelectedItem`을(를) 할당하지 마세요. `Dispatcher.UIThread.Post`으로(으로) 새로 고침을 게시하세요. 코드가 `SelectedItem`을(를) 설정하는 동안 핸들러를 보호하세요. 버블링된 이벤트를 탭 변경으로 처리하고 `ItemsSource`을(를) 다시 할당하는 부모 `TabControl`은(는) 프로세스를 충돌시킵니다 (종료 코드 139, 빈 `crash.log`).

콘솔 프로그램에는 위젯이 없습니다. `--lang <code>`을(를) 추가하세요 (이름이 비어 있으면 `-L`도 추가). 위에 로드된 목록의 코드만 허용하세요. `AI_I18N_LANG`을(를) 읽지 마세요. 해당 변수는 ai-i18n-tools CLI 전용입니다.

프로그램이 사람이 읽을 텍스트를 표시하지 않을 때는 이 단계를 건너뛰세요.

카탈로그와 현재 로캘은 정적입니다. 이는 데스크톱 프로세스에 안전합니다. 다중 사용자 서버의 요청별 로캘이 아닙니다. 그곳에 `IStringLocalizer` 또는 `ResourceManager`(을)를 유지하고 [Add i18n to a .NET ResourceManager app](/ko/guide/add-i18n-to-dotnet-resourcemanager)을(를) 따르세요. `CurrentUICulture`를 설정해도 각 요청에 자체 맵이 제공되지 않습니다.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#choose-models-and-translate)에서 계속하세요.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 현재 코드 | 읽기 |
| --- | --- |
| `ResourceManager`, `.resx` 위성 또는 ASP.NET `IStringLocalizer` | [Add i18n to a .NET ResourceManager app](/ko/guide/add-i18n-to-dotnet-resourcemanager) |
| 이미 원본 언어 문장으로 `T("…")`됨 | [UI strings](/ko/guide/ui-strings/) 2–3단계, 및 [.NET applications](/ko/guide/ui-strings/dotnet) |
| JS/TS 앱 | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) |
| Python 앱 | [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) |
| Django, Flask-Babel 카탈로그 또는 GNU gettext | [Add i18n to a Django / Python gettext app](/ko/guide/add-i18n-to-django-gettext) |
| 웹사이트 또는 문서 사이트 | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website) |
| 리포지토리 README 또는 기타 마크다운 파일 | [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 예시

| 예시 | 표시 내용 |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `I18n.cs`에 대한 xUnit 검사: 내장 JSON, 문화권 대체, `{0}`, 복수형, 그리고 `Configure` |

이 디렉터리들은 헬퍼를 확인합니다. 이들은 번역할 앱이 아니며, API 키가 필요하지 않습니다. 해당 디렉터리에 있는 `dotnet test`이(가) 검사를 실행합니다. 실제 앱은 이 페이지의 `init`부터 시작합니다. `npx degit`를 사용하여 하나를 복사하거나, GitHub 릴리스에서 `ai-i18n-tools-dotnet-examples.zip`을(를) 다운로드하세요. 해당 zip 파일에는 프로젝트가 컴파일하는 `assets/dotnet`도 포함되어 있습니다. 명령어: [예시](/ko/examples#net-examples).
