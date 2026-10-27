<a id="python-applications"></a>
# 파이썬 애플리케이션

`ai-i18n-tools`는 Python과 Jinja, Django, Qt `.ui` 파일에서 UI 문자열을 추출한 다음, 소스 언어 문자열을 키로 사용하는 플랫 JSON, GNU gettext 카탈로그 또는 둘 다를 작성합니다. `sourceLocale`는 모든 언어가 될 수 있습니다. 런타임 헬퍼는 표준 라이브러리 `i18n.py`(Python 3.10 이상)입니다. Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid, FastAPI는 해당 헬퍼를 호출합니다. Django는 Django 자체의 gettext를 사용합니다.

기존 단일 언어 앱에 로캘 추가하기: [Python 앱에 i18n 추가하기](/ko/guide/add-i18n-to-python), [`i18n.py` 프롬프트](/ko/guide/add-i18n-to-python#agent-prompt-i18n-py) 및 [Django / gettext 프롬프트](/ko/guide/add-i18n-to-python#agent-prompt-django-gettext) 포함. 프레임워크 선택기: [Python 통합](/ko/guide/integrations/python). 함수 목록: [Python 런타임(`i18n.py`)](/ko/reference/programmatic-api#python-runtime).

실행 가능한 복사본은 `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` 및 `examples/python-gettext`에 있습니다. 이들은 Python 프로젝트입니다. 처음 세 개는 virtualenv와 `pip install -r requirements.txt`를 사용합니다. `python-gettext`은(는) 표준 라이브러리만 사용합니다. 이들은 npm 패키지가 아닙니다. 릴리스 아카이브 `ai-i18n-tools-python-examples.zip`에는 동일한 네 개의 디렉터리가 포함되어 있습니다. npm tarball 및 독립 실행형 실행 파일에는 포함되어 있지 않습니다.

<a id="scaffold"></a>
## 스캐폴드

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

`ui-python`은(는) 평면 JSON 및 `i18n.py`을(를) 작성합니다. `ui-python-gettext`은(는) JSON 및 `.po` / `.mo`을(를) 작성합니다. `ui-python-flask`은(는) `translations/` 및 `i18n.py` 아래에 gettext 카탈로그를 작성합니다. `ui-python-django`은(는) `locale/<lang>/LC_MESSAGES/django.po`을(를) 작성하며 `i18n.py`은(는) 작성하지 않습니다.

리포지토리 README도 번역하세요. 위의 `init` 명령어에 `--with-readme`를 추가하세요. [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme)를 참조하세요.

스캔 루트는 `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache` 및 `.eggs`을(를) 건너뜁니다.

<a id="calls-that-translate"></a>
## 번역 호출

카탈로그 항목을 먼저 조회한 다음 보간합니다.

이식성:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Python 3.14에서 헬퍼는 템플릿 문자열도 허용합니다:

```python
translate(t"Hello, {name}!")
```

`translate`은(는) `t`의 별칭입니다. 키워드 인수는 템플릿 문자열에서 가져온 값을 재정의합니다.

네이티브 gettext는 템플릿이 인수이므로 여전히 안전합니다:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

이들은 카탈로그 조회 전에 평가되므로 추출기는 이를 안전하지 않은 것으로 표시하고 `migrate-python-i18n`은(는) 이를 다시 작성합니다:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n`은(는) `--write`을(를) 전달하기 전까지는 드라이 런(dry run)입니다. `migrate-python-i18n-report.md`을(를) 작성합니다. `{value=}` 및 중첩된 형식 사양과 같은 디버그 필드는 보고되며 그대로 유지됩니다.

`{% trans %}` 및 `{% blocktrans %}`은(는) gettext `%(name)s` 자리 표시자가 됩니다. Jinja는 공백을 제거하고 축소합니다. Django는 태그에 `trimmed`이(가) 명시되지 않는 한 내부 공백을 유지합니다.

<a id="catalogs"></a>
## 카탈로그

플랫 JSON 키는 소스 언어 문자열, 즉 `sourceLocale`의 텍스트입니다. 해당 언어는 모든 언어가 될 수 있습니다. 컨텍스트는 `context` + U+0004 + 해당 소스 문자열을 사용합니다. 복수형 슬롯은 `translate-ui`가 이미 작성하는 `{md5}_one`, `{md5}_other` 및 기타 CLDR 형식으로 유지됩니다. 헬퍼는 공백이 제거된 단수형을 MD5로 해시하고 처음 8개의 16진수 문자를 읽습니다.

Gettext 파일은 컨텍스트에 `msgctxt`을(를) 사용하고 복수형에 `msgid` / `msgid_plural`을(를) 사용합니다. `ui.gettext.compileMo`은(는) `.po` 옆에 `.mo`을(를) 작성합니다. `purge-locale`은(는) 해당 로캘의 `.po` 및 `.mo`을(를) 삭제합니다. `flatOutput`이(가) false이면 평면 JSON 파일은 작성되지 않았으므로 그대로 둡니다.

영어 소스 로캘과 명시적 복수형 소스가 있는 `t(..., plurals=True)`은(는) 모델을 건너뛰고 소스 문자열에서 `one` / `other`을(를) 저장합니다.

<a id="locale-in-each-framework"></a>
## 각 프레임워크의 로캘

`set_locale`은(는) `ContextVar` 토큰을 반환합니다. 동시 요청 시 로케일이 유출되지 않도록 FastAPI 및 Flask 미들웨어를 포함한 `finally`에서 이를 재설정하십시오.

- <a id="streamlit"></a>**Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")`은 `st.session_state.locale` 및 `st.query_params["lang"]`를 작성합니다. 모든 위젯에 고정된 `key`을 지정하세요. `examples/python-streamlit`를 참조하세요.
- <a id="fastapi"></a>**FastAPI.** 미들웨어에서 `?lang=` 또는 `Accept-Language`을 읽고, `set_locale`을 호출한 다음 `finally`에서 `reset_locale`을 수행하세요. 경로는 `t()` 및 `_()`을 호출합니다. `examples/python-fastapi`를 참조하세요.
- <a id="flask"></a>**Flask 및 Pyramid.** 요청에서 로캘을 설정하고 템플릿 컨텍스트에 `_`, `t`, `current_locale`, `ui_languages` 및 `direction`을 주입하세요. `examples/python-flask`을 참조하세요.
- <a id="gettext"></a>**기존 gettext.** `_()`, `gettext()` 및 `ngettext()`을 그대로 유지하세요. `ui.gettext`가 현재 `locales/` 트리를 가리키도록 설정하고 `extract`를 실행한 다음 `translate-ui`를 실행하세요. `examples/python-gettext`을 참조하세요.
- <a id="django"></a>**Django.** `gettext`, `ngettext` 및 `{% blocktrans %}`를 사용하세요. 초기화 템플릿 `ui-python-django`은 Django의 `locale/` 디렉터리 및 `django` 도메인과 일치합니다.
- <a id="tkinter"></a>**Tkinter.** 각 위젯을 생성할 때 `t()` 또는 `_()`을 호출한 다음 `set_locale` 이후에 표시되는 텍스트를 다시 빌드하세요.
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")`가 추출됩니다. `notr="true"`가 아닌 경우 `.ui` 파일이 `<string>` 요소를 제공합니다. `comment` 속성은 gettext 컨텍스트가 됩니다.
- <a id="pywebview"></a>**PyWebView / PyWebKit.** 위에서 언급한 Python 템플릿을 사용하여 Python 셸을 추출하세요. `data-i18n` 마커를 사용하거나 로캘당 하나의 HTML 문서를 사용하여 HTML 페이지를 추출하세요.
