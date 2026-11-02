<a id="add-i18n-to-a-dotnet-app"></a>
# .NET 앱에 i18n 추가

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

그런 다음 `ai-i18n-tools.config.json`에서 `sourceLocale`와 `targetLocales`을 편집합니다. `sourceLocale`는 소스에 있는 문자열의 언어입니다. 모든 BCP-47 언어가 유효하며, 스캐폴드는 `en`를 사용합니다. 동일한 목록은 `ai-i18n-tools-locales` 마커 사이에 `I18n.cs`에 `BuiltInLocales`로 스탬프되며, `SourceLocale`는 상수입니다. `SupportedLocales`는 해당 배열을 읽습니다. 구성을 변경한 후에는 스탬프를 업데이트하거나 새 `Locales` 배열을 `I18n.Configure`에 전달하세요. 헬퍼를 새로 고치기 위해 앱에서 `init`를 다시 실행하지 마세요.

`init`를 한 번 실행합니다. 매번 `ai-i18n-tools.config.json`을 다시 작성하므로, 두 번째 실행은 사용자가 변경한 내용을 삭제합니다. `I18n.cs`에 이미 마커 `ai-i18n-tools-i18n-cs`가 포함되어 있다면 프로젝트는 이미 초기화된 것입니다. 이 단계를 건너뛰세요. `init`는 기존 `I18n.cs`를 덮어쓰지 않으며, `.csproj`를 편집하지 않습니다.

