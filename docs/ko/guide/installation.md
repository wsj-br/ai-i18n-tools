<a id="installation"></a>
# 설치

이 페이지에서는 명령줄 인터페이스를 설치하고 기본 `ai-i18n-tools` 명령이 작동하도록 설정합니다. 이미 설치했나요? [빠른 시작](/ko/guide/quick-start)으로 이동하세요.

게시된 패키지는 이 에스 모듈 전용입니다. Node.js 또는 번들러에서 `import` 또는 `import()`을 사용하고, `require('ai-i18n-tools')`는 사용하지 마세요. 패키지는 `engines.node` `>=22.16.0`를 선언합니다. 이전 Node.js 버전은 지원되지 않습니다. npm 타르볼에는 `docs/` 아래의 영어 파일만 포함되며, `translated-docs/` 아래의 로캘별 사본은 [GitHub 저장소](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs)에 있습니다.

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### 독립 실행형 실행 파일

GitHub Releases는 Node.js 단일 실행 파일 빌드를 첨부합니다. Python 프로젝트는 Node.js 설치 없이 `extract`, `translate-ui`, `suggest-models`를 포함하여 해당 바이너리에서 CLI를 실행합니다.

Linux 및 macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

설치 프로그램은 시스템을 감지하고, 일치하는 실행 파일을 다운로드하고, `SHA256SUMS.txt`을 확인한 다음, 명령을 `ai-i18n-tools`(윈도우에서는 `ai-i18n-tools.exe`)로 설치하고 설치 디렉터리를 `PATH`에 추가합니다. 기본 디렉터리는 `~/.local/bin`입니다. 아직 명령을 찾을 수 없으면 새 터미널을 여세요. 릴리스를 고정하려면 `AI_I18N_VERSION`(예: `v1.11.0`)를 설정하고, 다른 디렉터리를 선택하려면 `AI_I18N_INSTALL_DIR`을 설정하세요.

바이너리는 공증되지 않았으며 오센티코드 서명도 되어 있지 않습니다. 맥오에스에서 서명되지 않은 프로그램을 승인하라는 메시지가 표시될 수 있습니다. 윈도우 스마트스크린에서 경고가 표시될 수 있습니다. 맥오에스 설치 프로그램은 체크섬이 일치하면 격리 플래그를 지웁니다.

각 릴리스에는 `SHA256SUMS.txt`, `install.sh`, `install.ps1`, `ai-i18n-tools-python-examples.zip`(네 가지 파이썬 예제)도 첨부됩니다. npm 타르볼과 실행 파일에는 이러한 예제가 포함되지 않습니다. 예제는 저장소에도 그대로 남아 있습니다.

<details>
<summary><code>ai-i18n-tools</code> 실행 파일을 설치하는 수동 지침</summary>

