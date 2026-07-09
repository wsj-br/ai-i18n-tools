<a id="json"></a>
# JSON

Entwickelt für Projekte, die UI-Texte in **verschachtelten JSON-Dateien pro Gebietsschema** (z. B. `src/i18n/en/translation.json`) anstatt in `t("…")` im Quellcode speichern. Die CLI durchläuft Zeichenfolgenwerte in diesen Dateien, übersetzt sie über den aktiven LLM-Anbieter und schreibt Ausgaben pro Gebietsschema unter Verwendung von `json[].outputPathTemplate`. Sie verwendet denselben SQLite-Cache wie `translate-docs` und `translate-svg` (`cacheDir`).

Diese Pipeline führt **kein** `extract` aus – es gibt keinen `strings.json`-Katalog. Aktivieren Sie sie mit `features.translateJson` und einem oder mehreren Einträgen in der obersten Ebene `json[]`.

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

`translate-json` löst Modelle **pro Ziellokale** auf: zuerst `localeModels(locale)`, wenn konfiguriert, dann `translationModels`. Verwenden Sie dies für verschachtelte JSON-Bundles, bei denen bestimmte Lokale von dedizierten Modellen profitieren – zum Beispiel `zh-Hans`- / `zh-Hant`-Themendateien. Siehe [Anbieter und Modelle](/guide/providers-and-models#model-fallback-chain).

<a id="step-1-initialise-for-nested-json"></a>
### Schritt 1: Initialisierung für verschachtelte JSON-Dateien

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Diese Vorlage setzt `features.translateJson: true`, deaktiviert die UI-Extraktion und die Dokumentübersetzung und erstellt einen einzelnen `json[]`-Block, der auf `src/i18n/en/translation.json` mit der Ausgabe `src/i18n/{llocale}/translation.json` verweist. Passen Sie `sourceLocale`, `targetLocales`, `contentPaths` und `outputPathTemplate` an die Struktur Ihres Repositorys an.

<a id="step-2-configure-json"></a>
### Schritt 2: Konfigurieren von `json[]`

Jeder `json[]`-Block beschreibt eine Pipeline:

- `contentPaths` – eine oder mehrere `.json`-Dateien, Verzeichnisse oder Platzhaltermuster (z. B. `"src/i18n/en/translation.json"` oder `"src/i18n/en/overrides/*.json"`). Pfade werden relativ zum Projektstamm aufgelöst.
- `outputPathTemplate` – erforderlich. Gibt an, wohin die Zieldatei jeder Sprache geschrieben wird. Platzhalter: `{locale}`, `{LOCALE}`, `{llocale}` (Kleinschreibung der Sprache, nützlich für Astro-Routenordner), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (optional) – Sprachuntermenge nur für diesen Block; andernfalls gilt die oberste `targetLocales`.
- `keyPolicy` – legt fest, welche JSON-Schlüssel übersetzbaren Text enthalten und welche stabile Bezeichner sind (siehe unten).
- `description` (optional) – wird in CLI-Überschriften und `status`-Ausgabe angezeigt.

Beispiel (mehrere Quelldateien, Ordner mit Sprachcodes in Kleinschreibung):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | Verhalten |
|-------------|-----------|
| `allowlist` | Nur Schlüssel, die `translateKeys` entsprechen (Pfadnotation mit Punkten; minimatch-Platzhalter), werden übersetzt. |
| `denylist`  | Alle Zeichenkettenwerte werden übersetzt, außer Schlüssel, die `skipKeys` entsprechen. |
| `both`      | Zuerst `translateKeys` anwenden, dann Übereinstimmungen aus `skipKeys` entfernen. |

Pfade verwenden die Punkt-Notation (`nav.home.label`). Ein einfacher Name wie `slug` entspricht dem letzten Schlüsselsegment auf jeder Ebene.

<a id="step-3-translate-json-bundles"></a>
### Schritt 3: JSON-Bundles übersetzen

```bash
npx ai-i18n-tools translate-json
```

Optionale Flags (ähnliche Funktionen wie bei `translate-docs`): `-l` / `--locale` für eine Untermenge der Ziele, `-p` / `--path` zur Begrenzung der Dateien, `--dry-run`, `--force` (Löschen der Dateiüberwachung und des Segment-Caches für passende Dateien), `--force-update` (erneutes Verarbeiten, wenn der Datei-Hash übereinstimmt; Segment-Cache bleibt aktiv), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Projekte, die nur JSON verwenden, können ausführen:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Wenn UI- oder Dokumentenübersetzung ebenfalls aktiviert sind, führt `sync` **translate-json nach translate-docs** aus (außer `--no-json`). Überspringen Sie JSON mit `--no-json`.

Überprüfen Sie die Abdeckung pro Datei und Sprache:

```bash
npx ai-i18n-tools status
```

Wenn `translateJson` aktiviert ist, gibt `status` einen `json[]`-Abschnitt aus (✓ aktuell, ● veraltet oder fehlend).

<a id="json-vs-other-pipelines"></a>
### JSON vs. andere Pipelines

| Situation | Verwendung |
|-----------|-------------|
| UI-Zeichenfolgen in `t("…")` / `i18n.t("…")` in JS/TS/Astro | [UI-Zeichenfolgen](/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations`-Katalog (`{ "key": { "message": "…", "description": "…" } }`) | Dokumente — `docs[].docusaurusCatalogDir` + `translate-docs`, **nicht** `json[]` |
| VitePress-Theme/Navigations-/Seitenleisten-Strings | Dokumente — `docsOutput.vitepressThemeCatalog` + `translate-docs`; **nicht** `json[]` verwenden — siehe [VitePress-Integration](/guide/vitepress-integration) |
| Nextra `_meta.ts`-Bezeichnungen und Theme-Wörterbuch `.ts` | Dokumente — `translate-docs` (automatische `_meta` bei `style: "nextra"`, optional `nextraDictionaryPath`); **nicht** `json[]` verwenden — siehe [Nextra-Integration](/guide/nextra-integration) |
| Eigenständige verschachtelte Locale JSON (ZenBrowser-ähnliche `translation.json`-Bäume) | JSON — `json[]` + `translate-json` |
| Illustrierte `.svg`-Dateien mit `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (optional; keine der drei Haupt-Pipelines) |

Feldreferenz: [`json`](#json) in [Konfigurationsreferenz](/reference/configuration#json). Cache-Schlüssel für die Bereinigung verwenden `json-block:{blockIndex}:{projectRelPath}` in `file_tracking`.
