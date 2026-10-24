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

<a id="standalone-executables"></a>
### Eigenständige ausführbare Dateien

GitHub Releases fügen einen Node.js Single-Executable-Build bei. Python-Projekte führen die CLI über diese Binärdatei aus, einschließlich `extract`, `translate-ui` und `suggest-models`, ohne dass eine Node.js-Installation erforderlich ist.

| Plattform | Asset |
| --- | --- |
| Linux x64 | `ai-i18n-tools-linux-x64` |
| Linux arm64 | `ai-i18n-tools-linux-arm64` |
| macOS arm64 | `ai-i18n-tools-macos-arm64` |
| macOS x64 | `ai-i18n-tools-macos-x64` |
| Windows x64 | `ai-i18n-tools-win-x64.exe` |

Jedes Release enthält zudem `SHA256SUMS.txt` und `ai-i18n-tools-python-examples.zip` (die vier Python-Beispiele). Der npm-Tarball und die ausführbare Datei enthalten diese Beispiele nicht. Sie verbleiben ebenfalls im Repository.

1. Laden Sie das Asset, das zu Ihrem System passt, von der [GitHub Releases](https://github.com/wsj-br/ai-i18n-tools/releases)-Seite herunter.
2. Überprüfen Sie die Prüfsumme anhand von `SHA256SUMS.txt`.
3. Führen Sie unter Linux und macOS `chmod +x` für die Datei aus und verschieben Sie sie nach `PATH` (oder rufen Sie sie über den Pfad auf).
4. Platzieren Sie unter Windows `ai-i18n-tools-win-x64.exe` in `PATH`. Wenn Sie sie in `ai-i18n-tools.exe` umbenennen, bleibt der Befehlsname derselbe wie auf den anderen Plattformen.

Die Binärdateien sind weder notariell beglaubigt noch mit Authenticode signiert. macOS fordert Sie möglicherweise auf, ein nicht signiertes Programm zu genehmigen. Windows SmartScreen zeigt unter Umständen eine Warnung an.

Legen Sie den API-Schlüssel für den aktiven Anbieter auf die gleiche Weise wie bei einer npm-Installation fest (Umgebungsvariable oder eine `.env`-Datei im Arbeitsverzeichnis). Die Modellliste aus `init` dient als Ausgangspunkt. `suggest-models` gibt eine bewertete Shortlist aus. `suggest-models --apply` schreibt diese in `translationModels`. Die gleiche Rangliste finden Sie auf dem [Models](/de/guide/translation-dashboard/models)-Tab.

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Anleitung: [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python). Befehlsreferenz: [suggest-models](/de/reference/cli-commands/models#suggest-models).

ai-i18n-tools enthält einen eigenen String-Extraktor. Wenn Sie zuvor `i18next-scanner`, `babel-plugin-i18next-extract` oder Ähnliches verwendet haben, können Sie diese Entwicklungsabhängigkeiten nach der Migration entfernen. Bestehende i18next **Namespace-JSON**-Dateien können in der [JSON-Pipeline](/de/guide/json#i18next-namespace-files) verbleiben. Intlayer `.content.ts`-Wörterbücher können mit `migrate-intlayer` importiert werden – siehe [Migration von Intlayer](/de/guide/migrating-from-intlayer).

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
### Geklontes ai-i18n-tools-Monorepo

Beim Entwickeln des Pakets oder Ausführen von Workspace-**Beispielen** aus einem vollständigen Klon von [ai-i18n-tools](https://github.com/wsj-br/ai-i18n-tools):

- **Arbeitsbereichsbeispiele** (`examples/console-app`, `examples/nextjs-app` und die anderen Pakete, die in [`pnpm-workspace.yaml`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) aufgeführt sind) – führen Sie `pnpm install` im Repository-Stammverzeichnis aus, dann `cd examples/<name>`. Verwenden Sie die `pnpm run i18n:*`-Skripte des Beispiels oder konfigurieren Sie PATH (siehe [Verwenden der CLI](#using-the-cli)) und führen Sie `ai-i18n-tools …` direkt aus. Der Arbeitsbereich [`overrides`](https://github.com/wsj-br/ai-i18n-tools/blob/main/pnpm-workspace.yaml) verknüpft `ai-i18n-tools` mit Ihrem lokalen Checkout.
- **Repository-Stammverzeichnis** – pnpm verknüpft die eigenen `bin` des Stammverzeichnispakets nicht mit `node_modules/.bin`. Das `.envrc` dieses Checkouts fügt `bin/` zu `PATH` hinzu, sodass der festgeschriebene `bin/ai-i18n-tools`-Wrapper (neben dem veröffentlichten `bin/ai-i18n-tools.mjs`-Shim) den reinen Befehl nach `direnv allow` bereitstellt. Ohne direnv verwenden Sie `node bin/ai-i18n-tools.mjs …`, `./bin/ai-i18n-tools …` oder Stamm-`pnpm i18n:*`-Skripte (oder einen Shell-Alias / `pnpm add -g .` – siehe [Entwicklungsleitfaden](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development)).
- **Eigenständige Fixtures** (`multi-provider`, `test-markdown`) – verwenden Sie aus dem Fixture-Ordner `node ../../bin/ai-i18n-tools.mjs …`.

Führen Sie `pnpm run build` im Repository-Stammverzeichnis aus, nachdem Sie die CLI-Quelle geändert haben. Siehe den [Entwicklungsleitfaden](https://github.com/wsj-br/ai-i18n-tools/blob/main/dev/DEVEL.md#running-the-cli-during-development) für Build-Schritte und optionale Workarounds für die globale Installation.

Unter Linux, macOS und WSL setzen Registry-Installationen automatisch das Ausführbar-Bit für das CLI-Skript. Unter Windows erzeugen Paketmanager `.cmd`- und `.ps1`-Shims, die Node explizit aufrufen.

Übersetzungsbefehle (`translate-ui`, `translate-docs`, `translate-json`, `translate-svg`, `sync`) erfordern eine **Anbieterkonfiguration** in `ai-i18n-tools.config.json` und **einen API-Schlüssel** für den aktiven Anbieter. Führen Sie `ai-i18n-tools init -P <provider>` aus, um dieses Preset zu generieren; bearbeiten Sie `provider` / `providers`, um Modelle hinzuzufügen — siehe [LLM-Anbieter und -Modelle](/de/guide/providers-and-models). Die Modellliste aus `init` ist ein Ausgangspunkt. `ai-i18n-tools suggest-models` ordnet die Chat-Modelle des aktiven Anbieters, und `suggest-models --apply` ersetzt `translationModels`. Dieselbe Rangfolge finden Sie auf der Registerkarte [Modelle](/de/guide/translation-dashboard/models). Befehlsreferenz: [suggest-models](/de/reference/cli-commands/models#suggest-models). Ollama ist das einzige integrierte Preset, das keinen API-Schlüssel benötigt.

Legen Sie den API-Schlüssel fest, der dem Anbieter entspricht, den Sie an `init` übergeben (siehe die [Preset-Tabelle](/de/guide/providers-and-models#built-in-providers)):

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

<a id="tool-ui-language"></a>
### Tool-UI-Sprache

Die CLI lokalisiert ihre eigenen Hilfetexte, Protokollzusammenfassungen und das Übersetzungs-Dashboard unabhängig von den von Ihnen übersetzten Gebietsschemas. Standardmäßig folgt sie dem Gebietsschema Ihres Betriebssystems. Überschreiben Sie dies mit `-L pt-BR`, `export AI_I18N_LANG=es` oder `"uiLanguage"` in der Konfiguration. Siehe [Tool-UI-Sprache](/de/guide/tool-ui-language).
