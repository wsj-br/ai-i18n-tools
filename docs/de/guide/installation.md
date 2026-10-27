<a id="installation"></a>
# Installation

Diese Seite installiert die CLI und sorgt dafür, dass der reine Befehl `ai-i18n-tools` funktioniert. Bereits installiert? Gehen Sie zu [Schnellstart](/de/guide/quick-start).

Das veröffentlichte Paket ist nur ESM. Verwenden Sie `import` oder `import()` in Node.js oder Ihrem Bundler; verwenden Sie nicht `require('ai-i18n-tools')`. Das Paket deklariert `engines.node` `>=22.16.0`; ältere Node.js-Versionen werden nicht unterstützt. Das npm-Tarball enthält nur englische Dateien unter `docs/`; sprachspezifische Kopien unter `translated-docs/` befinden sich im [GitHub-Repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

<a id="standalone-executables"></a>
### Eigenständige ausführbare Dateien

GitHub Releases fügen einen Node.js Single-Executable-Build bei. Python-Projekte führen die CLI über diese Binärdatei aus, einschließlich `extract`, `translate-ui` und `suggest-models`, ohne dass eine Node.js-Installation erforderlich ist.

Linux und macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

Das Installationsprogramm erkennt das System, lädt die passende ausführbare Datei herunter, prüft `SHA256SUMS.txt`, installiert den Befehl als `ai-i18n-tools` (`ai-i18n-tools.exe` unter Windows) und fügt das Installationsverzeichnis zu `PATH` hinzu. Das Standardverzeichnis ist `~/.local/bin`. Öffnen Sie ein neues Terminal, falls der Befehl noch nicht gefunden wird. Setzen Sie `AI_I18N_VERSION` (zum Beispiel `v1.11.0`), um eine Version festzulegen, oder `AI_I18N_INSTALL_DIR`, um ein anderes Verzeichnis zu wählen.

Die Binärdateien sind nicht notariell beglaubigt oder Authenticode-signiert. macOS fragt Sie möglicherweise, ob Sie ein unsigniertes Programm genehmigen möchten. Windows SmartScreen zeigt möglicherweise eine Warnung an. Das macOS-Installationsprogramm löscht das Quarantäne-Flag, nachdem die Prüfsumme übereinstimmt.

Jede Version enthält auch `SHA256SUMS.txt`, `install.sh`, `install.ps1` und `ai-i18n-tools-python-examples.zip` (die vier Python-Beispiele). Das npm-Tarball und die ausführbare Datei enthalten diese Beispiele nicht. Sie bleiben ebenfalls im Repository.

<details>
<summary>Manuelle Anweisungen zur Installation der ausführbaren Datei <code>ai-i18n-tools</code></summary>

| Plattform | Asset |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

1. Laden Sie das Asset, das zu Ihrem Computer und `SHA256SUMS.txt` passt, von der [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases)-Seite herunter.
2. Überprüfen Sie die Prüfsumme. Unter Linux, `grep ' ai-i18n-tools-linux-x64$' SHA256SUMS.txt | sha256sum -c -` (verwenden Sie den Namen des heruntergeladenen Assets). Unter macOS, die gleiche Zeile mit `shasum -a 256 -c -`. Unter Windows, `(Get-FileHash -Algorithm SHA256 .\ai-i18n-tools-win-x64.exe).Hash` und vergleichen Sie es mit dem Hash in `SHA256SUMS.txt`.
3. Benennen Sie die heruntergeladene Datei in `ai-i18n-tools` um und legen Sie dieses Verzeichnis in `PATH` ab.

Linux und macOS, am Beispiel des Linux x64 Assets (ersetzen Sie das von Ihnen heruntergeladene Asset):

```bash
mkdir -p "$HOME/.local/bin"
mv ai-i18n-tools-linux-x64 "$HOME/.local/bin/ai-i18n-tools"
chmod +x "$HOME/.local/bin/ai-i18n-tools"
```

Wenn `$HOME/.local/bin` noch nicht in `PATH` enthalten ist, fügen Sie dies zum Shell-Profil (`.bashrc`, `.bash_profile`, `.profile` oder `.zshrc`) hinzu und öffnen Sie ein neues Terminal:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Windows (PowerShell), Umbenennen von `ai-i18n-tools-win-x64.exe` in `ai-i18n-tools.exe`:

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

Öffnen Sie ein neues Terminal und führen Sie `ai-i18n-tools --version` aus. Der Befehlsname ist `ai-i18n-tools` auf jeder Plattform.

</details>

Legen Sie den API-Schlüssel für den aktiven Anbieter auf die gleiche Weise fest wie bei einer npm-Installation (siehe unten). Dann:

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Anleitung: [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). Befehlsreferenz: [suggest-models](/de/reference/cli-commands/models#suggest-models).

<a id="set-the-api-key"></a>
### API-Schlüssel festlegen

Übersetzungsbefehle (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) erfordern eine Anbieterkonfiguration in `ai-i18n-tools.config.json` und einen API-Schlüssel für den aktiven Anbieter. Führen Sie `ai-i18n-tools init -P <provider>` aus, um diese Voreinstellung einzurichten. Anbietervoreinstellungen und API-Schlüssel: [LLM-Anbieter](/de/guide/providers-and-models). Die Modellliste aus `init` ist ein Ausgangspunkt. Ersetzen Sie sie mit `suggest-models` aus [KI-Modelle](/de/guide/ai-models) oder über den Tab **Modelle** im Dashboard. Ollama ist die einzige integrierte Voreinstellung, die keinen API-Schlüssel benötigt.

Legen Sie den Schlüssel fest, der dem Anbieter entspricht, den Sie an `init` übergeben (siehe die [Preset-Tabelle](/de/guide/providers-and-models#built-in-providers)):

```bash
# init -P openrouter
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# init -P openai
# export OPENAI_API_KEY=sk-your-key-here
```

Oder erstellen Sie eine `.env`-Datei im Projektstammverzeichnis:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="using-the-cli"></a>
### Verwendung der CLI

Installieren Sie `ai-i18n-tools` als Abhängigkeit oder Entwicklungsabhängigkeit in Ihrem Projekt (siehe oben auf dieser Seite). Das Paket deklariert einen `bin`-Eintrag, den Ihr Paketmanager mit `node_modules/.bin/ai-i18n-tools` verknüpft. Dieser Shim (`bin/ai-i18n-tools.mjs` innerhalb des installierten Pakets) lädt die kompilierte CLI.

Um den reinen Befehl `ai-i18n-tools` in einer interaktiven Shell einzugeben, konfigurieren Sie eine der folgenden Optionen. Ohne Einrichtung kann die Shell die Binärdatei auch nach einer lokalen Installation nicht finden.

direnv — fügen Sie dies einer `.envrc` im Projekt-Root hinzu (bash/zsh; siehe [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Nach `direnv allow` ist der reine Befehl verfügbar, wann immer Sie sich in das Projekt `cd`.

Manueller PATH — führen Sie diese Befehle vom Projekt-Root aus (dem Verzeichnis, das `node_modules/.bin` enthält). Unterverzeichnisse funktionieren danach weiterhin, solange Sie den `PATH`-Eintrag beibehalten; ein erneutes Ausführen des Exports aus einem verschachtelten Ordner schlägt fehl, da `$PWD` nicht mehr auf das Projekt-Root verweist.

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

Globale Installation — installieren Sie die CLI einmal und rufen Sie sie von jedem Verzeichnis aus auf:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Führen Sie bei pnpm `pnpm setup` einmal pro Maschine aus (und öffnen Sie eine neue Shell), wenn globale Befehle fehlen – pnpm benötigt sein globales Bin-Verzeichnis auf `PATH`. Eine globale Installation verwendet die global festgelegte Version. Für die projektbezogene Versionsfestlegung bevorzugen Sie direnv oder den manuellen PATH, damit `node_modules/.bin` auf die Abhängigkeit des Projekts verweist.

package.json-Skripte — wenn npm oder pnpm ein Skript ausführt, stellt es `node_modules/.bin` vor `PATH`, sodass der reine Befehlsname innerhalb von Skripten ohne Änderungen am Shell-PATH funktioniert:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Führen Sie dann z. B. `pnpm run i18n:sync` aus. Die vollständige empfohlene Sammlung finden Sie unter [Empfohlene package.json-Skripte](/de/guide/quick-start#recommended-packagejson-scripts).

Alternativen – falls Sie `PATH` nicht anpassen möchten: `npx ai-i18n-tools …` (npm) oder `pnpm exec ai-i18n-tools …` (pnpm). Für eine einmalige Ausführung ohne Installation und ohne `package.json`-Eintrag: `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-monorepo"></a>
### Geklontes Monorepo

Beim Entwickeln des Pakets oder Ausführen von Workspace-Beispielen aus einem vollständigen Klon von [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- Workspace-Beispiele (`examples/console-app`, `examples/nextjs-app` und die anderen Pakete, die in [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) aufgeführt sind) – führen Sie `pnpm install` im Repository-Stammverzeichnis aus, dann `cd examples/<name>`. Verwenden Sie die `pnpm run i18n:*`-Skripte des Beispiels, oder konfigurieren Sie PATH (siehe [Verwenden der CLI](#using-the-cli)) und führen Sie `ai-i18n-tools …` direkt aus. Workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) verlinkt `ai-i18n-tools` mit Ihrem lokalen Checkout.
- Repository-Stammverzeichnis – pnpm verlinkt das eigene `bin` des Stammverzeichnis-Pakets nicht in `node_modules/.bin`. Das `.envrc` dieses Checkouts fügt `bin/` zu `PATH` hinzu, sodass der committete `bin/ai-i18n-tools`-Wrapper (neben dem veröffentlichten `bin/ai-i18n-tools.mjs`-Shim) den direkten Befehl nach `direnv allow` bereitstellt. Ohne direnv verwenden Sie `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` oder die `pnpm i18n:*`-Skripte im Stammverzeichnis (oder einen Shell-Alias / `pnpm add -g .`).
- Eigenständige Fixtures (`multi-provider`, `test-markdown`) – verwenden Sie aus dem Fixture-Ordner `node ../../bin/ai-i18n-tools.mjs …`.

Führen Sie `pnpm run build` im Repository-Stammverzeichnis aus, nachdem Sie die CLI-Quelle geändert haben. Siehe den [Entwicklungsleitfaden](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) für Build-Schritte und optionale Workarounds für die globale Installation.

Unter Linux, macOS und WSL setzen Registry-Installationen automatisch das Ausführbar-Bit für das CLI-Skript. Unter Windows erzeugen Paketmanager `.cmd`- und `.ps1`-Shims, die Node explizit aufrufen.

Weiter: [Schnellstart](/de/guide/quick-start).
