<a id="installation"></a>
# Installation

Das veröffentlichte Paket ist **ausschließlich ESM**. Verwenden Sie `import`/`import()` in Node.js oder Ihrem Bundler; verwenden Sie nicht `require('ai-i18n-tools')`. Das Paket deklariert `engines.node` `>=22.16.0`; ältere Node.js-Versionen werden nicht unterstützt. Die npm-Tarball-Datei enthält nur englische Dateien unter `docs/`; sprachspezifische Kopien unter `translated-docs/` befinden sich im [GitHub-Repository](https://github.com/wsj-br/ai-i18n-tools/tree/main/translated-docs).

```bash
npm install ai-i18n-tools
# or
pnpm add ai-i18n-tools
# or
yarn add ai-i18n-tools
```

ai-i18n-tools enthält einen eigenen Zeichenketten-Extraktor. Wenn Sie zuvor `i18next-scanner`, `babel-plugin-i18next-extract` oder Ähnliches verwendet haben, können Sie diese Dev-Abhängigkeiten nach der Migration entfernen.

<a id="using-the-cli"></a>
### Verwendung der CLI

Installieren Sie `ai-i18n-tools` als Abhängigkeit oder devDependency in Ihrem Projekt (siehe [Installation](#installation) oben). Das Paket deklariert einen `bin`-Eintrag, den Ihr Paketmanager mit `node_modules/.bin/ai-i18n-tools` verknüpft. Dieser Shim (`bin/ai-i18n-tools.mjs` innerhalb des installierten Pakets) lädt die kompilierte CLI.

Um den reinen Befehl `ai-i18n-tools` in einer interaktiven Shell einzugeben, konfigurieren Sie eine der folgenden Optionen. Ohne Einrichtung kann die Shell die Binärdatei auch nach einer lokalen Installation nicht finden.

**direnv** – zu einer `.envrc` im Projektstamm hinzufügen (bash/zsh; siehe [direnv.net](https://direnv.net/)):

```bash
PATH_add node_modules/.bin
```

Nach `direnv allow` ist der reine Befehl verfügbar, wann immer Sie sich in das Projekt `cd`.

**Manueller PATH** – führen Sie diese Befehle vom **Projektstammverzeichnis** aus (dem Verzeichnis, das `node_modules/.bin` enthält). Unterverzeichnisse funktionieren danach weiterhin, solange Sie den Eintrag `PATH` beibehalten; ein erneuter Export aus einem verschachtelten Ordner schlägt fehl, da `$PWD` nicht mehr auf das Projektstammverzeichnis zeigt.

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

**Globale Installation** – die CLI einmal installieren und von jedem Verzeichnis aus aufrufen:

```bash
npm install -g ai-i18n-tools
# or
pnpm add -g ai-i18n-tools
```

Führen Sie bei pnpm `pnpm setup` einmal pro Maschine aus (und öffnen Sie eine neue Shell), wenn globale Befehle fehlen – pnpm benötigt sein globales Bin-Verzeichnis auf `PATH`. Eine globale Installation verwendet die global festgelegte Version. Für die projektbezogene Versionsfestlegung bevorzugen Sie direnv oder den manuellen PATH, damit `node_modules/.bin` auf die Abhängigkeit des Projekts verweist.

**`package.json`-Skripte** – wenn npm oder pnpm ein Skript ausführt, wird `node_modules/.bin` an `PATH` vorangestellt, sodass der reine Befehlsname innerhalb von Skripten ohne Änderungen des Shell-PATH funktioniert. Bevorzugen Sie `sync` gegenüber dem manuellen Verketten von Übersetzungsschritten – Reihenfolge und Feature-Flags können bei manueller Ausführung leicht falsch sein:

```json
"scripts": {
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:sync": "ai-i18n-tools sync",
  "i18n:translate:ui": "ai-i18n-tools translate-ui",
  "i18n:translate:svg": "ai-i18n-tools translate-svg",
  "i18n:translate:docs": "ai-i18n-tools translate-docs",
  "i18n:translate:json": "ai-i18n-tools translate-json",
  "i18n:dashboard": "ai-i18n-tools dashboard"
}
```

Führen Sie dann z. B. `pnpm run i18n:sync` aus. Eine vollständige Liste der empfohlenen Skripte finden Sie unter [Empfohlene `package.json`-Skripte](/de/guide/quick-start#recommended-packagejson-scripts).

**Alternativen** – wenn Sie `PATH` nicht anpassen möchten: `npx ai-i18n-tools …` (npm) oder `pnpm exec ai-i18n-tools …` (pnpm). Für eine einmalige Installation ohne `package.json`-Eintrag: `npx ai-i18n-tools <cmd>` oder `pnpm dlx ai-i18n-tools <cmd>`.

<a id="cloned-ai-i18n-tools-monorepo"></a>
### Geklontes ai-i18n-tools Monorepo

Beim Entwickeln des Pakets oder Ausführen von Workspace-**Beispielen** aus einem vollständigen Klon von [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Workspace-Beispiele** (`examples/console-app`, `examples/nextjs-app` und die anderen Pakete, die in [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) aufgeführt sind) – führen Sie `pnpm install` im Repository-Stammverzeichnis aus, dann `cd examples/<name>`. Verwenden Sie die `pnpm run i18n:*`-Skripte des Beispiels oder konfigurieren Sie PATH (siehe [Verwenden der CLI](#using-the-cli)) und führen Sie einfaches `ai-i18n-tools …` aus. Workspace [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) verknüpft `ai-i18n-tools` mit Ihrem lokalen Checkout.
- **Repository-Stammverzeichnis** – pnpm verknüpft die eigenen `bin` des Root-Pakets nicht mit `node_modules/.bin`. Verwenden Sie stattdessen `node bin/ai-i18n-tools.mjs …` oder Root-`pnpm i18n:*`-Skripte (oder einen Shell-Alias / `pnpm add -g .` – siehe [Entwicklungsleitfaden](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Eigenständige Fixtures** (`multi-provider`, `test-markdown`) – verwenden Sie aus dem Fixture-Ordner `node ../../bin/ai-i18n-tools.mjs …`.

Führen Sie `pnpm run build` im Repository-Stammverzeichnis aus, nachdem Sie die CLI-Quelle geändert haben. Siehe den [Entwicklungsleitfaden](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) für Build-Schritte und optionale Workarounds für die globale Installation.

Unter Linux, macOS und WSL setzen Registry-Installationen automatisch das Ausführbar-Bit für das CLI-Skript. Unter Windows erzeugen Paketmanager `.cmd`- und `.ps1`-Shims, die Node explizit aufrufen.

Übersetzungsbefehle (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) erfordern eine **Anbieterkonfiguration** in `ai-i18n-tools.config.json` und **einen API-Schlüssel** für den aktiven Anbieter. Führen Sie `ai-i18n-tools init [-P <provider>]` aus, um einen Standard-Anbieterblock zu erstellen (`openrouter`, wenn weggelassen); bearbeiten Sie `provider` / `providers`, um Voreinstellungen oder Modelle zu wechseln – siehe [LLM-Anbieter und -Modelle](/de/guide/providers-and-models). Ollama ist die einzige integrierte Voreinstellung, die keinen API-Schlüssel benötigt.

Legen Sie den API-Schlüssel fest, der Ihrem aktiven Anbieter entspricht (siehe die [Voreinstellungstabelle](/de/guide/providers-and-models#built-in-providers)):

```bash
# Default init (openrouter)
export OPENROUTER_API_KEY=sk-or-v1-your-key-here
# Example: init -P anthropic
# export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Oder erstellen Sie eine `.env`-Datei im Projektstammverzeichnis:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

<a id="tool-ui-language"></a>
### Tool-UI-Sprache

Die CLI lokalisiert ihre eigenen Hilfetexte, Protokollzusammenfassungen und das Übersetzungs-Dashboard unabhängig von den von Ihnen übersetzten Gebietsschemas. Standardmäßig folgt sie dem Gebietsschema Ihres Betriebssystems. Überschreiben Sie dies mit `-L pt-BR`, `export AI_I18N_LANG=es` oder `"uiLanguage"` in der Konfiguration. Siehe [Tool-UI-Sprache](/de/guide/tool-ui-language).
