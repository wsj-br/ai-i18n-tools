<a id="add-i18n-to-a-django--python-gettext-app"></a>
# Django / Python gettext 앱에 i18n 추가

이 페이지는 GNU gettext로 번역하거나 번역할 Python 애플리케이션(Django, Flask-Babel 스타일 카탈로그를 사용하는 Flask, 또는 `gettext()`를 호출하는 모든 앱)을 위한 것입니다. gettext 호출은 유지합니다. ai-i18n-tools는 이를 읽고, 메시지를 번역하며, 앱이 이미 로드하는 `.po` 및 컴파일된 `.mo` 파일을 작성합니다. 도우미 모듈은 필요하지 않습니다.

가장 빠른 방법은 이 페이지의 프롬프트를 코딩 에이전트에게 제공하는 것입니다. 에이전트는 구성을 설정하고, 문자열을 래핑하며, 결과를 확인하고, 언어 전환 기능을 추가할 수 있습니다. CLI를 설치하고, 공급자를 선택하고, 프로젝트를 직접 초기화해야 합니다. 이는 API 키와 사용자의 선택이 필요하기 때문입니다. 또한 번역은 사용자 계정에서 비용이 발생하고 `.po` 및 `.mo` 파일을 다시 작성하므로 직접 실행해야 합니다.

