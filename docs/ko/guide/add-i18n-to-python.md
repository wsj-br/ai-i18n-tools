<a id="add-i18n-to-a-python-app"></a>
# Python 앱에 i18n 추가하기

이 가이드에서는 단일 언어를 사용하는 Python 애플리케이션에 ai-i18n-tools를 사용하여 로케일을 추가하는 방법을 설명합니다. 사용자에게 표시되는 일반 문자열은 수동으로 또는 [문자열 래핑](#wrap-strings) 아래의 프롬프트를 사용하여 래핑됩니다. `migrate-python-i18n`는 이미 래핑된 안전하지 않은 호출만 수정합니다. 아직 검토가 필요한 모든 항목은 보고서에 나열됩니다.

이미 GNU gettext, Django 또는 Flask 카탈로그를 사용 중이신가요? 기존 호출을 유지하세요. 아래에서 일치하는 초기화 템플릿을 선택하고 `extract`이(가) 기존 `.po` 파일에서 비어 있는 카탈로그 슬롯을 채우도록 하세요.

단계:

1. CLI를 [설치](#install)하고 API 키를 설정합니다.
2. [템플릿을 선택](#pick-a-template)하고 `init`를 실행합니다.
3. `t()` 또는 `_()`에서 [문자열을 래핑](#wrap-strings)합니다.
4. 이미 안전하지 않게 래핑된 [호출 사이트를 마이그레이션](#migrate)합니다.
5. [모델을 선택하고 번역](#translate)합니다.
6. [런타임에 로케일을 전환](#switch-locale)합니다.
7. [번역된 상태를 유지](#keep-it-translated)합니다.

이것이 귀하의 경우가 아닌가요? 마지막에 있는 [귀하의 경우가 아닌가요?](#not-your-case)를 참조하십시오.

<a id="install"></a>
## 설치

머신에 이미 Node.js `>=22.16.0`가 있는 경우 npm 패키지를 사용하십시오([설치](/ko/guide/installation)). Python 프로젝트의 경우 독립 실행형 실행 파일(Node.js 없음)을 설치하십시오.

Linux 및 macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

설치 프로그램은 `SHA256SUMS.txt`를 확인하고, 명령을 `ai-i18n-tools`로 설치하며, `PATH`에 추가합니다. 바이너리는 공증되거나 Authenticode 서명되지 않았습니다. 수동 단계 및 자산 이름: [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables).

`init`에 전달하는 공급자의 API 키를 설정합니다. 예를 들어, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama는 키가 필요하지 않습니다. 기타 프리셋: [내장 공급자](/ko/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## 템플릿 선택

| 현재 앱 | 명령 | 얻게 되는 것 |
| --- | --- | --- |
| 하드코딩된 문자열 또는 새 `t()` / `_()` 호출 | `ai-i18n-tools init -t ui-python -P cheaperinference` | 소스 언어 문자열로 키가 지정된 플랫 JSON 및 `i18n.py` |
| GNU gettext를 사용하고 플랫한 JSON도 원하는 경우 | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON과 `.po` / `.mo` 및 `i18n.py` |
| `translations/` 아래의 Flask 또는 Jinja 카탈로그 | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext 카탈로그 및 `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (`i18n.py` 없음) |

`sourceLocale` 및 `targetLocales`를 편집합니다. `sourceLocale`는 소스에 있는 문자열의 언어입니다. 모든 BCP-47 언어가 유효하며, 예시에서는 종종 `en`를 사용합니다. 프레임워크 연결: [Python 통합](/ko/guide/integrations/python). 호출 형태 및 카탈로그 레이아웃: [Python 애플리케이션](/ko/guide/ui-strings/python).

<a id="wrap-strings"></a>
## 문자열 래핑

먼저 카탈로그 항목을 조회한 다음 보간(interpolate)하세요. 생성된 `i18n.py`에서 `t` 및 `_`을(를) 가져오세요(Django는 `gettext` 및 `ngettext`을(를) 유지합니다).

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

이들은 카탈로그 조회 전에 평가됩니다. 추출기는 이를 안전하지 않은 것으로 표시하며, `migrate-python-i18n`이(가) 다음과 같이 다시 작성합니다:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Streamlit, FastAPI, 플랫 JSON을 사용하는 Flask, Tkinter, Qt 및 PyWebView 셸에 이것을 사용하십시오. 코딩 에이전트에 복사하십시오. Django 또는 기존 gettext 프로젝트는 대신 [다음 프롬프트](#agent-prompt-django-gettext)를 사용해야 합니다.

<details class="agent-prompt">
<summary>에이전트 프롬프트: i18n.py 도우미</summary>

````markdown
# Wrap user-facing Python strings with i18n.py

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `_()` (and the
other names in `ui.uiExtractor.funcNames`). The literal is the source-language
sentence and the catalog key. After this edit the app must behave the same when
the active locale is the source locale. Do not translate any string.

Call shapes: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit Python (and Jinja
templates) under those roots. Skip class names, URLs and routes, import paths,
ids, enum and error codes, object keys used as identifiers, log field names,
regexes, comments, and text that is already wrapped. Do not edit the generated
`i18n.py`.

## Call shape

Import `t` and `_` from the generated `i18n.py`. Placeholders are `{name}` or
`{price:,.2f}`, passed as keyword arguments. `_("…") % x` and `_("…").format(…)`
are safe because the lookup happens first.

Never `_(f"…")`, `_("…" % x)`, or `_("…".format(…))`. If one slips in,
`migrate-python-i18n` can rewrite it later.

Before:

```python
st.write(f"Hello, {name}!")
```

After:

```python
st.write(t("Hello, {name}!", name=name))
```

Framework notes:

- Streamlit widgets keep a fixed `key=`.
- Tkinter text is rebuilt after `set_locale`.
- Qt uses `self.tr("…")` (already in the default function list).
- Jinja uses `{% trans %}` / `{% blocktrans %}` rather than an f-string inside
  the template.
- FastAPI and Flask middleware pair `set_locale` with `reset_locale` in
  `finally`.

## Order

1. `ai-i18n-tools init -t ui-python` (or `ui-python-gettext` / `ui-python-flask`
   if you also want `.po` files) so `i18n.py` exists.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Then `ai-i18n-tools migrate-python-i18n` (dry
   run) and read the report.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys.
- Do not create a second helper besides `i18n.py`.
- Do not hand-edit `strings.json`, flat locale JSON, `.po` / `.mo`, or
  `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog.
- The project's tests pass.
- The source locale still shows the original sentences. One target locale shows
  translations after `translate-ui`.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case left for a human (the same word with different meanings,
concatenated sentences, or plurals).
````

</details>

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

앱이 이미 Django 또는 GNU gettext를 호출하거나 `.po` 카탈로그를 유지하려는 경우 이것을 사용하십시오. `i18n.py`를 추가하지 마십시오.

초기화 템플릿은 다음 호출 이름을 정확히 인식합니다: `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` 및 `self.tr`. 지연 및 noop 변형은 이 목록에 없습니다. 프로젝트에서 실제로 호출하는 이름(일반적으로 `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy` 및 `gettext_noop`)을 `ui.uiExtractor.funcNames`에 추가해야 합니다. 그렇지 않으면 `extract`가 이를 건너뜁니다. `ngettext_lazy`는 이름이 나열된 후에만 단수 및 복수로, `pgettext_lazy`는 컨텍스트 및 메시지로 읽힙니다. 템플릿의 `{% trans %}` 및 `{% blocktrans %}`는 자체적으로 수집됩니다.

<details class="agent-prompt">
<summary>에이전트 프롬프트: Django 및 네이티브 gettext</summary>

````markdown
# Wrap user-facing strings with Django / gettext

## Context

ai-i18n-tools extracts string literals passed to gettext calls whose names are
listed in `ui.uiExtractor.funcNames`, plus `{% trans %}` and `{% blocktrans %}`
in templates. The literal is the source-language message. Existing `.po` files
stay; `extract` fills empty catalog slots from them when
`ui.gettext.ingestExistingPo` is on (the default). Do not translate any string.
Do not create `i18n.py`.

## Scope

Edit Python modules, Django templates, and forms under `ui.sourceRoots`. Skip
URLs, import paths, ids, field names used as identifiers, `verbose_name` keys
that are already lazy-wrapped, comments, and migrations that must not change. Do
not wrap strings inside `help_text` that are already `gettext_lazy` calls.

## Call shape

Init with `ui-python-django` (Django `locale/` and the `django` domain) or
`ui-python-gettext` (existing GNU catalogs). Use `gettext`, `ngettext`,
`pgettext`, and `{% blocktrans %}` / `{% trans %}`. Placeholders are `%(name)s`.

Module-level model, form, and settings strings use the lazy form. Add every lazy
or noop name you call to `ui.uiExtractor.funcNames` (for example `gettext_lazy`,
`ngettext_lazy`, `pgettext_lazy`, and `gettext_noop`). The default list does not
include them.

Before:

```python
verbose_name = "Display name"
```

After:

```python
from django.utils.translation import gettext_lazy as _

verbose_name = _("Display name")
```

Template:

```django
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

The extractor stores that message with a `%(name)s` placeholder. Do not switch
Django templates to `{name}` or to i18next `{{name}}` inside a Python `t()`
call.

## Order

1. Pick `ui-python-django` or `ui-python-gettext`. Confirm `funcNames` includes
   every gettext function the code calls.
2. Wrap call sites. Keep existing `.po` files.
3. Run `ai-i18n-tools extract`.

## Do not

- Do not translate, rename, or reword msgid text.
- Do not add `i18n.py` or a flat-JSON `t()` helper next to Django's gettext.
- Do not hand-edit generated `.po`, `.mo`, `strings.json`, or
  `ui-languages.json`.
- Do not change model field names, migrations, or test selectors.

## Verify

- `ai-i18n-tools extract` lists the new messages and does not drop existing
  msgid entries that `ingestExistingPo` already filled.
- Django checks and the project's tests pass.
- The source locale still shows the original copy.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
function names you added to `funcNames`, and any ambiguous case left for a
human.
````

</details>

<a id="migrate"></a>

<a id="migrate-call-sites"></a>
## 호출 사이트 마이그레이션

`migrate-python-i18n`은(는) `--write`을(를) 전달하기 전까지는 드라이 런(dry run)으로 작동합니다. 항상 `migrate-python-i18n-report.md`을(를) 작성합니다. 생성된 `i18n.py` 파일은 건너뜁니다. `{value=}` 및 중첩된 형식 사양과 같은 디버그 필드는 보고되며 그대로 유지됩니다.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

드라이 런에서 수동 검토가 필요한 사이트가 나열되면 `--write`을(를) 실행하기 전에 보고서를 읽어보세요. 선택 사항인 `--report <path>`은(는) 보고서 경로를 변경합니다. 선택 사항인 `--ui-block`은(는) 스캔 범위를 하나의 UI 블록으로 제한합니다.

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
## 모델 선택 및 번역

`init`의 모델 목록은 시작점입니다. 활성 공급자의 채팅 모델 순위를 지정하고, 최종 후보 목록이 적절해 보이면 `translationModels`에 작성하세요:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply`은(는) `translationModels`만 대체합니다. 동일한 순위가 [Models](/ko/guide/translation-dashboard/models) 탭에 있습니다. 그런 다음 추출하고 번역하십시오:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract`은(는) `strings.json` 및 `ui-languages.json`을(를) 작성합니다. `translate-ui`은(는) 플랫 JSON 파일을 채우며, `ui.gettext`이(가) 설정된 경우 `.po` / `.mo` 카탈로그를 채웁니다. 생성된 카탈로그를 직접 편집하지 마십시오.

<a id="switch-locale"></a>

<a id="switch-locale-at-runtime"></a>
## 런타임 시 로케일 전환

`set_locale`은(는) `ContextVar` 토큰을 반환합니다. 요청이나 콜백이 종료될 때 이를 재설정하십시오.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI 및 Flask 미들웨어는 `finally`(Flask: `teardown_request`)에서 재설정되어야 동시 요청 간에 로캘이 유출되지 않습니다. Django 프로젝트는 Django의 로캘 활성화를 유지하며 `i18n.py`을(를) 사용하지 않습니다. 프레임워크별 참고 사항: [각 프레임워크의 로캘](/ko/guide/ui-strings/python#locale).

<a id="keep-it-translated"></a>
## 번역 유지

원본 텍스트를 변경한 후 `ai-i18n-tools sync`를 다시 실행합니다 (또는 `extract` 후 `translate-ui`). 캐시는 새로 추가되거나 변경된 문자열만 모델로 전송됨을 의미합니다. 번역이 틀어지지 않도록 CI에서 실행하세요. `ai-i18n-tools dashboard`는 번역을 검토할 수 있는 [번역 대시보드](/ko/guide/translation-dashboard/)를 엽니다.

동일한 실행에서 `README.md`를 번역하려면, `--with-readme`로 스캐폴드합니다 (또는 기존 구성에 블록을 추가합니다). [README 및 Markdown 문서에 i18n 추가](/ko/guide/add-i18n-to-readme)를 참조하세요.

<a id="not-your-case"></a>
## 해당하지 않으시나요?

| 보유한 항목 | 읽기 |
| --- | --- |
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
| [python-gettext](/ko/examples#python-gettext) | 기존 gettext CLI; `translate-ui`은(는) `.po` 및 `.mo`을(를) 새로 고칩니다 |

`npx degit`을(를) 사용하여 하나를 복사하거나 GitHub 릴리스에서 `ai-i18n-tools-python-examples.zip`을(를) 다운로드하십시오. 명령어: [예시](/ko/examples#python-examples).
