<a id="glossary"></a>
# 용어집

용어집은 모든 번역에서 일관된 제품 용어를 보장합니다. 사용자는 하나 이상의 언어에 대해 용어 번역을 정의할 수 있으며, AI 모델은 최적의 번역을 추측하는 대신 이 미리 정의된 번역을 사용합니다. 또한 제품명과 같은 특정 용어가 다른 언어로 번역될 때 원문 그대로 유지되도록 하는 데에도 사용할 수 있습니다.

모델에는 두 가지 유형의 가이드가 전송됩니다.

- `glossary.userGlossary`의 **용어 행**(및 일부 파이프라인의 경우 `glossary.uiGlossary`의 기존 UI 번역). 이 행은 해당 소스 용어가 번역 대상 텍스트에 나타나는 경우에만 포함됩니다.
- `glossary.contextFiles`의 **프로젝트 컨텍스트 파일**. 전체 브리프는 모든 UI, 문서, JSON, SVG 및 교정 프롬프트에 주입됩니다. 해당 섹션은 [아래](#project-context-files)에 있습니다.

<a id="how-the-glossary-works"></a>
## 용어집 작동 방식

<a id="where-terms-come-from"></a>
### 용어 출처

| 소스 | 구성 | 사용 주체 |
| --- | --- | --- |
| UI 카탈로그 | `glossary.uiGlossary` — 일반적으로 `ui.stringsJson`과(와) 동일한 경로 | `translate-docs`, `translate-json`, `translate-svg` |
| 사용자 CSV | `glossary.userGlossary` | `translate-ui`, `proofread-ui`, `translate-docs`, `translate-json`, `translate-svg` |

`uiGlossary`은(는) `strings.json`에 이미 저장된 번역을 힌트로 재사용하므로 문서, JSON 및 SVG가 UI와 일관성을 유지합니다. `translate-ui` 및 `proofread-ui`은(는) `uiGlossary`을(를) 읽지 않으며 사용자 CSV에서만 힌트를 가져오므로, 잘못된 UI 번역이 기본 용어로 다시 피드백되지 않습니다.

사용자 CSV가 UI 카탈로그보다 우선합니다. `locale`이(가) 특정 코드인 행은 해당 로케일에 대한 `*` 행과 UI 카탈로그 번역을 모두 대체합니다. `*`의 `locale`은(는) UI 카탈로그에서 아직 번역이 없는 모든 `targetLocales` 항목에 동일한 번역을 적용합니다.

간결한 UI 레이블 약어(`Alm.`과(와) 같은 후행 점 또는 `Size` → `Tam`과(와) 같은 짧은 단일 토큰 압축)는 UI 번역에 계속 사용할 수 있습니다. 문서 프롬프트는 이를 건너뛰므로, 모델이 마크다운이나 MDX에서 <code v-pre>{{…}}</code> 토큰을 임의로 생성하도록 유도하지 않습니다.

<a id="when-a-term-is-sent"></a>
### 용어가 전송되는 시점

일치는 대소문자를 구분하지 않으며 단어 경계(공백 또는 문장 부호)에서 중지됩니다. 더 긴 용어가 우선하며, 겹치는 일치는 삭제됩니다. 용어가 현재 배치와 일치하면 프롬프트는 `"dashboard" → "Tableau"`과(와) 같은 힌트를 받습니다. 해당 행에 **컨텍스트** 참고 사항이 있는 경우, 해당 참고 사항은 해당 일치 항목에만 추가됩니다.

**컨텍스트**는 소스 언어 사용 가이드(용어의 의미 또는 사용 방법)입니다. 이는 번역이 아닙니다. **컨텍스트** 참고 사항이나 `glossary.contextFiles` 콘텐츠를 변경하면 다음 실행 시 영향을 받는 로케일의 캐시된 번역이 새로 고쳐지므로 `--force`이(가) 필요하지 않습니다. 기본 **번역**만 변경하면 `--force` 또는 `--force-update`을(를) 전달할 때까지 기존 캐시가 유지됩니다. 대시보드에서 편집한 행은 `user-edited`(으)로 유지됩니다.

<a id="force"></a>
### 강제 적용

**강제 적용**이(가) `true`, `yes` 또는 `1`인 경우, 모델이 텍스트를 보기 전에 소스 용어가 텍스트에서 제거되고 나중에 기본 번역이 다시 기록됩니다. 이 문구는 제안이 아닌 정확한 표현입니다. 동일한 단어 경계 및 최장 일치 규칙이 적용됩니다. 모델이 번역을 선호하지만 여전히 굴절시킬 수 있는 경우에는 **강제 적용**을(를) 비워두거나 `false`(으)로 두세요.

<a id="generate-a-glossary"></a>
## 용어집 생성

`glossary-generate`은(는) 표준 헤더가 있는 빈 CSV를 작성합니다. 구성의 `glossary.userGlossary`을(를) 사용하거나, 해당 키가 설정되지 않은 경우 `glossary-user.csv`을(를) 사용합니다. 이미 존재하는 파일을 덮어쓰지 않습니다(종료 **1**).

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

구성에서 파일을 지정합니다.

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

대시보드에서 직접 CSV 용어집 파일을 생성할 수도 있습니다. [용어집](/ko/guide/translation-dashboard/glossary) 탭에서 처음 **추가** 작업을 수행할 때 `glossary.userGlossary`이(가) 지정되어 있고 파일이 아직 존재하지 않으면 파일이 생성됩니다. `glossary.autoAddUserEditedToGlossary`이(가) `true`(기본값)로 설정된 경우 대시보드에서 UI 문자열을 수정하면 다음 `translate-ui` 실행 시 해당 변경 내용이 CSV에 추가됩니다. 또한 대시보드는 CSV 용어집 편집기 역할을 하여 UI 내에서 행을 추가, 편집 또는 필터링할 수 있습니다.

<a id="csv-columns"></a>
## CSV 열

헤더 행:

```text
Original language string,locale,Translation,Force,Context
```

`Original language string` 대신 `en` 또는 `English`이(가) 허용됩니다. `Context` 대신 `Notes`이(가) 허용됩니다.

| 열 | 의미 |
| --- | --- |
| **원본 언어 문자열** | 소스 로케일의 소스 용어 또는 구문 |
| **로케일** | 대상 로케일 코드, 또는 모든 대상에 대한 `*` |
| **번역** | 선호하는 번역 |
| **강제** | 이 문구를 강제하려면 `true`, `yes` 또는 `1`를 지정하고, 그렇지 않으면 힌트로 사용 |
| **컨텍스트** | 선택 사항인 소스 언어 설명. 이 용어가 일치할 때만 전송됨 |

<a id="examples"></a>
## 예시

모든 로케일에 대한 제품 용어 하나, 강제된 독일어 레이블, 그리고 모델이 문자 그대로 받아들일 수 있는 단어를 설명하는 프랑스어 행:

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

프로젝트 요약과 결합 시:

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

필드 참조: [구성의 `glossary`](/ko/reference/configuration#glossary). 명령 참조: [`glossary-generate`](/ko/reference/cli-commands/tools#glossary-generate).

<a id="project-context-files"></a>
## 프로젝트 컨텍스트 파일

`glossary.contextFiles`는 단일 CSV 행에 속하지 않는 제품 수준의 가이드를 위한 것입니다: 제품이 무엇인지, 누구를 위한 것인지, 어조, 그리고 오역하기 쉬운 용어입니다. config를 하나 이상의 cwd 상대 경로의 `.md` / `.txt` 파일로 지정하면, 나열된 순서대로 연결되어 모든 UI, 문서, JSON, SVG 및 교정 프롬프트에 주입됩니다.

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

브리프를 **소스 로케일**로 작성하고, `glossary.contextMaxChars`(기본값 `12000`)를 크게 밑도록 유지하며, 해당 파일도 번역하려는 경우가 아니라면 `docs[].contentPaths` 외부에 저장하십시오. [구성의 `glossary`](/ko/reference/configuration#glossary)를 참조하십시오.

<a id="generate-a-context-file-with-an-ai-agent"></a>
### AI 에이전트로 컨텍스트 파일 생성

에이전트(Cursor, Claude Code, Copilot 등)에게 리포지토리를 읽고 브리프를 작성하도록 요청하십시오. 다음과 같은 프롬프트를 붙여넣으십시오:

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

다음 `sync` / `translate-*` 실행 전에 파일을 검토하십시오. 파일을 변경하면 해당 실행에서 각 로케일의 캐시된 번역이 무효화되므로, 품질이 양호해지면 브리프를 안정적으로 유지하십시오.
