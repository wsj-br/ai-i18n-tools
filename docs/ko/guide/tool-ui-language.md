<a id="tool-ui-language"></a>
# 도구 UI 언어

도구는 프로젝트의 `sourceLocale` / `targetLocales`와 독립적으로 자체 사용자 인터페이스 — CLI 도움말 텍스트, 빈번한 로그/요약/오류 메시지, 번역 대시보드 — 를 현지화합니다. 설정이 필요하지 않으며, 기본적으로 도구는 OS 로케일을 따릅니다.

<a id="locale-resolution"></a>
## 로케일 결정

UI 로케일은 다음 소스에서 결정되며, 우선순위가 높은 순서입니다:

1. `-L` / `--ui-lang <code>` 전역 플래그(예: `-L pt-BR`).
2. `AI_I18N_LANG` 환경 변수(예: `export AI_I18N_LANG=es`).
3. `ai-i18n-tools.config.json`의 `uiLanguage` 구성 키(BCP-47 문자열).
4. 호스트 OS 로캘(`Intl.DateTimeFormat().resolvedOptions().locale` 경유).

<a id="matching-and-fallback"></a>
## 매칭 및 폴백

요청된 로케일은 배포된 UI 언어와 정확하게 일치하거나 가장 가까운 변형과 일치합니다(예: `pt-PT`은 `pt-BR`로, `en-US`는 `en-GB`으로 확인됨). 일치하는 항목이 없으면 소스 로케일(`en-GB`)로 대체됩니다. 플래그, 환경 변수 또는 `uiLanguage`를 통해 명시적으로 UI 언어가 요청되었지만 배포된 번들이 일치하지 않으면 CLI는 기본 로케일이 사용될 것이라는 경고를 한 번 표시합니다. 호스트 OS에서만 추론된 로케일은 경고하지 않습니다.

<a id="shipped-ui-languages"></a>
## 제공되는 UI 언어

`en-GB` (소스) 및 `de`, `es`, `fr`, `hi-Latn`, `ja`, `ko`, `pt-BR`, `zh-Hans`, `zh-Hant`.

<a id="translation-dashboard"></a>
## 번역 대시보드

번역 대시보드는 `GET /api/ui-i18n`에서 결정된 로케일, 레이아웃 방향, 번역 번들을 읽어 로드 시 적용합니다 (`<html lang>` / `dir`를 설정하고 `data-i18n*` 속성을 통해 정적 마크업을 현지화합니다).

<a id="related"></a>
## 관련 항목

- [`AI_I18N_LANG`](/ko/reference/environment-variables) — 환경 변수 재정의
- [`uiLanguage`](/ko/reference/configuration#uilanguage-optional) — 설정 키 재정의
- [`-L` / `--ui-lang`](/ko/reference/cli-commands/) — CLI 플래그 재정의 (최우선)