오늘날 gettext를 사용하지 않는 Streamlit, FastAPI, Flask, 데스크톱 또는 스크립트 앱을 구축하고 있습니까? 대신 [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python)를 사용하세요. 이 방법은 작은 `i18n.py` 도우미를 추가하고 JSON 카탈로그를 작성합니다. 어떤 방법이 적용되는지 확실하지 않습니까? 마지막에 [해당하지 않는 경우?](#not-your-case)를 참조하세요.

흐름:

1. [CLI 설치 및 공급자 선택](#install-and-choose-a-provider).
2. `init`를 사용하여 [프로젝트 초기화](#initialise-the-project).
3. [에이전트 프롬프트 실행](#run-the-agent-prompt).
4. [결과 검토](#review-the-result).
5. [모델 선택 및 번역](#translate) 후 한 언어를 확인합니다.
6. [번역된 상태 유지](#keep-it-translated).

변경 사항을 직접 적용하고 싶거나 프롬프트가 무엇을 하는지 알고 싶으신가요? [수동으로 진행하기](#do-it-by-hand)에서 동일한 단계를 하나씩 안내합니다.

<a id="install-and-choose-a-provider"></a>
## 설치 및 공급자 선택

이 부분은 에이전트가 아닌 사용자가 직접 수행합니다. 설치 프로그램은 사용자 시스템을 변경하며, API 키는 프롬프트가 아닌 셸에 속하는 비밀 정보입니다.

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

Ollama는 키가 필요 없습니다. 다른 사전 설정: [내장 공급자](/ko/guide/providers-and-models#built-in-providers). 다음 단계에서 `init`에 전달하므로 공급자 이름을 기록해 두십시오. 에이전트는 키가 필요하지 않습니다. 모델 호출을 하지 않는 명령만 실행합니다. 나중에 [번역](#translate)할 때 키를 사용합니다.

<a id="initialise-the-project"></a>
## 프로젝트 초기화

이 작업은 프롬프트 전에 한 번 실행합니다. 이 작업은 구성을 작성하고 위에서 선택한 공급자를 사용합니다. 앱에 맞는 템플릿을 선택하세요:

| 앱 | 템플릿 | 작성하는 카탈로그 |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` 및 `.mo` |
| Flask-Babel 스타일 카탈로그를 사용하는 Flask | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` 및 `.mo` |
| 이미 GNU gettext를 사용하는 다른 Python 앱 | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` 및 `.mo` |

선택한 템플릿 이름과 공급자로 init을 실행합니다:

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

`init`을(를) 한 번 실행하세요. 매번 `ai-i18n-tools.config.json`을(를) 다시 작성하므로, 두 번째 실행 시에는 사용자가 변경한 내용이 삭제됩니다. 구성이 이미 존재하고 사용자 정의된 경우, `init`을(를) 건너뛰고 구성을 편집하세요.

`ui-python-gettext` 및 `ui-python-flask`은(는) 해당 파일이 없는 경우 `i18n.py` 헬퍼를 작성합니다. gettext 앱은 필요하지 않으므로 삭제하세요(프롬프트가 자동으로 처리합니다). `ui-python-gettext`은(는) gettext 카탈로그 옆에 JSON 파일도 작성합니다. gettext 카탈로그만 작성하려면 `ui` 블록에서 `"flatOutput": false`을(를) 설정하세요(프롬프트가 이것도 처리합니다). Django는 자체 번역 시스템을 유지하므로 `ui-python-django`은(는) 헬퍼도 JSON도 작성하지 않습니다.

그런 다음 `ai-i18n-tools.config.json`에서 `sourceLocale` 및 `targetLocales`을(를) 편집하세요. `sourceLocale`은(는) 코드의 문자열 언어입니다. 모든 BCP-47 언어가 유효하며, 예시에서는 종종 `en`를 사용합니다. 대상 코드를 `pt-BR` 형식으로 작성하세요. 카탈로그 폴더는 `pt_BR`이며, gettext와 Django가 예상하는 형식입니다(`localeFormat`은(는) `posix`입니다).

<a id="run-the-agent-prompt"></a>
## 에이전트 프롬프트 실행

코딩 에이전트(Cursor, Claude Code, Copilot 등)에서 프로젝트를 열고, 새 채팅을 시작한 다음 아래 프롬프트를 붙여넣으세요. 프로젝트는 이미 초기화되어 있어야 합니다. 편집할 내용은 없습니다. 예를 들어 언어 전환을 원하지 않는 등 제외하고 싶은 것이 있다면 같은 메시지에 명시하세요.

에이전트는 먼저 CLI와 구성이 존재하는지 확인하고, 둘 중 하나라도 없으면 지침과 함께 중단됩니다. 그런 다음 네 부분으로 작동합니다.

- 1부에서는 구성이 기존 카탈로그와 일치하도록 만들고, 일부 템플릿이 작성하는 `i18n.py`을(를) 제거합니다.
- 2부에서는 사용자에게 표시되는 문자열을 이미 사용 중인 gettext 호출과 템플릿 태그로 래핑합니다.
- 3부에서는 `extract`을(를) 실행하고 조회 전에 형식을 지정하는 호출을 찾습니다.
- 4부에서는 언어 전환을 추가합니다.

아무것도 설치하거나 초기화하지 않으며, API 키를 읽거나 번역하지 않습니다. `makemessages` 또는 `compilemessages`을(를) 실행하지 않으며, `.po` 및 `.mo` 파일을 그대로 둡니다. 번역은 검토 후 단계이며, 사용자가 실행합니다.

<details class="agent-prompt">
<summary>에이전트 프롬프트: Django 또는 gettext 앱에 언어 추가</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## 결과 검토

에이전트는 보고서로 끝냅니다. 번역하기 전에 확인하세요.

- 차이점(diff). 래핑된 호출, 템플릿 태그, 구성 및 언어 전환만 변경되어야 합니다. 번역하기 전까지는 `.po` 및 `.mo` 파일이 변경되지 않아야 합니다.
- `ai-i18n-tools.config.json`: `gettext.outputDir` 및 `domain`는 앱이 로드하는 카탈로그를 가리키며, `sourceRoots`는 애플리케이션 코드를 포함합니다.
- `ai-i18n-tools extract`은(는) 새 메시지를 나열하고 `.po` 파일에 이미 있는 번역을 유지합니다.
- `migrate-python-i18n`의 드라이 런(dry run)은 수정할 내용이 남아 있지 않음을 보여줍니다.
- Django 검사와 테스트가 통과하고, 앱이 원본 언어에서 동일하게 보입니다.
- 보고서의 건너뛴 문자열 및 모호한 경우: 단일 문자열로 남겨진 복수형, 두 가지 의미를 가진 한 단어, 번역된 조각으로 구성된 문장. 이러한 것들은 수동으로 결정하세요.

이 상태를 커밋하세요. `translate-ui`은(는) `.po` 파일을 다시 작성하므로, 검토할 깨끗한 차이점(diff)을 원할 것입니다.

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

이 부분은 사용자가 실행합니다. API 키를 사용하고, 계정에서 비용이 발생하며, `.po` 파일을 다시 작성하므로 먼저 커밋하세요.

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`은(는) `translationModels`만 대체합니다. 동일한 순위는 [모델](/ko/guide/translation-dashboard/models) 탭에 있습니다. 그런 다음 번역하세요.

```bash
ai-i18n-tools translate-ui
```

`translate-ui`은(는) `.pot` 템플릿, 대상 로케일당 하나의 `.po`, 그리고 컴파일된 `.mo`을(를) 작성합니다. 다음 실행 시 다시 생성되므로 이제부터 이 파일들을 편집하지 마세요. 커밋하기 전에 첫 번째 차이점(diff)을 검토하세요.

새 `.mo` 파일을 인식하지 못하는 경우 서버를 다시 시작하세요.

<a id="check-one-language"></a>
### 한 언어 확인

하나의 대상 언어로 전환하고 래핑된 문자열이 있는 페이지를 보세요. 여전히 원본 언어를 표시하는 텍스트는 래핑되지 않았거나 `.mo`이(가) 다시 로드되지 않았습니다. 출력에 `%(name)s`을(를) 표시하는 텍스트는 사전을 잃었습니다. `.po` 파일의 플레이스홀더를 확인하세요.

<a id="keep-it-translated"></a>
## 번역 유지

원본 텍스트를 변경한 후 `ai-i18n-tools sync`를 다시 실행합니다 (또는 `extract` 후 `translate-ui`). 캐시는 새로 추가되거나 변경된 문자열만 모델로 전송됨을 의미합니다. 번역이 틀어지지 않도록 CI에서 실행하세요. `ai-i18n-tools dashboard`는 번역을 검토할 수 있는 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

`purge-locale`는 로케일의 `.po` 및 `.mo`를 제거합니다. `.po` 파일을 커밋합니다. 빌드에서 컴파일하지 않는 한 `.mo` 파일도 커밋합니다.

동일한 실행에서 `README.md`를 번역하려면, `--with-readme`로 스캐폴드합니다 (또는 기존 구성에 블록을 추가합니다). [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="do-it-by-hand"></a>
## 수동으로 수행하기

변경 사항을 직접 적용하는 것을 선호하거나 프롬프트가 무엇을 하는지 알고 싶다면 다음 단계를 따르세요. 각 단계는 프롬프트의 한 부분과 일치합니다. 마지막에는 여전히 [CLI를 설치](#install-and-choose-a-provider)하고, [프로젝트를 초기화](#initialise-the-project)하고, [번역](#translate)해야 합니다.

1. [구성에서 카탈로그를 지정합니다](#point-the-config).
2. 이미 사용하는 gettext 호출로 [문자열을 래핑합니다](#wrap-strings).
3. [호출을 추출하고 확인합니다](#extract-and-check).
4. [런타임에 언어를 전환합니다](#switch-language).

<a id="step-1-point-the-config-at-your-catalogs"></a>
## 1단계: 구성에서 카탈로그 지정

템플릿은 합리적인 기본값을 작성합니다. 다음은 Django의 예시입니다.

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

프로젝트에 대해 다음 네 가지를 확인합니다.

- `gettext.outputDir` 및 `potPath`은 카탈로그가 이미 있는 위치입니다. Django: `LOCALE_PATHS`의 폴더 또는 앱 내부의 `locale/` 폴더. Flask-Babel: `translations/`.
- `gettext.domain`는 앱이 로드하는 파일 이름입니다. Django는 `django`를 사용합니다. Flask-Babel은 `messages`를 사용합니다. 일반 gettext의 경우, 이는 `gettext.translation(...)` 호출의 도메인입니다.
- `sourceRoots`는 `extract`가 스캔하는 폴더를 나열합니다. 테스트 및 스크립트가 카탈로그에 포함되지 않도록 `"."`에서 애플리케이션 코드로 범위를 좁히세요.
- `stringsJson`는 이 도구가 소유하는 파일인 추출 캐시입니다. 카탈로그 옆에 보관하세요. 런타임 파일이 아닙니다. 앱은 이 파일을 읽지 않습니다.

각 Django 앱이 자체 `locale/` 폴더를 유지하는 경우, 카탈로그 트리당 하나의 `ui` 블록을 사용합니다. `ui`는 목록을 허용하며, `--ui-block`는 하나의 블록을 실행합니다. 경로는 블록 전체에서 고유해야 합니다. [구성](/ko/reference/configuration)을 참조하세요.

`ingestExistingPo`는 기본적으로 켜져 있습니다. `extract` 동안, `.po` 파일에 이미 있는 번역이 빈 슬롯을 채웁니다. 이미 설정된 번역은 대체되지 않습니다. 첫 번째 `translate-ui` 전에 카탈로그를 커밋합니다. 이는 `.po` 파일을 다시 작성하고 `.mo` 파일을 컴파일하기 때문입니다. 해당 차이점을 검토합니다.

`compileMo`는 `.mo`를 대신 작성해 주므로, 이 워크플로에서는 `compilemessages`가 필요하지 않습니다. 카탈로그를 작성할 도구를 하나 선택하세요. `translate-ui` 다음에 `makemessages`를 실행하면 동일한 `.po` 파일이 다시 작성됩니다.

<a id="step-2-wrap-strings"></a>
## 2단계: 문자열 래핑

`extract`는 `ui.uiExtractor.funcNames`에 있는 함수 이름 중 하나에 전달된 리터럴이거나 템플릿 태그인 경우에만 문자열을 기록합니다. 기존 호출을 유지하세요. 누락된 것을 추가하세요.

Python 코드:

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

플레이스홀더는 `%(name)s`를 사용합니다. `%`를 사용하여 조회 후에 값을 전달하고, 조회 전에는 전달하지 마세요. 모델, 폼, 설정은 모듈이 임포트될 때 실행되므로 지연(lazy) 형식을 사용합니다. 임포트 시점에 지연 문자열에 `%`를 적용하지 마세요. 대신 `format_lazy`를 사용하세요.

템플릿 (Django `{% load i18n %}` 또는 Flask의 Jinja):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}` 및 `{% blocktrans %}`는 자체적으로 수집됩니다. <code v-pre>{{ name }}</code>와 같은 템플릿 변수는 `%(name)s`로 저장됩니다. 해당 형식으로 유지하세요.

`extract`가 알지 못하는 이름은 건너뜁니다. 기본 목록은 `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` 및 `self.tr`입니다. 코드가 `gettext_lazy("…")`, `ngettext_lazy`, `pgettext_lazy`, `npgettext` 또는 `gettext_noop`를 직접 호출하는 경우, 해당 이름을 `ui.uiExtractor.funcNames`에 추가하세요. `gettext_lazy as _`에서처럼 지연 함수를 `_`로 임포트할 때, `_` 이름은 이미 포함됩니다.

사람이 보는 텍스트(레이블, 제목, 메시지, 폼 및 모델 텍스트, 이메일)를 래핑합니다. 식별자, URL, 필드 이름, 설정 키, 로그 메시지 및 마이그레이션은 그대로 두세요. 원본 텍스트를 다시 작성하지 마세요. 누락된 번역은 원본 문장을 반환하므로, 앱은 원본 언어에서 동일하게 보입니다.

이러한 호출은 조회 전에 서식을 평가하므로, 문자열은 카탈로그 항목과 일치하지 않습니다.

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## 3단계: 호출 추출 및 확인

호출이 래핑되면 `extract`를 실행하십시오. 이 명령은 추출 캐시를 작성하고 기존 `.po` 파일에서 빈 슬롯을 채웁니다. 모델을 호출하지는 않습니다.

```bash
ai-i18n-tools extract
```

그런 다음 조회 전에 형식을 지정하는 호출을 찾으십시오. `migrate-python-i18n`가 이를 찾아냅니다. `--write` 없이 실행하십시오:

```bash
ai-i18n-tools migrate-python-i18n
```

이 명령은 `migrate-python-i18n-report.md`를 작성합니다. 이를 읽고 나열된 각 호출을 `%(name)s` 및 사전을 사용하여 수동으로 수정하십시오. 보고서를 삭제하거나 git-ignore 처리하십시오.

이 페이지에서 `--write`를 전달하지 마십시오. 이 옵션은 f-string 또는 `.format()` 호출을 `i18n.py` 헬퍼에만 존재하는 호출인 `t("…", name=name)`로 다시 작성합니다. gettext 앱에는 `t`가 없습니다. 줄이 없는 보고서는 래핑된 호출이 안전하다는 의미입니다. 모든 문장이 래핑되었다는 의미는 아니므로, `strings.json`의 diff를 읽고 예상했던 텍스트를 찾아보십시오.

<a id="step-4-switch-language-at-runtime"></a>
## 4단계: 런타임에 언어 전환

프레임워크가 언어를 선택합니다. ai-i18n-tools는 메뉴나 헬퍼를 추가하지 않습니다.

<a id="django"></a>
### Django

`settings.py`에서:

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware`는 세션 미들웨어 뒤에 오고 `CommonMiddleware` 앞에 옵니다. `LANGUAGE_CODE`는 소스 언어입니다. `LANGUAGES`는 방문자가 선택할 수 있는 언어를 나열합니다. 각 앱이 자체 `locale/` 폴더를 유지하지 않는 한, `LOCALE_PATHS`는 `gettext.outputDir`가 쓰는 폴더를 가리킵니다.

Django의 언어 전환 뷰를 `urls.py`에 추가하십시오:

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

그런 다음 템플릿에 폼을 추가하십시오:

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

뷰는 선택 사항을 쿠키에 저장합니다. 대신 URL에 언어를 넣으려면 `i18n_patterns`를 사용하십시오. 둘 다 표준 Django 기능입니다. Django의 국제화 문서를 참조하십시오.

<a id="plain-gettext-and-flask-babel"></a>
### 일반 gettext 및 Flask-Babel

원하는 언어에 대한 카탈로그를 로드하고 호출하십시오. [python-gettext](/ko/examples#python-gettext) 예시는 명령줄 도구에서 이를 수행합니다:

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

`pt-BR`를 `translate-ui`가 작성한 폴더 이름인 `pt_BR`로 변환하십시오. 누락된 카탈로그가 원본 텍스트를 표시하도록 `fallback=True`를 유지하십시오. 웹 앱에서는 요청당 번역 객체를 빌드하고 `gettext.install`로 전역적으로 설치하지 마십시오. 그렇지 않으면 동시 요청이 언어를 공유하게 됩니다. Flask-Babel에서는 로케일 선택기 함수에서 코드를 반환하고 `translations/`를 번역 디렉토리로 유지하십시오.

이것이 마지막 수동 단계입니다. [모델 선택 및 번역](#translate)에서 계속하십시오.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 보유한 항목 | 읽을 내용 |
| --- | --- |
| gettext가 없는 Streamlit, FastAPI, Flask, 데스크톱 또는 스크립트 앱 | [Python 앱에 i18n 추가](/ko/guide/add-i18n-to-python) |
| JS/TS 앱 | [JS/TS 앱에 i18n 추가](/ko/guide/add-i18n-to-js) |
| 웹사이트 또는 문서 사이트 | [웹사이트 또는 문서 사이트에 i18n 추가](/ko/guide/add-i18n-to-website) |
| 리포지토리 README 또는 기타 마크다운 파일 | [README 및 마크다운 문서에 i18n 추가](/ko/guide/add-i18n-to-readme) |

<a id="examples"></a>
## 예시

| 예시 | 보여주는 내용 |
| --- | --- |
| [python-gettext](/ko/examples#python-gettext) | 기존 gettext 명령줄 도구; `translate-ui`는 `.po` 및 `.mo`를 새로 고칩니다 |

Django 예시 디렉토리는 없습니다. `python-gettext` 예시는 도메인 `messages`과 동일한 구성 형태를 보여줍니다. `npx degit`로 복사하거나 GitHub 릴리스에서 `ai-i18n-tools-python-examples.zip`를 다운로드하십시오. 명령어: [예시](/ko/examples#python-examples).
