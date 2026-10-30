<a id="coding-agent-skill"></a>
# 코딩 에이전트 스킬

한 번의 설치로 모든 사용자 스킬이 복사됩니다. [공유 스킬](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools)은 에이전트에게 `sync`을(를) 사용하여 `ai-i18n-tools`을(를) 설치하고 유지 관리하는 방법을 가르치며, 작업과 일치하는 참조만 로드합니다. 각 워크플로는 `/ai-i18n-vitepress`와(과) 같은 별도의 슬래시 명령입니다.

npm 패키지 또는 독립 실행형 실행 파일을 설치해도 스킬이 등록되지 않습니다. 각 에이전트에는 하나의 설치 방법을 사용하십시오.

<a id="install-with-the-skills-cli"></a>
## 스킬 CLI로 설치

이것은 Node.js 버전이 22.20 이상일 때 사용할 설치 방법입니다. 이 패키지 자체의 CLI는 Node.js 22.16을 허용하지만, 이는 스킬 CLI에는 너무 오래된 버전입니다. 22.16부터 22.19 버전까지 또는 Node.js가 없는 머신에서는 [스킬 디렉터리 다운로드](#download-the-skill-directory)를 사용하십시오.

에이전트가 작동하기를 원하는 프로젝트에서:

```bash
npx skills add wsj-br/ai-i18n-tools
```

이 명령은 공유 스킬과 각 워크플로 명령을 포함하여 `skills/` 아래의 모든 디렉터리를 설치합니다. 이 명령은 프로젝트에 이 저장소의 체크아웃을 남기지 않습니다. 기본 범위는 현재 프로젝트입니다. 사용자 계정으로 여러 프로젝트에 걸쳐 설치하려면 `-g`을(를) 추가하십시오.

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y`은(는) 원스텝 설치입니다. 모든 스킬을 설치하며, 프롬프트가 없습니다. `--all`이(가) 없으면 설치 프로그램은 어떤 스킬을 복사할지 묻습니다. `--list`은(는) 스킬을 출력하고 아무것도 설치하지 않습니다. `--skill` 및 `-a`은(는) 하나의 스킬과 하나의 에이전트에 대한 프롬프트를 건너뜁니다. `npx skills update`은(는) 이런 방식으로 설치된 스킬을 새로 고칩니다. 첫 설치 후에 추가된 스킬을 적용하려면 `add`을(를) 다시 실행하십시오.

설치하지 않고 스킬을 프롬프트로 출력하거나 지원되는 에이전트를 사용하여 실행하려면:

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

CLI는 머신에 설치된 코딩 에이전트를 감지합니다. 각 에이전트의 설치 경로는 [스킬 CLI 에이전트 목록](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)에 있습니다. 이 목록은 변경됩니다. 이 페이지는 해당 내용을 반복하지 않으며, 모든 코딩 도구가 스킬 폴더를 읽는다고 주장하지 않습니다.

스킬 CLI는 익명 사용 데이터를 수집합니다. 이를 끄려면 `DISABLE_TELEMETRY=1` 또는 `DO_NOT_TRACK=1`을(를) 설정하십시오.

설치 후, 해당 제품이 다시 로드해야 하는 경우 새 에이전트 세션을 시작하십시오. `/ai-i18n-vitepress`과(와) 같은 워크플로 명령을 입력하거나, 에이전트에게 `ai-i18n-tools` 스킬을 사용하도록 요청하십시오. 공유 스킬은 명령 이름을 지정하지 않는 요청에 대한 대체입니다. 발견된 스킬이 에이전트가 자체적으로 해당 스킬을 호출할 것이라는 보장은 아닙니다.

<a id="slash-commands"></a>
## 슬래시 명령

공유 `ai-i18n-tools` 스킬은 에이전트가 계속 사용할 수 있습니다. 다른 스킬은 명시적 명령입니다. 각 스킬은 공유 스킬을 따르며, 자체 템플릿과 검사만 적용합니다.

| 명령 | 워크플로 |
| --- | --- |
| `/ai-i18n-js` | JavaScript 또는 TypeScript 소스 문자열 UI |
| `/ai-i18n-python` | 생성된 Python 도우미 및 플랫 JSON 카탈로그 |
| `/ai-i18n-django` | Django, Flask-Babel 또는 일반 gettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlight 문서 |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | 바닐라 Astro 웹사이트 |
| `/ai-i18n-plain-html` | 브라우저에서 전환되는 하나의 HTML 파일 |
| `/ai-i18n-plain-html-docs` | 로케일당 하나의 HTML 트리 |
| `/ai-i18n-readme` | README 및 저장소 마크다운 |
| `/ai-i18n-migrate-intlayer` | Intlayer에서 `t()` 호출로의 일회성 이동 |
| `/ai-i18n-translate-intlayer` | Intlayer 사전을 제자리에서 채우기 |

`.agents/skills/` 또는 `.cursor/skills/`에 복사된 스킬은 이러한 명령으로 나타납니다. 현재 Cursor 버그로 인해 `/` 팔레트에서 `disable-model-invocation`를 설정하는 마켓플레이스 플러그인 스킬이 숨겨집니다. Claude Code, Codex, Copilot은 여전히 해당 명령을 표시합니다. Cursor에서 명령을 사용하려면 스킬 CLI 설치를 사용하세요. 일반적인 요청은 여전히 공유 스킬에 도달합니다.

<a id="download-the-skill-directory"></a>
## 스킬 디렉터리 다운로드

스킬 CLI를 사용할 수 없을 때 이 방법을 사용하세요. `ai-i18n-tools/`뿐만 아니라 모든 스킬 디렉터리를 복사하세요. 각 워크플로 명령은 `SKILL.md`을 포함하는 자체 폴더입니다. 하나의 스킬 경로에 대한 git clone과 `npx degit`는 모두 약 50MB의 저장소 소스 아카이브를 다운로드합니다.

[스킬 CLI 에이전트 목록](https://github.com/vercel-labs/skills/blob/main/docs/agents.md)에서 하나의 에이전트 디렉터리를 선택하세요. 아래 예시에서는 여러 에이전트가 읽는 `.agents/skills/`을 사용합니다. 기존 복사본을 교체하기 전에 해당 대상을 검사하세요. 에이전트당 하나의 복사본이면 충분합니다. 동일한 에이전트에 대해 다른 검색 폴더에 두 번째 복사본이 있으면 중복입니다.

npm 패키지에는 이미 디렉터리가 포함되어 있습니다. 패키지가 설치되면:

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

`node_modules`가 없는 경우, CLI가 보고하는 것과 동일한 버전의 npm tarball을 다운로드하세요. `ai-i18n-tools --version`은 버전을 출력한 다음 빌드 타임스탬프를 출력합니다. 버전 번호만 사용하세요. tarball 멤버는 `package/skills/`입니다.

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

`1.12.0`를 설치된 버전으로 교체하세요. 이는 현재 릴리스에서 작동합니다. 독립 실행형 실행 파일에는 스킬 파일이 포함되어 있지 않습니다. tarball을 `ai-i18n-tools --version`에 맞추세요.

이를 추가하는 릴리스부터 GitHub Releases는 `ai-i18n-tools-skill.zip`도 첨부합니다. 해당 zip 파일은 모든 스킬 디렉터리를 최상위 수준에 포함합니다. 에이전트 스킬 폴더에 압축을 풀어 `ai-i18n-tools/SKILL.md`과 `ai-i18n-vitepress/SKILL.md`와 같은 워크플로 폴더가 모두 포함되도록 하세요. 해당 zip 파일 이전에 게시된 릴리스에는 포함되어 있지 않습니다. 이전 zip 파일에는 `ai-i18n-tools/`만 포함되어 있습니다. 해당 릴리스에는 npm tarball을 사용하세요. 태그는 `v`에 CLI 버전을 더한 것이며, 예를 들어 해당 태그의 릴리스에 자산이 있으면 `v1.12.0`입니다.

<a id="agents-the-skills-cli-installs"></a>
## 스킬 CLI가 설치하는 에이전트

하나의 에이전트를 원할 때 `-a`에 ID를 전달하세요. 이 도구들을 위해 이 저장소에 다른 것은 필요하지 않습니다.

CLI 에이전트: Claude Code (`claude-code`), Codex CLI (`codex`), Gemini CLI (`gemini-cli`), Antigravity CLI (`antigravity-cli`), GitHub Copilot CLI (`github-copilot`), OpenCode (`opencode`), Goose (`goose`), Qwen Code (`qwen-code`), Kilo CLI (`kilo`), Grok Build (`grok`), Amp (`amp`), Crush (`crush`), Pi (`pi`), Kiro CLI (`kiro-cli`).

편집기 및 IDE: Cursor (`cursor`), Windsurf (`windsurf`), Devin for Terminal (`devin`), Zed (`zed`), Antigravity (`antigravity`), Trae (`trae`), Junie (`junie`), Replit (`replit`), Cline (`cline`), Roo Code (`roo`), Kilo Code (`kilo`), Continue (`continue`), Augment (`augment`), Factory Droid (`droid`), Tabnine CLI (`tabnine-cli`). 편집기의 GitHub Copilot은 CLI와 동일한 `github-copilot` ID를 사용합니다.

놓치기 쉬운 두 가지 경로 세부 정보:

- Cursor: skills CLI에서 프로젝트를 설치하면 `.agents/skills/`으로 이동합니다. `-g`은 `~/.cursor/skills/`로 이동합니다. Cursor 자체 문서에서도 프로젝트 내 `.cursor/skills/`을 허용합니다. 이 중 하나를 사용하세요.
- GitHub Copilot: skills CLI는 프로젝트에 `.agents/skills/`를, `-g`용으로 `~/.copilot/skills/`를 작성합니다. GitHub의 클라우드 에이전트 문서에서도 `.github/skills/`을 설명합니다. 해당 폴더는 모든 Copilot 채팅에서 읽히지 않습니다. 사용 중인 인터페이스에 대해 문서화된 폴더만 사용하세요.

Kiro CLI의 기본 에이전트는 추가 구성 없이 `.kiro/skills/`과 `~/.kiro/skills/`을 로드합니다. 사용자 지정 Kiro 에이전트는 `.kiro/agents/<agent>.json`에 나열된 설치된 스킬이 필요합니다.

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## 네이티브 카탈로그

일부 제품은 이 저장소의 카탈로그에서 스킬을 설치하기도 합니다. 각 에이전트마다 하나의 채널(카탈로그 또는 skills CLI)을 사용하세요. 패키지 업그레이드는 수동으로 복사된 스킬을 새로 고치지 않습니다. `npx skills update`은 skills CLI 설치를 새로 고칩니다. 카탈로그 설치는 해당 제품의 업데이트 명령을 따릅니다.

- Cursor Marketplace, 목록 승인 후: Cursor Marketplace에서 `ai-i18n-tools`을(를) 설치합니다. 해당 목록이 존재하기 전까지는 skills CLI를 사용하세요. [Cursor Directory](https://cursor.directory)는 별도의 커뮤니티 목록입니다.
- Claude Code, Claude Code 세션에서:

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI:

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

그런 다음 해당 마켓플레이스에서 `ai-i18n-tools` 플러그인을 설치합니다. 플러그인 ID는 `ai-i18n-tools@ai-i18n-tools`입니다. Copilot CLI는 Claude Code가 사용하는 것과 동일한 카탈로그 파일을 읽습니다.

- Codex:

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

ChatGPT 작업 공간 목록은 작업 공간 관리자가 별도로 게시합니다. 이는 이 명령과는 다른 설치입니다.

<a id="agents-without-a-skills-install"></a>
## 스킬 설치가 없는 에이전트

이 제품들은 skills CLI 에이전트 목록에 없습니다. 이 저장소는 이들을 위한 별도의 스킬 폴더를 제공하지 않습니다. `AGENTS.md`과 같은 프로젝트 지침에서 에이전트를 [소비자 컨텍스트](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md)로 지정하세요.

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

해당 파일은 문서 사이트 및 저장소 URL을 사용하므로, 에이전트가 이 저장소를 읽을 수 없을 때도 지침이 작동합니다. 이전 CLI의 경우, 일치하는 릴리스 태그에서 동일한 경로를 엽니다. 소비자 프로젝트는 이 컨텍스트 파일을 사용합니다. 이 저장소를 변경할 때는 관리자 `AGENTS.md`이(가) 적용됩니다.

이 그룹의 제품: Aider, gptme, Amazon Q Developer CLI, DeepSeek Harness, JetBrains AI Assistant, Sourcegraph Cody, Qodo, Tabnine IDE 플러그인, CodeGeeX, AskCodi. Junie는 skills CLI 설치를 지원하는 JetBrains 에이전트입니다. Tabnine CLI도 마찬가지입니다. AiderDesk는 Aider와 다른 애플리케이션입니다.

CodeLayer와 Superset은 자체 스킬 디렉터리가 없습니다. CodeLayer는 Claude Code를 실행하므로, Claude Code용 스킬을 설치하세요. Superset은 구성한 CLI 에이전트를 실행하므로, 해당 에이전트용 스킬을 설치하세요.

<a id="stay-on-the-same-version"></a>
## 동일한 버전 유지

스킬을 `ai-i18n-tools` 명령과 동일한 릴리스로 유지하세요. npm 업그레이드 및 최신 독립 실행 파일은 수동으로 복사된 스킬을 원래 위치에 둡니다. 일치하는 버전에서 스킬을 다시 설치하거나, skills CLI 설치를 위해 `npx skills update`을(를) 실행하세요.

온라인 문서에는 설치된 명령보다 최신 릴리스가 설명되어 있을 수 있습니다. 플래그에는 `ai-i18n-tools --help`을(를) 선호합니다. 추가 참조: [설치](/ko/guide/installation), [구성](/ko/reference/configuration), [제공자](/ko/guide/providers-and-models), [CLI 참조](/ko/reference/cli-commands/).
