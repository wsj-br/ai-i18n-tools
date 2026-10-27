<a id="python"></a>
# Python

Python 애플리케이션용 선택기입니다. 추출, 카탈로그, 호출 형태는 [Python 애플리케이션](/ko/guide/ui-strings/python)에 있습니다. 기존 단일 로케일 앱에 대한 단계별 안내는 [Python 앱에 i18n 추가하기](/ko/guide/add-i18n-to-python)이며, [`i18n.py` 프롬프트](/ko/guide/add-i18n-to-python#agent-prompt-i18n-py)와 [Django / gettext 프롬프트](/ko/guide/add-i18n-to-python#agent-prompt-django-gettext)가 포함됩니다.

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide 및 PyWebView는 생성된 `i18n.py` 헬퍼(Python 3.10 이상)를 호출합니다. Django는 Django의 gettext를 유지합니다. 저장소에는 `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` 및 `examples/python-gettext`라는 4개의 실행 가능한 복사본이 포함되어 있습니다. Pyramid, Django, Tkinter, Qt 및 PyWebView에는 별도의 예제 디렉터리가 없습니다.

<a id="which-template"></a>
## 어떤 템플릿을 사용할 것인가

| 프레임워크 | Init 템플릿 | 카탈로그 | 예제 |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | 소스 문자열을 키로 사용하는 플랫 JSON | [python-streamlit](/ko/examples#python-streamlit) |
| FastAPI | `ui-python` | 소스 문자열을 키로 사용하는 플랫 JSON | [python-fastapi](/ko/examples#python-fastapi) |
| Flask + Jinja, flat JSON | `ui-python` | 소스 문자열을 키로 사용하는 플랫 JSON | [python-flask](/ko/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `translations/` 하위의 `.po` / `.mo` | 아래의 Flask 참고 사항을 사용하십시오 |
| Pyramid | `ui-python` 또는 `ui-python-flask` | Flask와 동일 | Flask와 동일한 배선 |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | 예제 디렉터리 없음 |
| 기존 GNU gettext | `ui-python-gettext` | 플랫 JSON 및 `.po` / `.mo`, 또는 gettext 전용 | [python-gettext](/ko/examples#python-gettext) |
| Tkinter | `ui-python` | 소스 문자열을 키로 사용하는 플랫 JSON | 예제 디렉터리 없음 |
| PyQt / PySide | `ui-python` 또는 gettext 템플릿 | 플랫 JSON 및/또는 `.po` | 예제 디렉터리 없음 |
| PyWebView / PyWebKit | 셸용 Python 템플릿 | 셸 카탈로그 및 HTML 마커 또는 로케일당 HTML 파일 하나 | 예제 디렉터리 없음 |

`ui-python`, `ui-python-gettext`, `ui-python-flask`는 해당 파일이 없을 때 `i18n.py` 파일을 작성합니다. `ui-python-django`는 그렇지 않습니다. 리포지토리 README도 번역하려면 `--with-readme`를 추가하세요: [README 및 Markdown 문서에 i18n 추가하기](/ko/guide/add-i18n-to-readme).

<a id="framework-notes"></a>
## 프레임워크 참고 사항

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()`은 로케일을 세션 상태와 쿼리 문자열에 기록합니다. 모든 위젯에 고정된 `key`을 부여하십시오. 자세한 내용: [Locale — Streamlit](/ko/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

미들웨어에서 `?lang=` 또는 `Accept-Language`을 읽고, `set_locale`를 호출하며, 동시 요청이 각자의 로케일을 유지하도록 `finally`에서 `reset_locale`을 수행하십시오. 자세한 내용: [Locale — FastAPI](/ko/guide/ui-strings/python#fastapi).

<a id="flask"></a>
### Flask 및 Pyramid

[python-flask](/ko/examples#python-flask) 예제는 플랫 JSON을 사용합니다. `init -t ui-python-flask`은 이미 Flask-Babel 스타일 카탈로그를 사용하는 앱의 `translations/` 아래에 있는 gettext 레이아웃입니다. 어느 경우든 요청에서 로캘을 설정하고 `_`, `t`, `current_locale`, `ui_languages` 및 `direction`을 템플릿 컨텍스트에 삽입하십시오. Pyramid도 동일한 요청 범위 패턴을 사용합니다. 자세한 내용: [Locale — Flask and Pyramid](/ko/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

`gettext`, `ngettext` 및 `{% blocktrans %}`를 유지하십시오. `init -t ui-python-django`은 Django의 `locale/` 디렉터리 및 `django` 도메인과 일치하며 Django의 런타임을 그대로 둡니다. 자세한 내용: [Locale — Django](/ko/guide/ui-strings/python#django).

<a id="gettext"></a>
### 기존 gettext

`_()`, `gettext()` 및 `ngettext()`를 그대로 두십시오. `ui.gettext`을 현재 카탈로그 트리로 지정하고 `extract`를 실행한 다음 `translate-ui`를 실행하십시오. [python-gettext](/ko/examples#python-gettext) 예제는 gettext 전용(`flatOutput: false`)입니다. `init -t ui-python-gettext`도 플랫 JSON을 작성합니다. 자세한 내용: [Locale — Existing gettext](/ko/guide/ui-strings/python#gettext).

<a id="desktop"></a>
### Tkinter, Qt 및 PyWebView

각 Tkinter 위젯을 생성할 때 `t()` 또는 `_()`을 호출한 다음 `set_locale` 이후에 표시되는 텍스트를 다시 빌드하십시오. PyQt 및 PySide `self.tr("...")` 호출은 추출되며, `notr="true"`이 아닌 경우 Qt `.ui` 파일이 `<string>` 요소를 제공합니다. PyWebView 또는 PyWebKit의 경우 위 템플릿으로 Python 셸을 추출하고 `data-i18n` 마커를 사용하거나 로캘당 하나의 HTML 문서를 사용하여 HTML 페이지를 추출하십시오. 자세한 내용: [Locale — Tkinter](/ko/guide/ui-strings/python#tkinter), [PyQt / PySide](/ko/guide/ui-strings/python#pyqt) 및 [PyWebView](/ko/guide/ui-strings/python#pywebview).