| 플랫폼 | 에셋 |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. 컴퓨터에 맞는 에셋과 `SHA256SUMS.txt`을 [GitHub 릴리스](https://github.com/wsj-br/ai-i18n-tools/releases) 페이지에서 다운로드하세요.
2. 체크섬을 확인하세요. 리눅스에서는 `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -`(다운로드한 에셋 이름 사용). 맥오에스에서는 `shasum -a 256 -c -`를 사용하여 같은 줄을 실행합니다. 윈도우에서는 `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash`을 실행하고 `SHA256SUMS.txt`의 해시와 비교합니다.
3. 다운로드한 파일 이름을 `ai-i18n-tools`로 바꾸고 해당 디렉터리를 `PATH`에 추가하세요.

리눅스 및 맥오에스, 리눅스 육십사비트 에셋을 예로 사용(다운로드한 에셋으로 대체):

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

`$HOME/.local/bin`이 아직 `PATH`에 없으면, 셸 프로필(`.bashrc`, `.bash_profile`, `.profile` 또는 `.zshrc`)에 다음을 추가하고 새 터미널을 여세요:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

윈도우(파워셸), `ai-i18n-tools-win-x64.exe`의 이름을 `ai-i18n-tools.exe`로 변경:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.local\bin" | Out-Null
Move-Item -Force .\ai-i18n-tools-win-x64.exe "$env:USERPROFILE\.local\bin\ai-i18n-tools.exe"
$installDir = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ([string]::IsNullOrEmpty($userPath)) {
  [Environment]::SetEnvironmentVariable("Path", $installDir, "User")
} elseif ($userPath -notlike "*${installDir}*") {
  [Environment]::SetEnvironmentVariable("Path", "$installDir;$userPath", "User")
}
```

새 터미널을 열고 `ai-i18n-tools --version`을 실행하세요. 모든 플랫폼에서 명령 이름은 `ai-i18n-tools`입니다.

</details>

활성 공급자의 에이피아이 키를 npm 설치와 같은 방식으로 설정합니다(아래 참조). 그런 다음:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

연습: [Python 앱에 i18n 추가하기](/ko/guide/add-i18n-to-python). 명령 참조: [suggest-models](/ko/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### 에이피아이 키 설정

번역 명령어(`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`)는 `ai-i18n-tools.config.json`의 공급자 구성과 활성 공급자의 API 키가 필요합니다. `ai-i18n-tools init -P <provider>`을 실행하여 해당 사전 설정을 스캐폴드하세요. 공급자 사전 설정 및 API 키: [LLM 공급자](/ko/guide/providers-and-models). `init`의 모델 목록은 시작점입니다. `suggest-models` 또는 대시보드 **모델** 탭을 사용하여 [AI 모델](/ko/guide/ai-models)의 목록으로 교체하세요. Ollama는 API 키가 필요 없는 유일한 내장 사전 설정입니다.

`init`에 전달하는 공급자와 일치하는 키를 설정하세요([프리셋 표](/ko/guide/providers-and-models#built-in-providers) 참조):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

또는 프로젝트 루트에 `.env` 파일을 생성하세요:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="using-the-cli"></a>
### CLI 사용하기

프로젝트에 `ai-i18n-tools`을 종속성 또는 개발 종속성으로 설치하세요(이 페이지 상단 참조). 패키지는 패키지 관리자가 `node_modules/.bin/ai-i18n-tools`에 링크하는 `bin` 항목을 선언합니다. 이 심(설치된 패키지 내부의 `bin/ai-i18n-tools.mjs`)은 컴파일된 명령줄 인터페이스를 로드합니다.

인터랙티브 셸에서 bare `ai-i18n-tools` 명령을 입력하려면 아래 옵션 중 하나를 구성하세요. 설정하지 않으면 로컬 설치 후에도 셸에서 바이너리를 찾을 수 없습니다.

direnv — 프로젝트 루트의 `.envrc`에 추가하세요(배시/지셸; [direnv.net](https://direnv.net/) 참조):

```bash
PATH_add node_modules/.bin
```

`direnv allow` 후에는 프로젝트에 `cd`할 때마다 bare 명령을 사용할 수 있습니다.

수동 경로 설정 — 프로젝트 루트(`node_modules/.bin`을 포함하는 디렉터리)에서 다음을 실행하세요. 해당 `PATH` 항목을 그대로 두는 한 이후에도 하위 디렉터리에서 계속 작동합니다. 중첩된 폴더에서 내보내기를 다시 실행하면 `$PWD`이 더 이상 프로젝트 루트를 가리키지 않으므로 실패합니다.

```bash
# bash/zsh — from the project root
export PATH="$PWD/node_modules/.bin:$PATH"
ai-i18n-tools sync
```

```powershell
# Windows PowerShell — from the project root
$env:Path = "$PWD\node_modules\.bin;$env:Path"
ai-i18n-tools sync
```

전역 설치 — 명령줄 인터페이스를 한 번 설치하고 아무 디렉터리에서나 호출하세요:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

pnpm을 사용할 때 전역 명령이 누락된 경우 머신당 한 번씩 `pnpm setup`을(를) 실행하고 새 셸을 여세요. pnpm은 자신의 전역 bin 디렉터리가 `PATH`에 있어야 하기 때문입니다. 전역 설치는 전역으로 고정된 버전을 사용합니다. 프로젝트별 버전 고정을 위해서는 direnv 또는 수동 PATH를 사용하여 `node_modules/.bin`가 프로젝트의 의존성을 가리키도록 하는 것을 권장합니다.

package.json 스크립트 — npm 또는 pnpm이 스크립트를 실행할 때 `node_modules/.bin`을 `PATH` 앞에 추가하므로, 셸 경로를 변경하지 않아도 스크립트 안에서 기본 명령 이름이 작동합니다:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

그런 다음 예를 들어 `pnpm run i18n:sync`을 실행합니다. 전체 권장 세트는 [권장 package.json 스크립트](/ko/guide/quick-start#recommended-packagejson-scripts)를 참조하세요.

대안 — `PATH`을 조정하고 싶지 않은 경우: `npx ai-i18n-tools …`(npm) 또는 `pnpm exec ai-i18n-tools …`(pnpm)를 사용합니다. `package.json` 항목 없이 일회성으로 설치 없이 실행하려면: `npx ai-i18n-tools <cmd>` 또는 `pnpm dlx ai-i18n-tools <cmd>`를 사용합니다.

<a id="cloned-monorepo"></a>
### 클론된 모노레포

[ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools)의 전체 클론에서 패키지를 개발하거나 작업 공간 예제를 실행할 때:

- 작업 공간 예제(`examples/console-app`, `examples/nextjs-app` 및 [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)에 나열된 기타 패키지) — 리포지토리 루트에서 `pnpm install`을 실행한 다음 `cd examples/<name>`를 실행합니다. 예제의 `pnpm run i18n:*` 스크립트를 사용하거나, PATH를 구성하고([CLI 사용하기](#using-the-cli) 참조) bare `ai-i18n-tools …`을 실행합니다. 작업 공간 [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml)은 `ai-i18n-tools`을 로컬 체크아웃에 연결합니다.
- 리포지토리 루트 — pnpm은 루트 패키지 자체의 `bin`를 `node_modules/.bin`에 연결하지 않습니다. 이 체크아웃의 `.envrc`은 `bin/`를 `PATH`에 추가하여 커밋된 `bin/ai-i18n-tools` 래퍼(게시된 `bin/ai-i18n-tools.mjs` 심 옆에 있음)가 `direnv allow` 이후에 bare 명령을 제공하도록 합니다. direnv가 없으면 `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` 또는 루트 `pnpm i18n:*` 스크립트(또는 셸 별칭 / `pnpm add -g .`)를 사용하세요.
- 독립 실행형 픽스처(`multi-provider`, `test-markdown`) — 픽스처 폴더에서 `node ../../bin/ai-i18n-tools.mjs …`을 사용합니다.

CLI 소스를 변경한 후 저장소 루트에서 `pnpm run build`을(를) 실행하세요. 빌드 단계 및 선택적 전역 설치 해결 방법은 [개발 가이드](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)를 참조하세요.

Linux, macOS 및 WSL에서는 레지스트리 설치 시 CLI 스크립트의 실행 권한 비트가 자동으로 설정됩니다. Windows에서는 패키지 관리자가 Node.js를 명시적으로 호출하는 `.cmd` 및 `.ps1` 쉼(Shim)을 생성합니다.

다음: [빠른 시작](/ko/guide/quick-start).
