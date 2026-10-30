<a id="coding-agent-skill"></a>
# Skill des Coding-Agenten

Eine Installation kopiert jeden Consumer-Skill. Der [gemeinsame Skill](https://github.com/wsj-br/ai-i18n-tools/tree/main/skills/ai-i18n-tools) bringt einem Agenten bei, wie man `ai-i18n-tools` mit `sync` installiert und wartet, und lädt nur die Referenz, die zur Aufgabe passt. Jeder Workflow ist ein separater Slash-Befehl, wie zum Beispiel `/ai-i18n-vitepress`.

Die Installation des npm-Pakets oder der eigenständigen ausführbaren Datei registriert die Skills nicht. Verwenden Sie eine Installationsmethode pro Agent.

<a id="install-with-the-skills-cli"></a>
## Installation über die Skills-CLI

Dies ist die Installation, die verwendet werden sollte, wenn Node.js Version 22.20 oder neuer ist. Die eigene CLI dieses Pakets unterstützt Node.js 22.16, was für die Skills-CLI zu alt ist. Bei Versionen 22.16 bis 22.19 oder auf einem Computer ohne Node.js verwenden Sie [Das Skill-Verzeichnis herunterladen](#download-the-skill-directory).

Aus dem Projekt, in dem der Agent arbeiten soll:

```bash
npx skills add wsj-br/ai-i18n-tools
```

Der Befehl installiert jedes Verzeichnis unter `skills/`, einschließlich des gemeinsamen Skills und jedes Workflow-Befehls. Er hinterlässt keinen Checkout dieses Repositorys in Ihrem Projekt. Der Standard-Geltungsbereich ist das aktuelle Projekt. Fügen Sie `-g` hinzu, um für Ihren Benutzer projektübergreifend zu installieren.

```bash
npx skills add wsj-br/ai-i18n-tools --all -y
npx skills add wsj-br/ai-i18n-tools --list
npx skills add wsj-br/ai-i18n-tools --skill ai-i18n-vitepress -a cursor
npx skills update
```

`--all -y` ist die Ein-Schritt-Installation: jeder Skill, keine Abfrage. Ohne `--all` fragt der Installer, welche Skills kopiert werden sollen. `--list` gibt die Skills aus und installiert nichts. `--skill` und `-a` überspringen die Abfragen für einen Skill und einen Agenten. `npx skills update` aktualisiert auf diese Weise installierte Skills. Führen Sie `add` erneut aus, um einen Skill zu übernehmen, der nach der ersten Installation hinzugefügt wurde.

Um den Skill als Abfrage auszugeben oder einen unterstützten Agenten damit zu starten, ohne zu installieren:

```bash
npx skills use wsj-br/ai-i18n-tools@ai-i18n-tools
```

Die CLI erkennt die auf dem Computer installierten Coding-Agenten. Die Installationspfade für jeden Agenten finden Sie in der [Skills-CLI-Agentenliste](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Diese Liste ändert sich. Diese Seite wiederholt sie nicht und behauptet nicht, dass jedes Coding-Tool einen Skill-Ordner liest.

Die Skills-CLI sammelt anonyme Nutzungsdaten. Setzen Sie `DISABLE_TELEMETRY=1` oder `DO_NOT_TRACK=1`, um dies zu deaktivieren.

Starten Sie nach der Installation eine neue Agenten-Sitzung, falls dieses Produkt einen Neustart erfordert. Geben Sie einen Workflow-Befehl wie `/ai-i18n-vitepress` ein oder bitten Sie den Agenten, den Skill `ai-i18n-tools` zu verwenden. Der gemeinsame Skill ist der Fallback für eine Anfrage, die keinen Befehl benennt. Ein entdeckter Skill ist keine Garantie dafür, dass der Agent ihn von selbst aufruft.

<a id="slash-commands"></a>
## Slash-Befehle

Der gemeinsame Skill `ai-i18n-tools` bleibt dem Agenten verfügbar. Die anderen Skills sind explizite Befehle. Jeder folgt dem gemeinsamen Skill und wendet dann nur seine Vorlage und Prüfungen an.

| Befehl | Workflow |
| --- | --- |
| `/ai-i18n-js` | JavaScript- oder TypeScript-Quellstring-UI |
| `/ai-i18n-python` | Generierter Python-Helfer und flache JSON-Kataloge |
| `/ai-i18n-django` | Django, Flask-Babel oder einfaches gettext |
| `/ai-i18n-vitepress` | VitePress |
| `/ai-i18n-starlight` | Astro Starlight-Dokumentation |
| `/ai-i18n-docusaurus` | Docusaurus |
| `/ai-i18n-nextra` | Nextra |
| `/ai-i18n-fumadocs` | Fumadocs |
| `/ai-i18n-astro-website` | Vanilla Astro-Website |
| `/ai-i18n-plain-html` | Eine HTML-Datei, im Browser umgeschaltet |
| `/ai-i18n-plain-html-docs` | Ein HTML-Baum pro Gebietsschema |
| `/ai-i18n-readme` | README und Repository Markdown |
| `/ai-i18n-migrate-intlayer` | Einmalige Verschiebung von Intlayer zu `t()`-Aufrufen |
| `/ai-i18n-translate-intlayer` | Intlayer-Wörterbücher direkt füllen |

In `.agents/skills/` oder `.cursor/skills/` kopierte Skills erscheinen als diese Befehle. Ein aktueller Cursor-Bug verbirgt Marketplace-Plugin-Skills, die `disable-model-invocation` aus der `/`-Palette setzen. Claude Code, Codex und Copilot zeigen diese Befehle weiterhin an. Verwenden Sie die Skills-CLI-Installation, wenn Sie die Befehle in Cursor haben möchten. Eine Prosa-Anfrage erreicht weiterhin den geteilten Skill.

<a id="download-the-skill-directory"></a>
## Skill-Verzeichnis herunterladen

Verwenden Sie dies, wenn die Skills-CLI nicht verfügbar ist. Kopieren Sie jedes Skill-Verzeichnis, nicht nur `ai-i18n-tools/`. Jeder Workflow-Befehl ist ein eigener Ordner mit einer `SKILL.md`. Ein Git-Klon und `npx degit` eines Skill-Pfads laden beide das Repository-Quellarchiv herunter, etwa 50 MB.

Wählen Sie ein Agentenverzeichnis aus der [Skills-CLI-Agentenliste](https://github.com/vercel-labs/skills/blob/main/docs/agents.md). Die folgenden Beispiele verwenden `.agents/skills/`, das von mehreren Agenten gelesen wird. Überprüfen Sie dieses Ziel, bevor Sie eine vorhandene Kopie ersetzen. Eine Kopie pro Agent ist ausreichend. Eine zweite Kopie in einem anderen Erkennungsordner für denselben Agenten ist ein Duplikat.

Das npm-Paket enthält bereits die Verzeichnisse. Wenn das Paket installiert ist:

```bash
mkdir -p .agents/skills
cp -a node_modules/ai-i18n-tools/skills/. .agents/skills/
```

Ohne `node_modules` laden Sie das npm-Tarball für dieselbe Version herunter, die die CLI meldet. `ai-i18n-tools --version` gibt die Version und dann den Build-Zeitstempel aus. Verwenden Sie nur die Versionsnummer. Das Tarball-Mitglied ist `package/skills/`.

```bash
mkdir -p .agents/skills
curl -fsSL https://registry.npmjs.org/ai-i18n-tools/-/ai-i18n-tools-1.12.0.tgz \
  | tar -xz --strip-components=2 -C .agents/skills package/skills
```

Ersetzen Sie `1.12.0` durch die von Ihnen installierte Version. Dies funktioniert für die aktuelle Version. Die eigenständige ausführbare Datei enthält die Skill-Dateien nicht. Passen Sie das Tarball an `ai-i18n-tools --version` an.

Ab der Version, die es hinzufügt, hängen GitHub Releases auch `ai-i18n-tools-skill.zip` an. Dieses Zip enthält jedes Skill-Verzeichnis auf seiner obersten Ebene. Entpacken Sie es in den Agenten-Skills-Ordner, sodass das Ergebnis sowohl `ai-i18n-tools/SKILL.md` als auch die Workflow-Ordner, wie z. B. `ai-i18n-vitepress/SKILL.md`, enthält. Vor diesem Zip veröffentlichte Releases enthalten es nicht. Ältere Zips enthalten nur `ai-i18n-tools/`. Verwenden Sie für diese Releases das npm-Tarball. Der Tag ist `v` plus die CLI-Version, zum Beispiel `v1.12.0`, sobald das Release dieses Tags das Asset enthält.

<a id="agents-the-skills-cli-installs"></a>
## Agenten, die die Skills-CLI installiert

Übergeben Sie die ID an `-a`, wenn Sie einen Agenten wünschen. Für diese Tools ist in diesem Repository nichts weiter erforderlich.

CLI-Agenten: Claude Code (`claude-code`), Codex CLI (`codex`), Gemini CLI (`gemini-cli`), Antigravity CLI (`antigravity-cli`), GitHub Copilot CLI (`github-copilot`), OpenCode (`opencode`), Goose (`goose`), Qwen Code (`qwen-code`), Kilo CLI (`kilo`), Grok Build (`grok`), Amp (`amp`), Crush (`crush`), Pi (`pi`), Kiro CLI (`kiro-cli`).

Editoren und IDEs: Cursor (`cursor`), Windsurf (`windsurf`), Devin for Terminal (`devin`), Zed (`zed`), Antigravity (`antigravity`), Trae (`trae`), Junie (`junie`), Replit (`replit`), Cline (`cline`), Roo Code (`roo`), Kilo Code (`kilo`), Continue (`continue`), Augment (`augment`), Factory Droid (`droid`), Tabnine CLI (`tabnine-cli`). GitHub Copilot in einem Editor verwendet dieselbe `github-copilot`-ID wie die CLI.

Zwei Pfaddetails, die leicht zu übersehen sind:

- Cursor: Eine Projektinstallation über die Skills CLI geht nach `.agents/skills/`. `-g` geht nach `~/.cursor/skills/`. Cursors eigene Dokumentation akzeptiert auch `.cursor/skills/` in einem Projekt. Verwenden Sie eine davon.
- GitHub Copilot: Die Skills CLI schreibt `.agents/skills/` im Projekt und `~/.copilot/skills/` für `-g`. GitHubs Cloud-Agent-Dokumentation beschreibt auch `.github/skills/`. Dieser Ordner wird nicht von jedem Copilot-Chat gelesen. Verwenden Sie nur den Ordner, der für die von Ihnen verwendete Oberfläche dokumentiert ist.

Der Standard-Agent der Kiro CLI lädt `.kiro/skills/` und `~/.kiro/skills/` ohne zusätzliche Konfiguration. Ein benutzerdefinierter Kiro-Agent benötigt die installierten Skills, die in `.kiro/agents/<agent>.json` aufgeführt sind:

```json
{
  "resources": ["skill://.kiro/skills/**/SKILL.md"]
}
```

<a id="native-catalogs"></a>
## Native Kataloge

Einige Produkte installieren die Skills auch aus einem Katalog in diesem Repository. Verwenden Sie einen Kanal für jeden Agenten: den Katalog oder die Skills CLI. Ein Paket-Upgrade aktualisiert keine manuell kopierte Skill. `npx skills update` aktualisiert eine Skills-CLI-Installation. Kataloginstallationen folgen dem Update-Befehl des jeweiligen Produkts.

- Cursor Marketplace, nachdem der Eintrag genehmigt wurde: Installieren Sie `ai-i18n-tools` vom Cursor Marketplace. Solange dieser Eintrag nicht existiert, verwenden Sie die Skills CLI. [Cursor Directory](https://cursor.directory) ist ein separater Community-Eintrag.
- Claude Code, aus einer Claude Code-Sitzung:

```text
/plugin marketplace add wsj-br/ai-i18n-tools
/plugin install ai-i18n-tools@ai-i18n-tools
```

- GitHub Copilot CLI:

```bash
copilot plugin marketplace add wsj-br/ai-i18n-tools
```

Installieren Sie dann das `ai-i18n-tools`-Plugin von diesem Marktplatz. Die Plugin-ID ist `ai-i18n-tools@ai-i18n-tools`. Die Copilot CLI liest dieselbe Katalogdatei, die Claude Code verwendet.

- Codex:

```bash
codex plugin marketplace add wsj-br/ai-i18n-tools
```

Ein ChatGPT-Workspace-Eintrag wird separat von einem Workspace-Administrator veröffentlicht. Dies ist eine andere Installation als dieser Befehl.

<a id="agents-without-a-skills-install"></a>
## Agenten ohne Skills-Installation

Diese Produkte sind nicht in der Agentenliste der Skills CLI enthalten. Dieses Repository liefert keinen separaten Skill-Ordner für sie. Verweisen Sie den Agenten auf den [Consumer-Kontext](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md) aus Projektanweisungen wie `AGENTS.md`:

```markdown
Before installing or maintaining ai-i18n-tools, read
https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/ai-i18n-tools-context.md
and follow only the linked reference that matches this project.
Use ai-i18n-tools sync for the configured workflow.
```

Diese Datei verwendet Dokumentationsseiten- und Repository-URLs, sodass die Anweisung immer noch funktioniert, wenn der Agent dieses Repository nicht lesen kann. Für eine ältere CLI öffnen Sie denselben Pfad auf dem entsprechenden Release-Tag. Consumer-Projekte verwenden diese Kontextdatei. Der Maintainer `AGENTS.md` gilt bei Änderungen an diesem Repository.

Produkte in dieser Gruppe: Aider, gptme, Amazon Q Developer CLI, DeepSeek Harness, JetBrains AI Assistant, Sourcegraph Cody, Qodo, das Tabnine IDE-Plugin, CodeGeeX und AskCodi. Junie ist der JetBrains-Agent, der eine Skills-CLI-Installation akzeptiert. Die Tabnine CLI auch. AiderDesk ist eine andere Anwendung als Aider.

CodeLayer und Superset haben kein eigenes Skill-Verzeichnis. CodeLayer führt Claude Code aus, installieren Sie also den Skill für Claude Code. Superset führt die von Ihnen konfigurierten CLI-Agenten aus, installieren Sie also den Skill für diese Agenten.

<a id="stay-on-the-same-version"></a>
## Auf derselben Version bleiben

Halten Sie den Skill auf derselben Release-Version wie den Befehl `ai-i18n-tools`. Ein npm-Upgrade und eine neuere eigenständige ausführbare Datei belassen einen manuell kopierten Skill an seinem ursprünglichen Ort. Installieren Sie den Skill erneut von der passenden Version, oder führen Sie `npx skills update` für eine Skills-CLI-Installation aus.

Die Online-Dokumentation beschreibt möglicherweise eine neuere Release-Version als den von Ihnen installierten Befehl. Bevorzugen Sie `ai-i18n-tools --help` für Flags. Weitere Referenzen: [Installation](/de/guide/installation), [Konfiguration](/de/reference/configuration), [Anbieter](/de/guide/providers-and-models), [CLI-Referenz](/de/reference/cli-commands/).