`init`는 `ui.sourceRoots`을 `"."`로 설정하므로, `extract`는 전체 리포지토리를 스캔합니다. 프롬프트는 이를 애플리케이션 코드로 좁힙니다(수동으로, 즉 [Step 1](#step-1-place-the-helper-and-embed-the-catalogs)입니다). 스캔은 이미 `bin`, `obj`, `.vs`, `TestResults`, `packages`라는 이름의 디렉터리를 건너뛰며, 템플릿은 `**/Tests/**`와 `**/*.Tests/**`를 제외합니다.

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
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점. 래핑된 텍스트는 관련 없는 서식 재지정 없이 이전과 동일하게 읽혀야 합니다. `git diff --stat`은(는) 변경된 양을 보여줍니다. 헬퍼 배치, `EmbeddedResource` 항목, 래핑된 호출 및 언어 전환은 예상되는 편집 내용입니다.
- 생성된 카탈로그(`strings.json`, 로케일별 JSON, `ui-languages.json`)는 `extract`이(가) 작성한 내용 외에는 변경되지 않았습니다. `I18n.cs`은(는) 새로 고치도록 요청한 로케일 스탬프 외에는 변경되지 않았습니다.
- `ai-i18n-tools extract`은(는) 깨끗하게 실행되며, `strings.json`은(는) 예상하는 문장을 나열합니다. 경고는 남아있지 않으며, 어떤 리터럴에도 여전히 `{name}`이(가) 포함되어 있지 않습니다.
- `migrate-dotnet-i18n`의 드라이 런은 수정할 내용이 남아있지 않음을 나열합니다. 깨끗한 보고서가 모든 문장이 래핑되었음을 증명하지는 않습니다. 에이전트 보고서의 건너뛴 문자열은 해당 확인의 나머지 부분입니다.
- 테스트가 통과하고, 앱은 원본 언어에서 동일하게 보입니다.
- 일회용 스크립트나 `migrate-dotnet-i18n-report.md`은(는) 남겨지지 않았습니다.
- `I18n.cs`의 `SourceLocale`은(는) 구성의 `sourceLocale`과(와) 문자 하나하나 같습니다. `BuiltInLocales`은(는) 구성과 동일한 언어를 나열합니다.

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

<a id="keep-it-translated"></a>
## 번역 유지

원본 텍스트를 변경한 후 `ai-i18n-tools sync`을(를) 다시 실행하세요 (또는 `extract`을(를) 실행한 다음 `translate-ui`를 실행하세요). 캐시는 새롭거나 변경된 문자열만 모델로 전송됨을 의미합니다. 번역이 벗어나지 않도록 CI에서 실행하세요. 번역 실행 후 앱을 다시 빌드하거나 다시 시작하여 임베디드 JSON이 인식되도록 하세요. `ai-i18n-tools dashboard`은(는) 번역을 검토하기 위해 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

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
| `locales/ui-languages.json` | 도구용 언어 목록. 헬퍼는 `I18n.cs`에서 `BuiltInLocales`을(를) 사용합니다 | 아니요. `extract`이(가) 작성합니다 |

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

헬퍼의 `SourceLocale`는 구성의 `sourceLocale`과 같아야 합니다. `ai-i18n-tools-locales` 마커 사이에 있는 `BuiltInLocales`는 `init`가 스탬프된 목록입니다. `SupportedLocales`가 이를 읽습니다. `targetLocales`를 변경한 후 해당 배열을 업데이트하거나 새 `Locales` 배열을 `I18n.Configure`에 전달하십시오. 새 헬퍼가 필요할 때 일회용 디렉터리를 스캐폴드하십시오. 여기에서 `init`를 다시 실행하지 마십시오.

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

Avalonia, WPF 및 MAUI는 각각 자체 `MarkupExtension` 기본 클래스를 제공합니다. 애플리케이션 프로젝트의 한 가지 형태:

```csharp
public sealed class TrExtension : MarkupExtension
{
    public TrExtension(string text) { Text = text; }
    public string Text { get; }
    public override object ProvideValue(IServiceProvider serviceProvider) => I18n.T(Text);
}
```

형식화된 문장은 C# (`T("Saved to {0}", path)`)에 유지되며, 이는 추출기를 단일 리터럴에 유지합니다. 동일한 호출은 뷰 모델, 트레이 툴팁 및 대화 상자에서 작동합니다.

저장되고 표시되는 값은 저장된 값을 원본 언어로 유지합니다. 컨트롤이 빌드될 때 캡션을 번역하십시오. `N("Last 12 months")`는 정적 필드가 추출기가 보는 리터럴을 보유할 수 있도록 존재합니다. 정적 사전의 `T()`은 첫 번째 형식 로드 시 한 번 실행되며 해당 언어로 유지됩니다.

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

드라이 런을 다시 실행하십시오. 편집 내용이 없다고 표시되면 중지하고 프로젝트 테스트를 실행하십시오. 그대로 남아 있는 줄 (`await`, 원시 보간된 원시 문자열, 조건부 구멍, `ref` 또는 `out`, 리터럴이 없는 연결, `string.Format`에 전달된 `IFormatProvider`)은 수동으로 수정됩니다. 복수형처럼 보이는 구문은 `Tn`에 속합니다. 생성된 `I18n.cs`는 건너뜁니다. 보고서를 삭제하거나 git-ignore하십시오.

`--wrap`는 또한 표시되지 않은 XAML `Text`, `Header`, `Content` 및 다른 레이블 특성을 `{loc:Tr '…'}`로 표시하며, 이름이 `Text`, `Title` 또는 `Message`로 끝나는 C# 할당과 `MessageBox.Show`도 표시합니다. `--write`가 없으면 이는 감사입니다. 로그, 특성, `nameof`, 비교 또는 `Path` 호출은 편집하지 않습니다.

편집 내용이 없는 보고서는 래핑된 호출이 안전하다는 것을 의미합니다. 모든 사용자 대면 문장이 래핑되었다는 의미는 아닙니다. 일반 레이블, 반환된 문자열 및 요소 콘텐츠는 보이지 않습니다. 세부 정보: [안전하지 않은 호출 다시 작성](/ko/guide/ui-strings/dotnet#migrate).

<a id="step-4-add-a-language-switch"></a>
## 4단계: 언어 전환 추가

`SetLocale` 전에 문화권을 설정합니다. 그 호출 내에서 `LocaleChanged`이(가) 발생하기 때문입니다:

```csharp
var culture = CultureInfo.GetCultureInfo(code);
CultureInfo.CurrentUICulture = culture;
CultureInfo.CurrentCulture = culture;
I18n.SetLocale(code);
```

`I18n.SupportedLocales`에서 옵션을 빌드합니다. 각 행에는 `Code`, `NativeName`, `EnglishName`이(가) 있습니다. `T("Language")`(으)로 컨트롤에 레이블을 지정합니다. 선택 사항을 유지하고 첫 번째 `T` 전에 시작 시 복원합니다. `LocaleChanged`에서 뷰 모델 문자열에 대해 `PropertyChanged`(을)를 발생시키거나 텍스트를 복사한 컨트롤을 다시 빌드합니다. 프레임워크에 흐름 방향이 있으면 `I18n.IsRightToLeft(code)`에서 설정합니다.

콘솔 프로그램에는 위젯이 없습니다. `--lang <code>`(을)를 추가합니다(해당 이름이 비어 있으면 `-L`도 추가). `SupportedLocales`에 나열된 코드만 허용합니다. `AI_I18N_LANG`(을)를 읽지 마세요. 해당 변수는 ai-i18n-tools CLI 전용입니다.

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

| 예시 | 내용 |
| --- | --- |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `I18n.cs`의 xUnit 검사: 포함된 JSON, 문화권 대체, `{0}`, 복수형 |

이 디렉터리들은 도우미를 확인합니다. 이들은 번역할 앱이 아니며 API 키가 필요하지 않습니다. 해당 디렉터리의 `dotnet test`이(가) 검사를 실행합니다. 실제 앱은 이 페이지의 `init`부터 시작합니다.
