<a id="add-i18n-to-a-python-app"></a>
# Python 앱에 i18n 추가하기

이 페이지에서는 단일 언어를 사용하는 Python 애플리케이션에 ai-i18n-tools를 사용하여 로케일을 추가하는 방법을 설명합니다. 이 방법은 `ui-python` 템플릿, 작은 `i18n.py` 헬퍼, 그리고 번역 JSON 파일을 사용합니다. 이 방법은 Streamlit, FastAPI, Flask, 데스크톱 앱 및 스크립트에 적합합니다.

가장 빠른 방법은 이 페이지의 프롬프트를 코딩 에이전트에 제공하는 것입니다. 에이전트는 구성을 설정하고, 문자열을 래핑하고, 결과를 확인하며, 언어 메뉴를 추가할 수 있습니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화해야 합니다. 이는 API 키와 선택 사항이 필요하기 때문입니다. 또한 번역은 사용자 계정에서 비용이 발생하므로 직접 실행해야 합니다.

Django, Flask-Babel 카탈로그 또는 GNU gettext를 사용하고 있으며 해당 호출을 유지하고 싶으신가요? 대신 [Django / Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext)를 사용하세요. 이 방법은 `gettext`를 유지하고 헬퍼 없이 `.po` 및 `.mo` 파일을 작성합니다. 어떤 방법이 적용되는지 확실하지 않으신가요? 마지막에 있는 [해당하지 않으시나요?](#not-your-case)를 참조하세요.

흐름:

1. [CLI 설치 및 공급자 선택](#install-and-choose-a-provider).
2. `init`로 [프로젝트 초기화](#initialise-the-project).
3. [에이전트 프롬프트 실행](#run-the-agent-prompt).
4. [결과 검토](#review-the-result).
5. [모델 선택 및 번역](#choose-models-and-translate) 후 한 언어를 확인합니다.
6. [번역 유지](#keep-it-translated).

변경 사항을 직접 적용하고 싶거나 프롬프트가 무엇을 하는지 알고 싶으십니까? [수동으로 수행](#do-it-by-hand)은 동일한 단계를 하나씩 안내합니다.

<a id="install-and-choose-a-provider"></a>
## 설치 및 공급자 선택

이 부분은 에이전트가 아닌 사용자가 수행합니다. 설치 프로그램은 사용자의 시스템을 변경하며, API 키는 프롬프트가 아닌 셸에 속하는 비밀 정보입니다.

머신에 이미 Node.js `>=22.16.0`가 있는 경우 npm 패키지를 사용하십시오([설치](/ko/guide/installation)). Python 프로젝트의 경우 독립 실행형 실행 파일(Node.js 없음)을 설치하십시오.

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

그런 다음 공급자를 선택하고 번역을 실행할 셸에 해당 API 키를 설정합니다. 예를 들어, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama는 키가 필요 없습니다. 다른 사전 설정: [내장 공급자](/ko/guide/providers-and-models#built-in-providers). 다음 단계에서 `init`에 전달해야 하므로 공급자 이름을 기록해 두세요. 에이전트는 모델 호출을 하지 않는 명령만 실행하므로 키가 필요 없습니다. 키는 나중에 [번역](#choose-models-and-translate)할 때 사용합니다.

<a id="initialise-the-project"></a>
## 프로젝트 초기화

이 작업은 프롬프트 전에 한 번 실행합니다. 이 작업은 구성과 `i18n.py` 헬퍼를 작성하며, 위에서 선택한 공급자를 사용합니다.

이 페이지는 하나의 템플릿인 `ui-python`를 사용합니다. 이 템플릿은 구성, `i18n.py` 헬퍼, 그리고 JSON 카탈로그를 작성합니다. 다음 앱에 적합합니다.

| 앱 | 참고 사항 |
| --- | --- |
| Streamlit | 언어 메뉴는 앱에 몇 줄의 코드가 필요합니다. [언어 전환 추가](#step-4-add-a-language-switch)를 참조하세요. |
| FastAPI | 로케일은 요청별로 설정됩니다. |
| Flask | 플랫 JSON 카탈로그. `translations/`의 Flask-Babel 카탈로그의 경우 [gettext 페이지](/ko/guide/add-i18n-to-django-gettext)를 사용하세요. |
| Pyramid | Flask와 동일한 연결 방식 |
| 데스크톱 앱 (Tkinter, PyQt, PySide) | 로케일 변경 후 표시되는 텍스트를 다시 빌드합니다. |
| PyWebView | 템플릿은 Python 셸을 다룹니다. HTML 페이지는 별도로 번역하세요. |
| 명령줄 도구 및 스크립트 | 가장 간단한 경우 |

선택한 공급자(이 예시에서는 Cheaper Inference)로 init을 실행합니다.

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

그런 다음 `ai-i18n-tools.config.json`에서 `sourceLocale` 및 `targetLocales`를 편집합니다. `sourceLocale`는 소스에 있는 문자열의 언어입니다. 모든 BCP-47 언어가 유효하며, 예시에서는 종종 `en`를 사용합니다.

`init`를 한 번 실행합니다. 이 명령은 매번 `ai-i18n-tools.config.json`를 다시 작성하므로, 두 번째 실행 시에는 사용자가 변경한 내용이 사라집니다. 만약 `i18n.py`에 이미 마커 `ai-i18n-tools-i18n-py`가 포함되어 있다면, 프로젝트는 이미 초기화된 상태이므로 이 단계를 건너뛰세요.

`init`는 `ui.sourceRoots`를 `"."`로 설정하므로, `extract`는 전체 저장소(테스트, 스크립트, 문서)를 스캔합니다. 프롬프트는 이를 애플리케이션 코드로 좁힙니다(수동으로, 즉 [1단계](#place-the-helper) 참조).

프레임워크 연결: [Python 통합](/ko/guide/integrations/python). 호출 형태 및 카탈로그 레이아웃: [Python 애플리케이션](/ko/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 등)에서 프로젝트를 열고, 새 채팅을 시작한 다음 아래 프롬프트를 붙여넣으세요. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 언어 메뉴를 제외하는 등 제외하고 싶은 내용이 있다면 같은 메시지에 명시하세요.

에이전트는 먼저 CLI, 구성 및 `i18n.py`이(가) 존재하는지 확인하고, 이들 중 하나라도 없으면 지침과 함께 중단됩니다. 그런 다음 세 부분으로 작동합니다.

- 1부에서는 저장소가 코드를 보관하는 위치에 `i18n.py` 및 `locales/`을(를) 배치하고, 구성이 이들을 가리키도록 합니다.
- 2부에서는 사용자 대면 문자열을 `t()` 및 `_()`으로 래핑하고, `extract`을(를) 실행하며, `migrate-python-i18n`을(를) 사용하여 래핑된 호출을 확인합니다.
- 3부에서는 언어 메뉴 또는 CLI 언어 옵션과 환경 로케일을 추가합니다.

에이전트는 아무것도 설치하거나 초기화하지 않으며, API 키를 읽거나 번역하지 않습니다. 번역은 검토 후 단계이며, 사용자가 실행합니다.

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## 결과 검토

에이전트는 보고서로 끝납니다. 번역하기 전에 확인하세요.

- 차이점. 래핑된 텍스트는 관련 없는 재포맷 없이 이전과 동일하게 읽혀야 합니다. `git diff --stat`은(는) 변경된 양을 보여줍니다.
- 보고서에서 건너뛴 문자열 및 모호한 경우: 단일 문자열로 남겨진 복수형, 저장된 값과 캡션으로 사용된 단일 단어, 번역된 조각으로 구성된 문장. 이들은 수동으로 결정하십시오.
- `ai-i18n-tools extract`이(가) 깨끗하게 실행되고, `strings.json`이(가) 예상하는 폴더에 있습니다.
- 테스트가 통과하고, 앱이 원본 언어에서 동일하게 보입니다.
- 임시 스크립트나 `migrate-python-i18n-report.md`이(가) 남겨지지 않았습니다.

에이전트가 놓친 문자열은 나중에 원본 언어로 남아 있는 텍스트로 나타납니다. [2단계](#wrap-strings)에는 래핑되지 않은 텍스트를 출력하는 선택적 스크립트가 있습니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 사용자가 실행합니다. 이 부분은 사용자의 API 키를 사용하며 계정에서 비용이 발생합니다.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply`은(는) `translationModels`만 대체합니다. 출력 가격이 제한을 초과하는 모델을 제외하려면 `--max-output-price`을(를) 사용하십시오. GUI를 선호하는 경우, `ai-i18n-tools dashboard`을(를) 사용하여 [모델](/ko/guide/translation-dashboard/models)을(를) 선택하십시오.

그런 다음 추출하고 번역합니다.

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract`은(는) `strings.json` 및 `ui-languages.json`을(를) 작성합니다. `translate-ui`은(는) 대상 언어당 하나의 JSON 파일을 작성합니다. 생성된 파일은 편집하지 마십시오.

`t()`은(는) 로케일 JSON에서 원본 문장을 조회합니다. `strings.json`의 ID는 조회 키가 아닙니다. 파일이 없거나 키가 없으면 원본 문장을 반환합니다. 도우미는 프로세스를 위해 로드된 JSON을 메모리에 유지하며, 첫 번째 조회 시 파일이 없으면 빈 맵을 포함하므로 `translate-ui` 후에 앱을 다시 시작하십시오.

<a id="check-one-language"></a>
### 한 언어 확인

앱을 다시 시작하고, 하나의 대상 언어로 전환한 다음, 몇 개의 래핑된 문자열이 있는 페이지를 엽니다. 에이전트가 추가한 언어 메뉴를 사용하거나, 로케일을 수동으로 설정하십시오. 여전히 원본 언어로 되어 있는 텍스트는 래핑되지 않았거나, 가져오기 시점에 실행되거나, `locales/<code>.json`에 항목이 없는 경우입니다. 코드를 의심하기 전에 JSON에서 해당 문장을 확인하십시오.

<a id="keep-it-translated"></a>
## 번역 유지

원본 텍스트를 변경한 후 `ai-i18n-tools sync`(또는 `extract` 다음 `translate-ui`)을(를) 다시 실행하십시오. 캐시는 새롭거나 변경된 문자열만 모델로 전송됨을 의미합니다. 번역이 벗어나지 않도록 CI에서 실행하십시오. 번역 실행 후 앱을 다시 시작하여 JSON을 다시 로드하도록 하십시오. `ai-i18n-tools dashboard`은(는) 번역을 검토하기 위해 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

동일한 실행에서 `README.md`를 번역하려면, `--with-readme`로 스캐폴드합니다 (또는 기존 구성에 블록을 추가합니다). [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르십시오. 각 단계는 프롬프트의 한 부분과 일치합니다. 마지막에는 여전히 [CLI를 설치](#install-and-choose-a-provider)하고, [프로젝트를 초기화](#initialise-the-project)하며, [번역](#choose-models-and-translate)해야 합니다.

1. 이 저장소가 코드를 보관하는 위치에 [도우미와 카탈로그를 배치](#place-the-helper)합니다.
2. `t()` 또는 `_()`에 [문자열을 래핑](#wrap-strings)합니다.
3. `migrate-python-i18n`을(를) 사용하여 [래핑된 호출을 확인](#step-3-check-wrapped-calls)합니다.
4. [언어 전환을 추가](#step-4-add-a-language-switch)합니다.

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## 1단계: 도우미 및 카탈로그 배치

`init`은(는) 저장소 루트에 다음을 작성합니다.

| 파일 | 내용 | 편집 여부? |
| --- | --- | --- |
| `i18n.py` | 코드가 가져오는 도우미(`t`, `_`, `set_locale`) | 아니요. 생성됩니다 |
| `locales/strings.json` | 추출 캐시. 앱은 이를 읽지 않습니다 | 아니요. 추출기가 생성합니다 |
| `locales/<code>.json` | 앱이 로드하는 번역, 언어당 하나의 파일 | 아니요. `translate-ui`이(가) 작성합니다 |
| `locales/ui-languages.json` | 언어 메뉴를 위한 언어 목록 | 아니요. 추출기가 생성합니다 |

`i18n.py`는 자신이 있는 폴더에서 `locales/`을(를) 로드합니다. 헬퍼와 `locales/` 폴더를 함께 이동하고, `i18n.py` 내부의 경로는 변경하지 마세요.

| 저장소 | 위치 |
| --- | --- |
| 저장소 루트에 있는 스크립트 하나 | `init`가 작성한 위치에 `i18n.py`와 `locales/`을(를) 그대로 두세요 |
| `src/` 레이아웃을 포함하는 패키지 | 둘 다 패키지 안으로, 가져오는 코드 옆으로 이동하세요 |

예시: `src/mypkg/` 아래의 설치 가능한 패키지 `mypkg`는 `src/mypkg/i18n.py`와 `src/mypkg/locales/`을(를) 유지합니다.

새 위치에 맞게 구성을 업데이트하세요:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots`는 `extract`이(가) 스캔하는 폴더입니다. 테스트 및 데이터 파일이 카탈로그에 포함되지 않도록 애플리케이션 패키지에 보관하세요. 언어 목록 경로인 `languagesManifestPath`는 설정되지 않은 경우 `flatOutputDir`을(를) 따릅니다. 구성에서 이미 설정되어 있다면, 일치하도록 변경하세요.

선택한 모듈 경로에서 `t`을(를) 가져오세요: 저장소 루트의 `from i18n import t` 또는 패키지 내부의 `from mypkg.i18n import t`.

앱이 설치되거나 컨테이너에 배포될 때, 로케일 JSON은 패키지와 함께 이동해야 합니다. 패키지 데이터에 추가하세요 (패턴은 패키지 디렉터리에 상대적입니다):

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

`ai-i18n-tools extract`(으)로 확인하세요. 카탈로그는 새 `locales/` 폴더에 나타나야 합니다.

<a id="step-2-wrap-strings"></a>
## 2단계: 문자열 래핑

`extract`는 `t()` 또는 `_()`에 전달되는 리터럴인 경우에만 문자열을 기록합니다. 생성된 모듈에서 가져오세요.

먼저 카탈로그 항목을 찾은 다음, 보간하세요:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

이들은 조회 전에 서식을 실행하므로 추출기가 안전하지 않다고 표시합니다. [다음 단계](#step-3-check-wrapped-calls)에서 이들을 찾습니다:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

사람이 보는 텍스트를 감싸세요: 위젯 레이블, 페이지 제목, 캡션, UI에 표시되는 오류, 진행률 표시줄, 유효성 검사 메시지, 그리고 몇 개의 숫자를 포함하는 단락. 보간된 숫자가 있는 단락도 여전히 하나의 `t()` 호출입니다. 플레이스홀더는 `{name}`, `{price:,.2f}` 또는 `{rate:.2%}`과(와) 같은 이름입니다. `rate=row.rate`을(를) 전달하세요. `{row.rate:.2%}`와 같은 플레이스홀더는 거부됩니다.

원본 문구를 그대로 두세요. 번역이 누락되면 해당 문장이 반환되므로 앱은 원본 언어로 동일하게 유지됩니다.

프로그램이 일치시키거나 로깅하는 텍스트는 건너뛰세요: SQL, 정규식, 파일 헤더, 로거 라인, CSS, 위젯 키, 열거형 코드, 그리고 모델에 보내는 프롬프트. 값이 저장되고 표시되는 경우 (옵션이 코드에서 비교되는 선택 상자), 저장된 값은 원본 언어로 유지하고 레이블은 `format_func`(으)로 번역하세요.

`t()`는 가져오기 시점에 한 번 실행되며 해당 모듈이 다시 가져올 때까지 원본 언어를 유지합니다. 위젯이 빌드될 때 `t()`을(를) 호출하세요.

<a id="find-unwrapped-strings"></a>

여러 단계를 거쳐 작업하세요: `t()` 또는 `_()`의 인수가 아닌 리터럴을 나열하고, 사용자에게 표시되는 것을 감싼 다음, 다시 나열하세요. 아래 스크립트는 선택 사항입니다. 이 스크립트는 f-string과 `+`(으)로 결합된 텍스트를 포함하여 후보를 출력합니다. 독스트링, SQL, 공백 없는 텍스트는 건너뛰므로 `Overview`와 같은 짧은 레이블도 여전히 확인해야 합니다. 완료되면 삭제하세요. 파일을 다시 작성하는 스크립트는 초안입니다: 기존의 빈 줄을 유지하고, 새 가져오기를 프로젝트의 다른 가져오기와 함께 배치하고, 프로젝트의 포맷터를 실행하고, 유지하기 전에 차이점을 검토하세요.

<details>
<summary>선택 사항: 감싸지지 않은 문자열 나열</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## 3단계: 래핑된 호출 확인

이 단계는 코드가 카탈로그 조회 전에 문자열을 포맷하는 호출을 포함할 때 사용하십시오. 이는 이전 래핑 방식과 에이전트 슬립에서 흔히 볼 수 있습니다:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n`은(는) 이를 먼저 발생하는 조회로 다시 작성합니다. 두 번째 실행은 아무것도 변경하지 않습니다.

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

`st.write(f"Hello, {name}!")`와 같은 일반 문자열은 그대로 유지됩니다. 이를 래핑하는 것은 [문자열 래핑](#wrap-strings)입니다. 만약 `extract`이 깨끗하고 코드가 위 세 가지 형태 중 어느 것도 가지고 있지 않다면, 다시 작성할 것이 없습니다.

`extract` 다음에, 그리고 `translate-ui` 전에 실행하십시오. 따라서 카탈로그는 f-string을 키로 저장하지 않습니다.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

이 명령어는 `--write`를 전달할 때까지 드라이 런입니다. 이것은 `migrate-python-i18n-report.md`을(를) 작성합니다. 해당 보고서를 읽으십시오. 수정이 올바르게 보이면:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

드라이 런을 다시 실행하십시오. 수정 사항이 없다고 표시되면 중지하고, 프로젝트 테스트를 실행하십시오.

명령어가 그대로 두는 줄(예: `{value=}`와 같은 디버그 필드, 중첩된 포맷 사양)은 보고서에 나열됩니다. 수동으로 수정하고 드라이 런을 다시 실행하십시오. 생성된 `i18n.py`은(는) 건너뜁니다. 보고서는 빌드 아티팩트입니다: 삭제하거나 git-ignore하십시오.

수정 사항이 없는 보고서는 래핑된 호출이 안전하다는 의미입니다. 그것이 모든 사용자 대면 문장이 래핑되었다는 의미는 아닙니다. [래핑되지 않은 리터럴 목록](#find-unwrapped-strings)이 이를 확인하는 방법입니다.

선택적 `--report <path>`은(는) 보고서 경로를 변경합니다. 선택적 `--ui-block`은(는) 스캔을 하나의 UI 블록으로 제한합니다.

<a id="step-4-add-a-language-switch"></a>
## 4단계: 언어 전환 추가

모든 프레임워크에는 다음 네 가지가 필요합니다:

1. 각 요청, 스크립트 실행 또는 창 이벤트 시작 시 로케일을 선택하고, 첫 번째 `t()` 전에 `set_locale`을(를) 호출합니다.
2. `ui-languages.json` (`get_ui_languages()`)에 나열된 언어만 허용하고, 느슨하게 일치시킵니다. 브라우저는 `pt-br`를 보내는 반면, 카탈로그는 `pt-BR`입니다.
3. `get_ui_languages()`으로(부터) 빌드된 선택기를 제공합니다.
4. 선택을 기억합니다.

`?lang=pt-BR`을(를) 열어도 앱이 읽을 때까지는 아무것도 하지 않습니다. [에이전트 프롬프트](#run-the-agent-prompt)는 사용자 인터페이스가 있는 앱에 대해 이 모든 것을 수행하며, 자체적으로 프레임워크를 파악합니다. 아래 섹션에서는 Streamlit, FastAPI, Flask, Tkinter에 대한 결과를 보여줍니다. 다른 프레임워크도 동일한 규칙을 따릅니다.

<a id="streamlit"></a>
### Streamlit

Streamlit 스크립트는 모든 상호 작용에서 다시 실행되므로, 로케일은 모든 실행 시 스크립트 상단에서 선택됩니다. 순서:

1. 이전 실행에서 선택기 값을 읽고, 그 다음 `?lang=`, 그 다음 저장된 로케일을 읽습니다.
2. 해당 코드로 `set_locale`을(를) 호출하고, `st.set_page_config` 전에 호출합니다.
3. `st.set_page_config(page_title=t("…"))`을(를) 호출합니다.
4. 선택기를 그립니다. 변경 시 코드를 저장하고, `?lang=`를 설정하고, `st.rerun()`합니다.

사용자가 선택하면 선택기 값이 우선합니다. `?lang=`은(는) 해당 값이 존재하기 전에, 새로운 방문 시 적용됩니다. 메뉴는 `i18n.py`이(가) 아닌 앱에 있으므로, 해당 레이블은 `t("Language")`일 수 있습니다. 로그인 페이지를 포함하여 전환되어야 하는 모든 화면에 표시하십시오.

<details>
<summary>위젯 코드</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

[헬퍼 및 카탈로그 배치](#place-the-helper)에서 `from i18n import …`을(를) 패키지 경로로 변경하십시오. 다른 모든 위젯에 고정된 `key`을(를) 부여하고, 위젯이 빌드될 때 `t()`을(를) 호출하십시오. 가져오기 시점에 계산된 레이블은 전환 후에도 원본 언어로 유지됩니다. 나중에 페이지 제목이 비교될 때, 양쪽을 래핑하십시오: `nav.title != t("Forecast settings")`, 왜냐하면 `nav.title`는 이미 번역되었기 때문입니다.

`i18n.py`의 `streamlit_language_selector()`은(는) 제목이 일반 문자열인 짧은 스크립트에 충분합니다. 위젯이 그려질 때 `set_locale`을(를) 호출하므로, 그 위에 번역된 `page_title`은(는) 해당 실행 동안 이전 언어로 유지되고, 해당 레이블은 영어로 유지됩니다. `examples/python-streamlit`을(를) 참조하십시오.

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask, 및 Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### 요청에 대한 로케일 선택

웹 앱은 다음 순서로 언어에 대한 세 가지 소스를 가집니다: 방문자의 명시적 선택 (`?lang=`), 이를 기억하는 쿠키, 그리고 브라우저의 `Accept-Language` 헤더. 소스 언어는 폴백입니다.

`set_locale`는 주어진 것을 검증하거나 정규화하지 않습니다. `pt-br` 또는 `pt`를 보내는 브라우저는 카탈로그 파일이 `pt-BR.json`이므로 소스 언어를 자동으로 받게 됩니다. 아래 모듈은 매칭을 수행하고 `ui-languages.json`에 없는 코드는 무시합니다. 이를 `i18n.py` 옆에 저장하고, 미들웨어 또는 훅에서 임포트하십시오 (`i18n.py`가 패키지 내에 있을 때는 패키지 경로를 사용하십시오).

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

HTTP 미들웨어에서 로케일을 선택하십시오. `set_locale`에서 토큰을 유지하고 `finally`에서 재설정하여 동시 요청이 각자의 언어를 유지하도록 합니다. 미들웨어는 또한 `?lang=`가 있을 때 쿠키를 저장하고, 캐시가 언어별로 하나의 복사본을 유지하도록 `Content-Language` 및 `Vary`를 보냅니다. 라우트는 평소와 같이 `t()` 및 `_()`를 호출합니다. HTML 페이지의 경우, 템플릿 환경에 헬퍼를 한 번 추가하십시오.

<details>
<summary>FastAPI 미들웨어 및 템플릿</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

JSON만 반환하는 API는 메뉴가 필요 없습니다. 클라이언트는 `Accept-Language` 또는 `?lang=`을 보냅니다. 미들웨어가 반환된 후 빌드된 텍스트(예: 백그라운드 작업 중 또는 스트리밍 응답이 전송되는 동안)는 재설정 후에 실행될 수 있습니다. 응답을 반환하기 전에 빌드하십시오.

<a id="flask"></a>
#### Flask

Flask는 각 작업에 대한 훅을 가집니다. `before_request`는 로케일을 선택하고 토큰을 유지하며, `after_request`는 쿠키를 저장하고, `teardown_request`는 로케일을 재설정하며, 컨텍스트 프로세서는 템플릿에 `t`, `_`, `get_locale`, `get_ui_languages`, 및 `get_direction`을 제공합니다. Pyramid는 `NewRequest` 구독자와 동일한 형태를 사용합니다.

<details>
<summary>Flask 훅</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### 템플릿의 언어 메뉴

FastAPI의 `Jinja2Templates`와 Flask는 모두 이를 렌더링합니다. `?lang=`을 포함하는 링크는 페이지를 유지하고 쿠키를 설정하여, 이후 페이지에서도 선택이 유지되도록 합니다. `dir` 속성은 오른쪽에서 왼쪽으로 쓰는 언어에 대해 `get_direction()`를 사용합니다.

<details>
<summary>템플릿</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter는 위젯을 한 번 생성하므로, 언어 변경 시 위젯을 업데이트해야 합니다. 각 보이는 텍스트를 리터럴을 포함하여 `t("…")`를 호출하는 함수로 작성하고, 해당 함수로 위젯을 등록한 다음, `set_locale` 후에 `refresh()`를 호출하십시오. `extract`는 여전히 모든 리터럴을 봅니다. 선택한 코드를 앱의 설정 파일에 저장하고, 창이 빌드되기 전에 `set_locale`를 사용하여 호출하십시오.

<details>
<summary>언어 메뉴가 있는 Tkinter 창</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

새 스레드는 창의 언어가 아닌 소스 언어로 시작됩니다. 메인 스레드에서 번역하거나, 스레드 함수 시작 시 `set_locale`를 호출하십시오. 다른 툴킷도 동일한 구성 요소가 필요합니다: 모든 보이는 텍스트를 설정하는 함수와 `set_locale`를 호출한 다음 해당 함수를 호출하는 메뉴 핸들러. PyQt 및 PySide는 자체 재번역 훅을 가집니다; [각 프레임워크의 로케일](/ko/guide/ui-strings/python#locale-in-each-framework)을 참조하십시오.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#choose-models-and-translate)에서 계속하십시오.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 보유한 항목 | 참고 |
| --- | --- |
| Django, Flask-Babel 카탈로그 또는 GNU gettext를 이미 사용하는 앱 | [Django/Python gettext 앱에 i18n 추가](/ko/guide/add-i18n-to-django-gettext) |
| JS/TS 앱 | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) |
| 웹사이트 또는 문서 사이트 | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website) |
| 리포지토리 README 또는 기타 마크다운 파일 | [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme) |
| 중첩된 로케일 JSON | [JSON](/ko/guide/json) |

<a id="examples"></a>
## 예시

| 예시 | 설명 |
| --- | --- |
| [python-streamlit](/ko/examples#python-streamlit) | 대시보드, `t()` / `_()`, 플랫 JSON |
| [python-fastapi](/ko/examples#python-fastapi) | 요청 범위 로캘, 플랫 JSON |
| [python-flask](/ko/examples#python-flask) | Flask + Jinja, 플랫 JSON |

`npx degit`을(를) 사용하여 하나를 복사하거나, GitHub 릴리스에서 `ai-i18n-tools-python-examples.zip`을(를) 다운로드하세요. 명령: [예시](/ko/examples#python-examples). gettext를 사용하는 앱의 경우, [gettext 예시](/ko/examples#python-gettext)를 참조하세요.
