<a id="cli--models--catalog"></a>
# CLI — 모델 및 카탈로그

<a id="check-models"></a>
### `check-models`

**개요:** `ai-i18n-tools check-models`

활성 프로바이더의 `GET /models` 목록(멤버십 및 `expiration_date`)에 대해 구성된 각 모델 ID를 검증합니다. 해당 프로바이더의 API 키가 필요합니다(Ollama와 같은 키가 필요 없는 프로바이더의 경우 없음). 구성된 ID 중 누락되거나 만료된 것이 있으면 0이 아닌 값으로 종료되며, 프로바이더의 `requestTimeoutMs`를 준수합니다. 프로바이더가 가격을 반환하는 경우(예: OpenRouter), 프롬프트/컴플리션당 1M 토큰당 USD도 표시합니다.

**참고:** [LLM 프로바이더](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**개요:** `ai-i18n-tools list-models`

활성 프로바이더가 `GET /models` 목록을 통해 알리는 모든 모델을 나열합니다(ID 기준 정렬, 활성 프로바이더는 구성 `provider` 키를 따르며 `-P` / `--provider`로 재정의 가능). 해당 프로바이더의 API 키가 필요합니다(Ollama와 같은 키가 필요 없는 프로바이더의 경우 없음). 프로바이더가 가격을 반환하는 경우(예: OpenRouter), 프롬프트/컴플리션당 1M 토큰당 USD도 표시하며 `expiration_date`를 지난 항목에 태그를 지정합니다.

**주요 옵션:** `-P` / `--provider`

**참고:** [LLM 프로바이더](/guide/providers-and-models)

---

<a id="bench-models"></a>
### `bench-models`

**개요:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

하나의 샘플을 격리 상태에서 번역하여 구성된 각 모델을 벤치마크합니다(단일 모델 클라이언트, 폴백 체인 없음). 모델 ID, 입력/출력 토큰, 실제 번역 시간, USD 비용(비용을 보고하지 않는 프로바이더의 경우 `—`)의 표를 출력하며, 합계 행과 모델별 실패도 함께 표시합니다.

모델은 기본적으로 활성 프로바이더의 `translationModels`, `uiModels`, `localeModels` ID의 합집합입니다(`--model`로 재정의 가능); 샘플은 기본적으로 내장 영어 마크다운 블록입니다(`--text` / `--file`로 재정의 가능); 소스/타겟은 기본적으로 구성 `sourceLocale` 및 첫 번째 `docs[]` 타겟 로케일이며, 최상위 `targetLocales`로 폴백합니다(`--source` / `--target`로 재정의 가능). 모델을 병렬로 실행하며, 구성 `concurrency`(기본값 4)에 의해 제한됩니다; 각 모델은 여전히 개별적으로 시간이 측정됩니다. 활성 프로바이더의 API 키가 필요합니다.

**주요 옵션:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**개요:** `ai-i18n-tools list-languages [search]`

번들된 UI 언어 카탈로그(`data/ui-languages-complete.json`)를 사람이 읽을 수 있는 표(코드, 텍스트 방향, 영어 이름, 원어 이름)로 나열합니다. 구성이나 API 키가 필요하지 않습니다. 선택적 `search` 용어를 전달하여 코드, 원어 이름, 영어 이름 또는 방향에 해당 용어가 포함된 항목만 유지합니다(대소문자 구분 안 함)(예: `list-languages portuguese`, `list-languages rtl`, `list-languages zh`).
