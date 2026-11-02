<a id="add-i18n-to-a-net-resourcemanager-app"></a>
# .NET ResourceManager 앱에 i18n 추가

이 페이지는 이미 `ResourceManager` 또는 ASP.NET `IStringLocalizer`으로 문자열을 로드하거나 로드할 예정인 .NET 애플리케이션을 위한 것입니다. 해당 로더를 유지합니다. ai-i18n-tools는 `T("…")` 및 `{loc:Tr '…'}`을(를) 읽고 메시지를 번역한 다음 해당 소스 문자열을 키로 사용하는 `.resx` 위성 어셈블리를 작성합니다. 도우미는 `init -t ui-dotnet-resx`에 의해 복사되는 `I18nResx.cs`입니다.

가장 빠른 방법은 이 페이지의 프롬프트를 코딩 에이전트에 제공하는 것입니다. 이는 구성을 리소스로 지정하고, 문자열을 래핑하며, 결과를 확인하고, 언어 전환 기능을 추가할 수 있습니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화합니다. 이는 API 키와 선택 사항이 필요하기 때문입니다. 또한 번역도 직접 실행합니다. 이는 계정에서 비용이 발생하고 `.resx` 파일을 다시 작성하기 때문입니다.

아직 리소스 파일이 없는 새로운 Avalonia, WPF, MAUI, WinForms 또는 콘솔 앱은 [.NET 앱에 i18n 추가](/ko/guide/add-i18n-to-dotnet)를 사용합니다. 해당 경로는 `I18n.cs` 및 임베디드 JSON을 추가합니다. 어떤 것이 적용되는지 확실하지 않습니까? 마지막에 [해당하지 않는 경우?](#not-your-case)를 참조하십시오.

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

프롬프트 전에 이를 한 번 실행합니다. 이는 구성과 `I18nResx.cs`을(를) 작성하고 위에서 선택한 공급자를 사용합니다.

```bash
ai-i18n-tools init -t ui-dotnet-resx -P openrouter
```

프로젝트 네임스페이스가 `init`이(가) `I18nResx.cs`에 인쇄하는 것이 아닌 경우 `--namespace`을(를) 전달합니다. 디렉터리에 `.csproj`이(가) 하나 있고 `--namespace`이(가) 없는 경우, `init`는 해당 파일의 `RootNamespace` 또는 프로젝트 파일 이름을 사용합니다. 그렇지 않으면 네임스페이스는 `AiI18n`입니다.

템플릿은 `ui.flatOutput`을(를) false로, `ui.resx`을(를) 다음으로 설정합니다:

| 필드 | 기본값 |
| --- | --- |
| `outputDir` | `Resources` |
| `baseName` | `SharedResource` |
| `writeNeutral` | true이므로 `SharedResource.resx`에 원본 텍스트가 포함됩니다 |
| `localeFormat` | `bcp47`이므로 독일어 파일은 `SharedResource.de.resx`이고 브라질 포르투갈어는 `SharedResource.pt-BR.resx`입니다 |
| `ingestExistingResx` | true |

해당 파일이 없는 경우 `init`은(는) `I18nResx.cs`을(를) 작성합니다. `ResourceBaseName`는 네임스페이스, 출력 폴더 및 점(.)으로 연결된 기본 이름(`MyApp.Resources.SharedResource`)입니다. 파일이 해당 폴더에 있는 경우 SDK는 해당 매니페스트 이름 아래에 resx를 포함합니다. 파일을 이동하는 경우 `ResourceBaseName`을(를) 일치하도록 변경하십시오. `init`는 `.csproj`을(를) 편집하지 않습니다. 위성 어셈블리는 빌드 시 `*.{culture}.resx`에서 생성됩니다. 해당 위성 어셈블리를 앱 옆에 배포하십시오.

`init`을(를) 한 번 실행합니다. 이는 매번 `ai-i18n-tools.config.json`을(를) 다시 작성하므로 두 번째 실행 시에는 사용자가 변경한 내용이 삭제됩니다. `I18nResx.cs`에 이미 마커 `ai-i18n-tools-i18n-cs`이(가) 포함되어 있는 경우, 프로젝트가 이미 초기화된 것이므로 이 단계를 건너뛰십시오. `init`는 기존 도우미를 덮어쓰지 않습니다.

그런 다음 `sourceLocale` 및 `targetLocales`을(를) 편집합니다. `sourceLocale`는 소스에 있는 문자열의 언어입니다. 모든 BCP-47 언어가 유효합니다. 스캐폴드는 `en`을(를) 사용합니다. 앱이 이미 로드하는 폴더 및 기본 이름으로 `ui.resx`을(를) 지정합니다(수동으로, 즉 [1단계](#step-1-point-the-config-at-your-resources)). `neutralFile`는 `LoginButton`과(와) 같은 레거시 이름을 소스 텍스트에 매핑하는 중립 resx입니다. 생략된 경우 해당 파일이 존재하면 `{outputDir}/{baseName}.resx`이(가) 사용됩니다.

동일한 `ui` 블록은 플랫 JSON도 작성할 수 있습니다. `flatOutput`을(를) 다시 true로 설정합니다. 두 출력 모두 하나의 카탈로그를 공유합니다. 이 템플릿은 `flatOutput`를 false로 두어 `.resx`만 작성되도록 합니다.

호출 모양 및 JSON 도우미: [.NET 애플리케이션](/ko/guide/ui-strings/dotnet). 다른 모든 구성 키: [구성](/ko/reference/configuration).

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 등)에서 프로젝트를 열고, 새 채팅을 시작한 다음 아래 프롬프트를 붙여넣으세요. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 예를 들어 언어 전환을 원하지 않는 등 제외하고 싶은 것이 있다면 같은 메시지에 명시하세요.

에이전트는 먼저 CLI, 구성 및 `I18nResx.cs`이(가) 존재하는지 확인하고, 하나라도 누락된 경우 지침과 함께 중지됩니다. 그런 다음 세 부분으로 작동합니다.

- 1부에서는 `ui.resx`을(를) 앱이 이미 로드하는 카탈로그로 지정하고 `ResourceBaseName`을(를) 확인합니다.
- 2부에서는 사용자 대면 문자열을 `T()` 및 `{loc:Tr '…'}`으로 래핑하고 명명된 키 제안을 수동으로 적용합니다.
- 3부에서는 `ResourceManager` 또는 `IStringLocalizer`에 유지되는 언어 전환 기능을 추가합니다.

아무것도 설치하거나 초기화하지 않으며, API 키를 읽거나 번역하지 않습니다. `.resx` 파일을 다시 작성하지 않습니다. 번역은 검토 후 단계이며, 사용자가 실행합니다.

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
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점. 래핑된 호출, 구성, 파일이 이동한 경우의 `ResourceBaseName` 및 언어 전환 기능이 변경되었을 것입니다. `.resx` 파일은 번역하기 전까지는 변경되지 않아야 합니다.
- `ai-i18n-tools.config.json`: `resx.outputDir` 및 `baseName`는 앱이 로드하는 카탈로그를 가리키고, `sourceRoots`는 애플리케이션 프로젝트를 다룹니다.
- `ResourceBaseName`은(는) SDK가 포함할 매니페스트 이름과 일치합니다.
- `ai-i18n-tools extract`은(는) 새 메시지를 나열하고 위성 어셈블리에 이미 있는 번역을 유지합니다.
- `migrate-dotnet-i18n`의 시뮬레이션 실행은 연기하기로 선택한 명명된 키 제안을 제외하고는 수정할 것이 남아있지 않음을 나열합니다. 해당 줄은 수정할 때까지 여전히 `Resources.LoginButton` 상태입니다.
- 테스트가 통과했으며, 앱은 원본 언어에서 동일하게 보입니다.
- 임시 스크립트나 `migrate-dotnet-i18n-report.md`가 남겨지지 않았습니다.

이 상태를 커밋하세요. `translate-ui`는 `.resx` 파일을 다시 작성하므로, 검토할 깨끗한 diff를 원할 것입니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 당신이 실행합니다. 당신의 API 키를 사용하고, 당신의 계정에서 비용이 발생하며, 당신의 `.resx` 파일을 다시 작성하므로, 먼저 커밋하세요.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`는 `translationModels`만 대체합니다. 동일한 순위는 `ai-i18n-tools dashboard`의 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다.

첫 번째 `translate-ui` 전에 용어집을 채우세요. `init`는 `glossary.userGlossary`를 `glossary-user.csv`에 연결하며 파일을 생성하지 않습니다. 파일이 없으면 `ai-i18n-tools glossary-generate`를 실행한 다음 도메인 용어를 추가하세요. 변경 없이 복사해야 하는 이름에는 **Force**를 사용하세요.

그런 다음 추출하고 번역합니다.

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
ai-i18n-tools status
```

`translate-ui`는 중립 파일과 대상 언어당 하나의 위성 파일을 작성합니다. 키는 원본 문자열입니다. `<comment>`는 컨텍스트와 첫 번째 원본 위치를 기록합니다. 위성 파일의 수동 편집은 다음 번역 전에 `extract`가 이를 수집하는 경우에만 유지되며, 이는 `.po` 파일과 동일한 계약입니다. 다음 실행 시 다시 생성되므로 이제부터 생성된 파일을 편집하지 마세요. 커밋하기 전에 첫 번째 diff를 검토하세요.

`type` 또는 `mimetype`(이미지 및 기타 바이너리)가 있는 항목은 건너뜁니다. 해당 문화권에 항목이 없을 때 `ResourceManager.GetString`는 중립 값을 반환합니다.

SDK가 새 위성 파일을 포함하도록 다시 빌드한 다음 앱을 다시 시작하세요.

<a id="check-one-language"></a>
### 한 언어 확인

하나의 대상 언어로 전환하고 래핑된 문자열이 있는 화면을 여세요. 원본 언어로 남아있는 텍스트는 래핑되지 않았거나, 적용되지 않은 명명된 키를 여전히 사용하거나, 위성 파일이 다시 빌드되지 않았습니다. `{0}`를 삭제하거나 이름을 변경하는 번역은 `FormatException`를 발생시키거나 값을 생략할 수 있습니다. `string.Format`는 원본 템플릿으로 폴백하지 않습니다. 코드를 의심하기 전에 해당 문장에 대한 위성 파일을 확인하세요.

<a id="keep-it-translated"></a>
## 번역 유지

원본 텍스트를 변경한 후 `ai-i18n-tools sync`(또는 `extract`를 실행한 다음 `translate-ui`)를 다시 실행하세요. 캐시는 새롭거나 변경된 문자열만 모델로 전송됨을 의미합니다. 번역이 어긋나지 않도록 CI에서 실행하세요. 번역 실행 후 다시 빌드하여 위성 파일이 다시 포함되도록 하세요. `ai-i18n-tools dashboard`는 번역을 검토하기 위해 [Translation Dashboard](/ko/guide/translation-dashboard/)를 엽니다.

`purge-locale`은(는) `SharedResource.<culture>.resx`을(를) 삭제하고 `SharedResource.resx`을(를) 남깁니다.

복사된 `I18nResx.cs`를 새로 고치려면, 임시 디렉터리에 동일한 템플릿을 스캐폴드하고 교체하려는 생성된 파일만 복사하세요. 도우미를 업그레이드하기 위해 앱에서 `init`를 다시 실행하지 마세요.

동일한 실행에서 `README.md`를 번역하려면, `--with-readme`로 스캐폴드합니다 (또는 기존 구성에 블록을 추가합니다). [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르십시오. 각 단계는 프롬프트의 한 부분과 일치합니다. 마지막에는 여전히 [CLI를 설치](#install-and-choose-a-provider)하고, [프로젝트를 초기화](#initialise-the-project)하며, [번역](#choose-models-and-translate)해야 합니다.

1. [구성을 리소스에 연결](#step-1-point-the-config-at-your-resources)합니다.
2. `T()` 또는 `{loc:Tr '…'}`에서 [문자열을 래핑](#step-2-wrap-strings)합니다.
3. [명명된 리소스 키를 적용](#step-3-apply-named-resource-keys)합니다.
4. [런타임에 언어를 전환](#step-4-switch-language-at-runtime)합니다.

<a id="step-1-point-the-config-at-your-resources"></a>
## 1단계: 구성을 리소스에 연결

템플릿은 이 형태를 작성합니다. 폴더와 기본 이름을 앱이 이미 로드하는 카탈로그로 변경하세요.

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

프로젝트에 대해 다음 네 가지를 확인합니다.

- `outputDir` 및 `baseName`는 중립 파일과 위성 파일이 이미 있는 곳입니다. 독일어는 `SharedResource.de.resx`입니다. `localeFormat`가 `bcp47`일 때 브라질 포르투갈어는 `SharedResource.pt-BR.resx`입니다.
- 해당 중립 파일이 `{outputDir}/{baseName}.resx`이 아닐 때 `neutralFile`이 설정됩니다. 수집은 레거시 이름(`LoginButton`)을 중립 값(`Sign in`)을 통해 매핑합니다. 독일어 `LoginButton` 값은 원본 문자열 `Sign in` 아래에 저장됩니다.
- `I18nResx.cs`의 `ResourceBaseName`는 네임스페이스, 출력 폴더, 그리고 점으로 연결된 기본 이름입니다. 파일이 이동할 때 상수를 이동하세요. 도우미의 나머지는 그대로 두세요.
- `sourceRoots`는 애플리케이션 프로젝트이며, `"."`가 아닙니다.

일반 문자열의 resx 이름은 원본 텍스트입니다: `Sign in`, `Saved to {0}`, 따옴표나 앰퍼샌드를 포함하는 값. 컨텍스트는 컨텍스트와 원본 사이에 U+2404를 사용합니다. resx에는 복수형이 없습니다. 각 CLDR 형태는 `{singular}[{form}]`라는 이름의 자체 항목입니다. `Tn`는 `.po` 작성자와 동일한 규칙으로 형태를 선택합니다. 구분 기호나 복수형 접미사를 입력하지 않습니다.

`ai-i18n-tools extract`로 확인하세요. 카탈로그는 중립 파일에서 수집된 문자열을 나열해야 합니다.

<a id="step-2-wrap-strings"></a>
## 2단계: 문자열 래핑

`extract`는 리터럴이 `T()`, `Tn`, `Tp`, `N`, 또는 `{loc:Tr '…'}`로 전달될 때만 문자열을 기록합니다. [JSON 도우미](/ko/guide/add-i18n-to-dotnet#step-2-wrap-strings)와 동일한 형태가 적용됩니다. 자리 표시자는 `{0}`이며, `{name}`가 아닙니다.

```csharp
T("Sign in")
T("Saved to {0}", path)
Tn("1 sample", "{0} samples", count)
Tp("menu", "Open")
```

`IStringLocalizer`은(는) 전달하는 이름을 조회하고 리소스가 없을 때 해당 이름을 반환합니다. 기본 추출기 이름은 `T`, `Tn`, `Tp`, `N`, `Tr`, `Loc`입니다. `_localizer["Sign in"]`와 같은 호출은 `_localizer`이(가) `ui.uiExtractor.funcNames`에 추가될 때까지 보이지 않습니다. `T("Sign in")` 또는 `I18nResx.T("Sign in")`을(를) 호출하는 데 추가 이름이 필요하지 않습니다.

XAML은 `{loc:Tr '…'}`을(를) 사용합니다. 요소 내용은 추출되지 않습니다. `{Binding}`과(와) `{StaticResource}`는 그대로 두십시오.

로그, JSON 키, 파일 이름, `nameof` 및 표시되지 않는 예외 텍스트는 그대로 두십시오. 저장된 값은 원본 언어로 유지됩니다. 컨트롤의 캡션을 번역하십시오.

안전하지 않은 호출(`T($"…")`, 연결, `T` 내의 `string.Format`)은(는) `Resources.LoginButton`와 같은 레거시 이름과 함께 다음 단계의 보고서입니다.

<a id="step-3-apply-named-resource-keys"></a>
## 3단계: 명명된 리소스 키 적용

`migrate-dotnet-i18n`은(는) `--write`을(를) 전달할 때까지 드라이 런입니다. 조회 전에 빌드된 `T`의 인수를 다시 작성하며, [래핑된 호출 확인](/ko/guide/add-i18n-to-dotnet#step-3-check-wrapped-calls)과 동일한 편집입니다.

`extract`이(가) 중립 `.resx`을(를) 수집하면 보고서에 명명된 키 섹션도 추가됩니다.

```text
- MainWindow.axaml.cs:40 Resources.LoginButton → T("Sign in")
```

해당 목록은 사용자가 적용할 것입니다. 이 명령은 해당 줄을 편집하지 않습니다. `--write`도 마찬가지입니다. 호출을 `T("Sign in")`(으)로 변경한 후, `extract`를 다시 실행하십시오.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-dotnet-i18n
```

`migrate-dotnet-i18n-report.md`을(를) 읽으십시오. 안전하지 않은 호출 편집이 올바르게 보이면:

```bash
ai-i18n-tools migrate-dotnet-i18n --write
ai-i18n-tools extract
```

드라이 런을 다시 실행하십시오. 안전하지 않은 호출 편집이 나열되지 않으면 중지하십시오. 아직 적용하지 않은 명명된 키는 제안 목록에 남아 있습니다. 보고서를 삭제하거나 git-ignore하십시오. 이 단계에서 `.resx` 파일을 편집하지 마십시오.

<a id="step-4-switch-language-at-runtime"></a>
## 4단계: 런타임에 언어 전환

`T`은(는) `CultureInfo.CurrentUICulture`을(를) 읽습니다. `I18nResx.SetLocale`는 해당 문화권과 `CurrentCulture`을(를) 설정한 다음 `LocaleChanged`를 발생시킵니다. `Tn`에 대해 저장하는 로케일은 정적이므로, 동시 요청을 처리하는 서버는 `SetLocale`을(를) 사용자별 스위치로 사용해서는 안 됩니다.

<a id="aspnet-core"></a>
### ASP.NET Core

`IStringLocalizer`은(는) 요청 로컬입니다. 도구가 작성하는 resx를 가리키십시오. 빈 클래스는 형식 인수일 뿐입니다. 매니페스트 기본 이름은 `ResourceBaseName`과(와) 일치해야 합니다.

```csharp
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

public sealed class SharedResource
{
}
```

Razor 페이지 또는 서비스에서 `extract`이(가) 리터럴을 볼 수 있도록 `T`을(를) 호출하십시오. 호출 사이트에서 이미 사용 중인 경우 기존 `IStringLocalizer<SharedResource>`를 유지하십시오. 조회가 인덱서에 남아 있으면 해당 수신자의 이름을 `ui.uiExtractor.funcNames`에 추가하십시오.

```csharp
public string Label => T("Sign in");
```

`IStringLocalizer`에는 복수 또는 컨텍스트 매개변수가 없습니다. 확장은 동일한 위성을 읽는 `I18nResx`을(를) 호출할 수 있습니다. 이를 ASP.NET 프로젝트에 넣으십시오. `I18nResx.cs`는 `Microsoft.Extensions.Localization`을(를) 참조하지 않으므로, 콘솔 또는 데스크톱 프로젝트는 해당 패키지를 사용하지 않습니다.

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

다음 순서로 요청 문화권을 선택하십시오: 방문자의 명시적 선택 (`?lang=` 또는 양식 게시), 이를 기억하는 쿠키, `Accept-Language` 헤더, 그런 다음 원본 로케일. `sourceLocale` 또는 `targetLocales`에 없는 코드는 무시하십시오. `pt-BR`는 위성 이름입니다. `pt-br`를 보내는 헤더는 `CurrentUICulture`을(를) 할당하기 전에 해당 이름과 일치해야 합니다.

<a id="desktop-and-console"></a>
### 데스크톱 및 콘솔

창이 빌드되기 전에 저장된 문화권을 복원하고, `I18nResx.SetLocale`을(를) 호출하고, `LocaleChanged`에서 보이는 텍스트를 새로 고치십시오. `sourceLocale`와 `targetLocales`으로 메뉴를 빌드하십시오. `T("Language")`(으)로 레이블을 지정하십시오. 흐름 방향은 `CultureInfo.TextInfo.IsRightToLeft`에서 옵니다. 이 도우미에는 `SupportedLocales` 목록이 없습니다.

콘솔 프로그램에는 위젯이 없습니다. `--lang <code>`을(를) 추가하고 (해당 이름이 비어 있으면 `-L`도 추가하십시오), 그런 다음 첫 번째 `T` 전에 `SetLocale`를 호출하십시오. `AI_I18N_LANG`를 읽지 마십시오.

프로그램이 사람이 읽을 텍스트를 표시하지 않을 때는 이 단계를 건너뛰세요.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#choose-models-and-translate)에서 계속하세요.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 현재 코드 | 읽기 |
| --- | --- |
| 아직 `.resx` 및 `IStringLocalizer` 없음 | [.NET 앱에 i18n 추가](/ko/guide/add-i18n-to-dotnet) |
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
| [dotnet-resx](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-resx) | `I18nResx.cs`의 xUnit 검사: 소스 문자열 키, 따옴표, 컨텍스트, 복수형, 실제 위성 어셈블리 |
| [dotnet-console](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/dotnet-console) | `ResourceManager`에 없는 앱을 위한 JSON 도우미 |

이 디렉터리들은 헬퍼를 확인합니다. 번역할 앱이 아니며 API 키가 필요하지 않습니다. `dotnet test`는 `dotnet-resx` 디렉터리 내에서 위성 검사를 실행합니다. 실제 앱은 이 페이지에서 `init`부터 시작합니다. `npx degit`를 사용하여 하나를 복사하거나, GitHub 릴리스에서 `ai-i18n-tools-dotnet-examples.zip`를 다운로드하세요. 해당 zip 파일에는 프로젝트가 컴파일하는 `assets/dotnet`도 포함되어 있습니다. 명령: [예시](/ko/examples#net-examples).
