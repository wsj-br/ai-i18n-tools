# Next.js App Beispiel

Dieses Beispiel zeigt, wie man `ai-i18n-tools` mit einer **TypeScript** [Next.js](https://nextjs.org/) App und **pnpm** verwendet. Die Benutzeroberfläche entspricht dem [Konsolen-App-Beispiel](../../console-app/) und verwendet die gleichen String-Schlüssel sowie einen von `locales/ui-languages.json` gesteuerten Locale-Selector (Quell-Locale `en-GB` zuerst, gefolgt von den Übersetzungszielen).

In diesem Ordner befindet sich eine kleine **[Docusaurus](https://docusaurus.io/)**-Website ([`docs-site/`](../docs-site/)) mit Kopien der Hauptprojektdokumentation für die lokale Durchsicht.

<small>**In anderen Sprachen lesen:** </small>

<small id="lang-list">[en-GB](../README.md) · [de](./README.de.md) · [es](./README.es.md) · [fr](./README.fr.md) · [pt-BR](./README.pt-BR.md)</small>

## Screenshot

![screenshot](../images/screenshots/de/screenshot.png)

## Anforderungen

- Node.js >= 18
- [pnpm](https://pnpm.io/)
- Ein [OpenRouter](https://openrouter.ai) API-Schlüssel (zum Generieren von Übersetzungen)

## Installation

Führen Sie im **Repository-Stammverzeichnis** aus:

```bash
pnpm install
```

Die Wurzel `pnpm-workspace.yaml` enthält die Bibliothek und dieses Beispiel, sodass pnpm `ai-i18n-tools` über `"ai-i18n-tools": "workspace:^"` in `package.json` verknüpft. Es sind keine separaten Build- oder Verknüpfungsschritte erforderlich — nach Änderungen an den Bibliotheksquellen führen Sie `pnpm run build` im Stammverzeichnis des Repos aus, und das Beispiel wird automatisch die aktualisierte `dist/` übernehmen.

## Verwendung

### Next.js App (Port 3030)

Entwicklungsserver:

```bash
pnpm dev
```

Produktionsbuild und Start:

```bash
pnpm build
pnpm start
```

Öffnen Sie [http://localhost:3030](http://localhost:3030). Verwenden Sie das Dropdown-Menü **Locale**, um die Sprache zu wechseln (Locale-ID / englischer Name / native Bezeichnung).

Die Startseite zeigt auch ein **Demo-SVG** am Ende. Die Bild-URL folgt `public/assets/translation_demo_svg.<locale>.svg` (flaches Layout aus dem `svg`-Block in `ai-i18n-tools.config.json`). Nach dem Ausführen von `translate-svg` enthält jede Locale-Datei übersetzte `<text>`, `<title>` und `<desc>` Inhalte; bis dahin können die gespeicherten Kopien in den Locales identisch aussehen.

### Dokumentationsseite (Port 3040)

```bash
cd docs-site
pnpm install
pnpm start
```

Öffnen Sie [http://localhost:3040](http://localhost:3040) (Englisch). In **Entwicklung** bedient Docusaurus **eine Locale zur Zeit**: Pfade wie `/es/getting-started` **404** es sei denn, Sie führen `pnpm run start:es` (oder `start:fr`, `start:de`, `start:pt-BR`) aus. Nach `pnpm build && pnpm serve` sind alle Locales verfügbar. Siehe [`docs-site/README.md`](../README.md).

## Unterstützte Sprachen

| Code     | Sprache              |
| -------- | -------------------- |
| `en-GB`  | Englisch (UK) Standard |
| `es`     | Spanisch             |
| `fr`     | Französisch          |
| `de`     | Deutsch              |
| `pt-BR`  | Portugiesisch (Brasilien)  |

## Arbeitsablauf

### 1. UI-Strings extrahieren

Durchsucht `src/` nach `t()`-Aufrufen und aktualisiert `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Übersetzen

Setze `OPENROUTER_API_KEY`, und führe dann die Übersetzungsskripte aus:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate-ui
pnpm run i18n:translate-svg
pnpm run i18n:translate-docs
```

### Sync-Befehl

Der Sync-Befehl führt die Extraktion und alle Übersetzungsschritte in der Reihenfolge aus:

```bash
pnpm run i18n:sync
```

oder

```bash
ai-i18n-tools sync
```

Schritte werden in folgender Reihenfolge ausgeführt:

1. **`ai-i18n-tools extract`** — extrahiert UI-Strings und aktualisiert `locales/strings.json`.
2. **`ai-i18n-tools translate-ui`** — schreibt flache Locale-JSON unter `public/locales/` aus `locales/strings.json`.
3. **`ai-i18n-tools translate-svg`** — übersetzt SVG-Assets von `images/` nach `public/assets/` gemäß dem `svg`-Block in `ai-i18n-tools.config.json` (dieses Beispiel verwendet flache Namen: `translation_demo_svg.<locale>.svg`).
4. **`ai-i18n-tools translate-docs`** — übersetzt Docusaurus-Markdown unter `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/` (siehe **Workflow 2** in `docs/GETTING_STARTED.md` im Repository-Stamm).

Du kannst jeden Schritt einzeln ausführen (z. B. `ai-i18n-tools translate-svg`), wenn sich nur die Quellen für diesen Arbeitsablauf geändert haben.

Wenn Protokolle viele Überspringungen und wenige Schreibvorgänge zeigen, verwendet das Tool **bestehende Ausgaben** und den **SQLite-Cache** in `.translation-cache/`. Um eine erneute Übersetzung zu erzwingen, übergebe `--force` oder `--force-update` im entsprechenden Befehl, wo unterstützt, oder führe `pnpm run i18n:clean` aus und übersetze erneut.

Dieses Beispielkonfiguration enthält `svg`, sodass **`i18n:sync` denselben SVG-Schritt wie `translate-svg` ausführt**. Du kannst dennoch `ai-i18n-tools translate-svg` allein für diesen Schritt aufrufen oder `pnpm run i18n:translate` für die feste UI → SVG → Dokumente-Reihenfolge **ohne** Ausführung von **extract** verwenden.

### 3. Cache bereinigen und erneut übersetzen

Nach Änderungen an der UI oder Dokumentation können einige Cache-Einträge veraltet oder verwaist sein (zum Beispiel, wenn ein Dokument entfernt oder umbenannt wurde). `i18n:cleanup` führt zuerst `sync --force-update` aus und entfernt dann veraltete Einträge:

```bash
pnpm run i18n:cleanup
```

Um eine erneute Übersetzung der UI, Dokumente oder SVGs zu erzwingen, verwende `--force`. Dies ignoriert den Cache und übersetzt erneut mit KI-Modellen.

Um das gesamte Projekt (UI, Dokumente, SVGs) erneut zu übersetzen:

```bash
pnpm run i18n:sync --force
```

Um eine einzelne Locale erneut zu übersetzen:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Um nur die UI-Strings für eine bestimmte Locale erneut zu übersetzen:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Manuelle Bearbeitungen (Cache-Editor)

Sie können eine lokale Web-Benutzeroberfläche starten, um Übersetzungen im Cache, UI-Strings und Glossar manuell zu überprüfen und zu bearbeiten:

```bash
pnpm run i18n:editor
```

> **Wichtig:** Wenn Sie einen Eintrag im Cache-Editor manuell bearbeiten, müssen Sie `sync --force-update` ausführen (z. B. `pnpm run i18n:sync --force-update`), um die generierten Flat-Dateien oder Markdown-Dateien mit der aktualisierten Übersetzung zu überschreiben. Beachten Sie auch, dass Ihre manuelle Bearbeitung verloren geht, wenn sich der ursprüngliche Quelltext in Zukunft ändert, da das Tool einen neuen Hash für den neuen Quelltext generiert.

## Projektstruktur

```
nextjs-app/
├── ai-i18n-tools.config.json # `svg` block: images/ → public/assets/ (translate-svg)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── lib/
│       └── i18n.ts
├── images/
│   └── translation_demo_svg.svg   # Source SVG for translate-svg
├── locales/
│   ├── ui-languages.json
│   └── strings.json          # Generated string catalogue (extract)
├── public/locales/           # Flat per-locale JSON (committed; regenerate with translate-ui)
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   └── pt-BR.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # Source (English)
    └── i18n/                 # Translated docs (Docusaurus layout; committed in git)
```

Englische Dokumentquellen unter `docs-site/docs/` können vom Repository-Stammverzeichnis mit `pnpm run sync-docs` synchronisiert werden, was `{#slug}` Überschrift-Anker hinzufügt und `docusaurus write-heading-ids` spiegelt; siehe den Skripthauptteil in `scripts/sync-docs-to-nextjs-example.mjs`.

Übersetzte UI-Strings, Demo-SVGs und Docusaurus-Seiten sind bereits unter `public/locales/`, `public/assets/`, `locales/strings.json` und `docs-site/i18n/` eingecheckt. Nach Änderungen an den Quellen und dem Ausführen von `i18n:translate` starten Sie die Next.js- und Docusaurus-Entwicklungsserver nach Bedarf neu; Docusaurus-Lokalisierungen sind in `docs-site/docusaurus.config.js` aufgeführt.
