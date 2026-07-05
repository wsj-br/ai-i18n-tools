# Next.js-App-Beispiel

Dieses Beispiel zeigt, wie `ai-i18n-tools` mit einer **TypeScript**-[Next.js](https://nextjs.org/)-App und pnpm verwendet wird. Die Benutzeroberfläche entspricht dem [Konsolen-App-Beispiel](../../console-app/) und verwendet dieselben Zeichenketten-Schlüssel sowie einen Sprachauswahl-Selector, der von `locales/ui-languages.json` gesteuert wird (Quelllokalisation `en-GB` zuerst, gefolgt von den Zielübersetzungen). `[src/lib/i18n.ts](../src/lib/i18n.ts)` erstellt `localeLoaders` aus diesem Manifest (jedes `code` außer `SOURCE_LOCALE`), wie auch die Konsolen-App; die Bundles werden mit `fetch` nach `public/locales/<locale>.json` geladen.

Unterhalb dieses Ordners befindet sich eine kleine [Docusaurus](https://docusaurus.io/)-Website (`[docs-site/](../docs-site/)`) mit einer ausgewählten Teilmenge der Dokumentation des Hauptprojekts zum lokalen Durchsuchen.

**In anderen Sprachen lesen:**
[English](../README.md) · [العربية](README.ar.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (BR)](README.pt-BR.md)

## Bildschirmfoto

Bildschirmfoto

## Voraussetzungen

- Node.js >= 22.16 (entspricht dem `engines`-Feld des Repositorys)
- [pnpm](https://pnpm.io/) >= 10.33 (siehe die Root-`package.json` `packageManager` / `engines`)
- Ein [OpenRouter](https://openrouter.ai)-API-Schlüssel (zum Generieren von Übersetzungen)

## Installation

### Probieren Sie dieses Beispiel einzeln aus

```bash
npx degit wsj-br/ai-i18n-tools/examples/nextjs-app nextjs-app
cd nextjs-app
pnpm install
```

### Monorepo-Mitwirkende

Führen Sie im Stammverzeichnis des Repositorys Folgendes aus:

```bash
pnpm install
```

Der Workspace-[`overrides`](../../../pnpm-workspace.yaml)-Eintrag (`ai-i18n-tools: workspace:*`) erzwingt die Verwendung der lokalen Workspace-Kopie von `ai-i18n-tools`, obwohl in diesem Beispiel `"ai-i18n-tools": "^1.7.2"` deklariert ist. Es ist kein separater Build- oder Verknüpfungsschritt erforderlich – nachdem Sie die Bibliotheksquellen geändert haben, führen Sie `pnpm run build` im Stammverzeichnis des Repositorys aus, und das Beispiel übernimmt automatisch die aktualisierte Version von `dist/`.

**Arbeitsverzeichnis:** Führen Sie die Next.js-App und alle `pnpm run i18n:*`-Befehle aus `examples/nextjs-app` aus (wo sich `ai-i18n-tools.config.json` befindet), oder übergeben Sie `--config` / legen Sie das Arbeitsverzeichnis fest, damit die CLI diese Konfiguration auflösen kann.

## Verwendung

### Next.js-App (Port 3030)

Vom Repository-Stamm aus nach `pnpm install`:

```bash
cd examples/nextjs-app
```

Entwicklungsserver:

```bash
pnpm dev
```

Produktions-Build und Start:

```bash
pnpm build
pnpm start
```

Öffnen Sie [http://localhost:3030](http://localhost:3030). Verwenden Sie den Locale-Auswahlmenü, um die Sprache zu wechseln (Lokalisierungs-ID / englischer Name / native Bezeichnung). Sie können auch direkt eine Lokalisierung über die Abfragezeichenfolge `?locale=<code>` verlinken (zum Beispiel `[?locale=ar](http://localhost:3030/?locale=ar)`); die Seite hält Dropdown und URL synchron.

### Beispiel für kardinalen Plural

Die Startseite enthält eine Demo für Pluralformen („Plurals: Beispiel für die Verwendung der automatischen Generierung“), die zeigt, wie kardinalen Plural-UI-Zeichenfolgen end-to-end verarbeitet werden:

- **Rendering:** Dieselbe Nachricht wird für mehrere in `PLURAL_DEMO_COUNTS` in `[src/app/page.tsx](../src/app/page.tsx)` definierte Beispielanzahlen wiederholt (standardmäßig 1, 2, 5 und 50), sodass Sie das Pluralverhalten über verschiedene Lokalisierungen hinweg vergleichen können (einschließlich Sprachen mit mehreren Pluralformen wie Arabisch).
- **API:** Jede Zeile verwendet `t("This page has {{count}} sections", { plurals: true, count })`. Übergeben Sie `plurals: true`, damit Extraktion und Übersetzung den Schlüssel als Pluralgruppe behandeln; `count` wählt zur Laufzeit die aktive Pluralform aus.
- **Laufzeit:** Pluralformen werden zur Laufzeit über die in `[src/lib/i18n.ts](../src/lib/i18n.ts)` integrierten Hilfsfunktionen aufgelöst; siehe die Laufzeitdokumentation des Pakets (`ai-i18n-tools/runtime`) für eine vollständige Übersicht.
- **Ausgaben:** Ziellokalisierungen verwenden suffigierte Einträge in `public/locales/<locale>.json`; die Quelllokalisierung behält Plural-Bundles in `public/locales/en-GB.json` neben den üblichen flachen Einträgen.

Die Demo zeigt außerdem einen kleinen grauen Codeblock mit dem JSX-Ausschnitt über den Live-Beispielen als schnelle Referenz.

Auf der Startseite wird außerdem unten eine Demo-SVG angezeigt. Die Bild-URL folgt `public/assets/translation_demo_svg.<locale>.svg` (flaches Layout aus dem `svg`-Block in `ai-i18n-tools.config.json`). Nachdem `translate-svg` ausgeführt wurde, enthält jede Lokalisierungsdatei übersetzte Inhalte für `<text>`, `<title>` und `<desc>`; bis dahin können die committeten Kopien in verschiedenen Lokalisierungen identisch aussehen.

### Dokumentationswebsite (Port 3040)

```bash
cd examples/nextjs-app/docs-site
pnpm install
pnpm build
pnpm start
```

Falls sich der Browser nicht automatisch öffnet, starten Sie ihn manuell und rufen Sie [http://localhost:3040](http://localhost:3040) auf.

## Unterstützte Sprachen

| Code    | Sprache              |
| ------- | -------------------- |
| `ar`    | Arabisch               |
| `en-GB` | Englisch (GB) Standard |
| `fr`     | Französisch              |
| `de`     | Deutsch                  |
| `pt-BR`  | Portugiesisch (Brasilien)|
| `es`     | Spanisch                 |

## Ablauf

### 1. UI-Texte extrahieren

Durchsucht `src/` nach `t()`-Aufrufen und aktualisiert `locales/strings.json`:

```bash
pnpm run i18n:extract
```

### 2. Übersetzen

`OPENROUTER_API_KEY` festlegen und dann aus ``examples/nextjs-app`` alle Übersetzungsschritte (UI-Flach-JSON → SVG-Dateien → Dokumentation) nacheinander ausführen:

```bash
export OPENROUTER_API_KEY=your_key_here
pnpm run i18n:translate
```

Um nur eine Stufe auszuführen, verwenden Sie die CLI (im selben Arbeitsverzeichnis):

```bash
ai-i18n-tools translate-ui
ai-i18n-tools translate-svg
ai-i18n-tools translate-docs
```

### Sync-Befehl

Der Sync-Befehl führt die Extraktion und alle Übersetzungsschritte nacheinander aus:

```bash
pnpm run i18n:sync
```

oder

```bash
ai-i18n-tools sync
```

Die Schritte werden in folgender Reihenfolge ausgeführt:

1. ``ai-i18n-tools extract`` — extrahiert UI-Texte und aktualisiert `locales/strings.json`.
2. ``ai-i18n-tools translate-ui`` — erstellt flache Locale-JSON-Dateien unter `public/locales/` aus `locales/strings.json`.
3. ``ai-i18n-tools translate-svg`` — übersetzt SVG-Dateien von `images/` nach `public/assets/`, wenn `features.translateSVG` auf „true“ steht und der `svg`-Block in `ai-i18n-tools.config.json` gesetzt ist (dieses Beispiel verwendet flache Namen: `translation_demo_svg.<locale>.svg`).
4. ``ai-i18n-tools translate-docs`` — übersetzt Docusaurus-**Seiteninhalte** (Markdown/MDX unter `docs-site/docs/`) nach `docs-site/i18n/<locale>/docusaurus-plugin-content-docs/current/`; wenn `features.translateJSON` und `jsonSource` gesetzt sind, werden außerdem **Shell-JSON**-Dateien aus `docs-site/i18n/en/` übersetzt (gemäß `documentations[]` in `ai-i18n-tools.config.json`; siehe Workflow 2 in `docs/GETTING_STARTED.md` im Repository-Stammverzeichnis).

Sie können jeden Schritt einzeln ausführen (z. B. `ai-i18n-tools translate-svg`), wenn sich nur die Quellen für diesen Teil des Workflows geändert haben.

Wenn die Protokolle viele Übersprünge und nur wenige Schreibvorgänge anzeigen, wiederverwendet das Tool vorhandene Ausgaben und den SQLite-Cache in `.translation-cache/`. Um eine erneute Übersetzung zu erzwingen, übergeben Sie `--force` oder `--force-update` an den entsprechenden Befehl, wo unterstützt, oder führen Sie `pnpm run i18n:clean` aus (löscht nur `.translation-cache/` in diesem Ordner) und übersetzen Sie erneut.

Dieses Beispiel verfügt über `features.translateSVG` und einen `svg`-Block, daher führt `i18n:sync` denselben SVG-Schritt wie `translate-svg` aus. Sie können dennoch `ai-i18n-tools translate-svg` allein für diesen Schritt aufrufen oder `pnpm run i18n:translate` verwenden, um die feste Reihenfolge UI → SVG → Dokumentation auszuführen, ohne `extract` auszuführen.

### 3. Cache bereinigen und erneut übersetzen

Nach Änderungen an der Benutzeroberfläche oder der Dokumentation können einige Cache-Einträge veraltet oder verwaist sein (z. B., wenn ein Dokument entfernt oder umbenannt wurde). `i18n:cleanup` führt zuerst `sync --force-update` aus und entfernt anschließend veraltete Einträge:

```bash
pnpm run i18n:cleanup
```

Um die erneute Übersetzung der Benutzeroberfläche, Dokumente oder SVGs zu erzwingen, verwenden Sie `--force`. Dadurch wird der Cache ignoriert und eine erneute Übersetzung mithilfe von KI-Modellen durchgeführt.

Um das gesamte Projekt erneut zu übersetzen (UI, Dokumente, SVGs):

```bash
pnpm run i18n:sync --force
```

Um ein einzelnes Gebietsschema erneut zu übersetzen:

```bash
pnpm run i18n:sync --force --locale pt-BR
```

Um nur die UI-Texte für ein bestimmtes Gebietsschema erneut zu übersetzen:

```bash
ai-i18n-tools translate-ui --force --locale pt-BR
```

### 4. Manuelle Bearbeitungen (Übersetzungs-Dashboard)

Sie können eine lokale Web-Oberfläche starten, um Übersetzungen im Cache, in den UI-Zeichenfolgen und im Glossar manuell zu überprüfen und zu bearbeiten (aus ``examples/nextjs-app``):

```bash
pnpm run i18n:dashboard
```

Von ``docs-site/`` aus führt ``pnpm run i18n:dashboard`` dasselbe durch (es `cd`t in diesen Ordner und führt die CLI aus).

> **Wichtig:** Wenn Sie einen Eintrag im Übersetzungs-Dashboard manuell bearbeiten, müssen Sie ein `sync --force-update` ausführen (z. B. `pnpm run i18n:sync --force-update`), um die generierten Flachdateien oder Markdown-Dateien mit der aktualisierten Übersetzung neu zu schreiben. Beachten Sie außerdem, dass Ihre manuelle Bearbeitung verloren geht, wenn sich der ursprüngliche Quelltext in Zukunft ändert, da das Tool einen neuen Hash für den neuen Quelltext generiert.

## Projektstruktur

```text
nextjs-app/
├── ai-i18n-tools.config.json # UI, docs, svg, glossary; `cacheDir`: .translation-cache/
├── glossary-user.csv         # Optional user glossary (see config `glossary.userGlossary`)
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
│   ├── en-GB.json            # Source locale bundle (includes plural keys)
│   ├── ui-languages.json     # Copied/served for runtime if needed
│   ├── es.json
│   ├── fr.json
│   ├── de.json
│   ├── pt-BR.json
│   └── ar.json
├── public/assets/            # Per-locale SVGs (translate-svg; page uses translation_demo_svg.<locale>.svg)
│   └── translation_demo_svg.*.svg
├── translated-docs/          # README translations (flat markdown; second `documentations` block)
└── docs-site/                # Docusaurus docs (port 3040)
    ├── docs/                 # English sources for this example (curated subset)
    ├── docusaurus.config.mjs
    └── i18n/                 # Translated docs + Docusaurus JSON catalogs (committed in git)
```

Das englische Markdown für die Beispielwebsite befindet sich unter `docs-site/docs/`. Es gibt keine automatische Synchronisierung vom Stammverzeichnis des Repositorys `docs/`; aktualisieren Sie diese Dateien direkt, wenn Sie Inhalte aktualisieren. Für stabile Überschrift-Anker verwenden Sie Docusaurus ``write-heading-ids`` aus ``docs-site/`` (siehe ``pnpm run write-heading-ids`` in `[docs-site/package.json](../docs-site/package.json)`).

Übersetzte UI-Zeichenketten, Demo-SVGs, Root-`README`-Übersetzungen und Docusaurus-Ausgaben werden unter `public/locales/`, `public/assets/`, `locales/strings.json`, `translated-docs/` und `docs-site/i18n/` committet. Nachdem Sie die Quellen geändert und ``pnpm run i18n:translate`` oder ``pnpm run i18n:sync`` ausgeführt haben, starten Sie die Next.js- und Docusaurus-Entwicklungsserver nach Bedarf neu. Die Locale-Routing- und ``localeConfigs``-Konfiguration ist in `docs-site/docusaurus.config.mjs` definiert.

## Screenshot-Dateien – erwartetes Layout

Die Dokumentation und die README in diesem Beispiel verweisen auf sprachspezifische Screenshots, aber es werden keine tatsächlichen PNG-Dateien committet und kein `take-screenshots`-Skript bereitgestellt. Dieses Beispiel dient der Konfigurationsdemonstration.

### Docusaurus-Dokumentation (`docs-site/docs/`)

Der Docusaurus-`documentations[]`-Block verwendet diese `regexAdjustments`-Regel:

```json
{ "search": "screenshots/[^/]+/", "replace": "screenshots/${translatedLocale}/" }
```

Damit die Beispiel-Seiten sprachspezifische Screenshots anzeigen, müssten sich PNG-Dateien an folgenden Pfaden befinden:

```
docs-site/static/img/screenshots/
├── en-GB/
│   └── screenshot.png
├── de/
│   └── screenshot.png
├── es/
│   └── screenshot.png
├── fr/
│   └── screenshot.png
├── pt-BR/
│   └── screenshot.png
└── ar/
    └── screenshot.png
```

Ein `take-screenshots`-Skript muss die Anwendung in jeder Locale erfassen und nach `docs-site/static/img/screenshots/<locale>/screenshot.png` schreiben. Das Tool schreibt lediglich URLs um – es erstellt keine PNG-Dateien.

### Flache README (`README.md` → `translated-docs/`)

Der zweite `documentations[]`-Block verwendet:

```json
{ "search": "images/screenshots/de/]+/", "replace": "images/screenshots/de/" }
```

Erwartetes Layout:

```
images/screenshots/de/
│   └── overview.png
├── de/
├── es/
├── fr/
├── pt-BR/
└── ar/
```

### Reale Beispiele

- [transrewrt](https://github.com/wsj-br/transrewrt) — flache README mit 37 Locales (Pattern B flat), `take-screenshots.js` erfasst alle Locales
- [duplistatus](https://github.com/wsj-br/duplistatus) — Docusaurus-ko-lokale Screenshots (Pattern C), `take-screenshots.ts` verwendet `getScreenshotDir(locale)`-Split

Siehe den [Leitfaden für Locale-Ressourcen](../../../docs/LOCALE-ASSETS-GUIDE.md) für die vollständige Dokumentation der Muster.
