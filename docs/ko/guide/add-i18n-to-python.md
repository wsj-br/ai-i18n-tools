<a id="add-i18n-to-a-python-app"></a>
# Python 앱에 i18n 추가하기

이 워크스루에서는 단일 언어로 작성된 Python 애플리케이션에 ai-i18n-tools를 사용하여 로캘을 추가하는 방법을 다룹니다. 안전한 호출 사이트 수정은 `migrate-python-i18n`에 의해 적용됩니다. 여전히 검토가 필요한 사항은 보고서에 나열됩니다.

이미 GNU gettext, Django 또는 Flask 카탈로그를 사용 중이신가요? 기존 호출을 유지하세요. 아래에서 일치하는 초기화 템플릿을 선택하고 `extract`이(가) 기존 `.po` 파일에서 비어 있는 카탈로그 슬롯을 채우도록 하세요.

<a id="install"></a>
## 설치

컴퓨터에 Node.js `>=22.16.0`이(가) 이미 설치되어 있다면 npm 패키지를 사용하세요([설치](/ko/guide/installation)). Python 프로젝트의 경우, 일반적으로 GitHub 릴리스에서 제공하는 독립 실행형 실행 파일을 사용하는 것이 좋습니다. Linux (`x64`, `arm64`), macOS (`arm64`, `x64`), Windows (`x64`)를 지원합니다. `SHA256SUMS.txt`을(를) 확인하고, Unix에서 `chmod +x`을(를) 실행한 다음, 파일을 `PATH`에 배치하세요. 바이너리는 서명되지 않았습니다. 에셋 이름 및 체크섬: [독립 실행형 실행 파일](/ko/guide/installation#standalone-executables).

`init`에 전달하는 공급자의 API 키를 설정합니다. 예를 들어, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama는 키가 필요하지 않습니다. 기타 프리셋: [내장 공급자](/ko/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## 템플릿 선택

| 현재 앱 | 명령어 | 얻는 것 |
| --- | --- | --- |
| 하드코딩된 문자열 또는 새로운 `t()` / `_()` 호출 | `ai-i18n-tools init -t ui-python -P cheaperinference` | 플랫한 영어 키 JSON 및 `i18n.py` |
| GNU gettext를 사용하고 플랫한 JSON도 원하는 경우 | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON과 `.po` / `.mo` 및 `i18n.py` |
| `translations/` 아래의 Flask 또는 Jinja 카탈로그 | `ai-i18n-tools init -t ui-python-flask -P groq` | Gettext 카탈로그 및 `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (`i18n.py` 없음) |

`sourceLocale` 및 `targetLocales`을(를) 편집하세요. `sourceLocale`은(는) 소스 내 문자열의 언어입니다(보통 `en`). 프레임워크 연결: [Python 통합](/ko/guide/integrations/python). 호출 형태 및 카탈로그 레이아웃: [Python 애플리케이션](/ko/guide/ui-strings/python).

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

<a id="migrate"></a>
## 호출 사이트 마이그레이션

`migrate-python-i18n`은(는) `--write`을(를) 전달하기 전까지는 드라이 런(dry run)으로 작동합니다. 항상 `migrate-python-i18n-report.md`을(를) 작성합니다. 생성된 `i18n.py` 파일은 건너뜁니다. `{value=}` 및 중첩된 형식 사양과 같은 디버그 필드는 보고되며 그대로 유지됩니다.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

드라이 런에서 수동 검토가 필요한 사이트가 나열되면 `--write`을(를) 실행하기 전에 보고서를 읽어보세요. 선택 사항인 `--report <path>`은(는) 보고서 경로를 변경합니다. 선택 사항인 `--ui-block`은(는) 스캔 범위를 하나의 UI 블록으로 제한합니다.

<a id="translate"></a>
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
## 런타임에 로캘 전환

`set_locale`은(는) `ContextVar` 토큰을 반환합니다. 요청이나 콜백이 종료될 때 이를 재설정하십시오.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

FastAPI 및 Flask 미들웨어는 `finally`(Flask: `teardown_request`)에서 재설정되어야 동시 요청 간에 로캘이 유출되지 않습니다. Django 프로젝트는 Django의 로캘 활성화를 유지하며 `i18n.py`을(를) 사용하지 않습니다. 프레임워크별 참고 사항: [각 프레임워크의 로캘](/ko/guide/ui-strings/python#locale).

<a id="examples"></a>
## 예시

| 예시 | 설명 |
| --- | --- |
| [python-streamlit](/ko/examples#python-streamlit) | 대시보드, `t()` / `_()`, 플랫 JSON |
| [python-fastapi](/ko/examples#python-fastapi) | 요청 범위 로캘, 플랫 JSON |
| [python-flask](/ko/examples#python-flask) | Flask + Jinja, 플랫 JSON |
| [python-gettext](/ko/examples#python-gettext) | 기존 gettext CLI; `translate-ui`은(는) `.po` 및 `.mo`을(를) 새로 고칩니다 |

`npx degit`을(를) 사용하여 하나를 복사하거나 GitHub 릴리스에서 `ai-i18n-tools-python-examples.zip`을(를) 다운로드하십시오. 명령어: [예시](/ko/examples#python-examples).
