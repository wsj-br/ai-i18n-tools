<a id="json"></a>
# JSON

Entwickelt für Projekte, die UI-Texte in **verschachtelten JSON-Dateien pro Gebietsschema** (z. B. `src/i18n/en/translation.json`) anstatt in `t("…")` im Quellcode speichern. Die CLI durchläuft Zeichenfolgenwerte in diesen Dateien, übersetzt sie über den aktiven LLM-Anbieter und schreibt Ausgaben pro Gebietsschema unter Verwendung von `json[].outputPathTemplate`. Sie verwendet denselben SQLite-Cache wie `translate-docs` und `translate-svg` (`cacheDir`).

Diese Pipeline führt **kein** `extract` aus – es gibt keinen `strings.json`-Katalog. Aktivieren Sie sie mit `features.translateJson` und einem oder mehreren Einträgen in der obersten Ebene `json[]`.

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

`translate-json` löst Modelle **pro Ziellokale** auf: zuerst `localeModels(locale)`, wenn konfiguriert, dann `translationModels`. Verwenden Sie dies für verschachtelte JSON-Bundles, bei denen bestimmte Lokale von dedizierten Modellen profitieren – zum Beispiel `zh-Hans`- / `zh-Hant`-Themendateien. Siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain).

<a id="step-1-initialise-for-nested-json"></a>
### Schritt 1: Initialisierung für verschachtelte JSON-Dateien

```bash
ai-i18n-tools init -t ui-json-bundles [-P <provider>]
```

Diese Vorlage setzt `features.translateJson: true`, deaktiviert die UI-Extraktion und Dokumentübersetzung und erstellt einen einzelnen `json[]`-Block, der auf `src/i18n/en/translation.json` mit der Ausgabe `src/i18n/{llocale}/translation.json` verweist. Sie enthält auch einen Standard-`provider`- / `providers`-Block (`openrouter`, es sei denn, Sie übergeben `-P <provider>`) – legen Sie den passenden API-Schlüssel fest (oder verwenden Sie lokales Ollama), bevor Sie `translate-json` oder `sync` ausführen; siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key). Bearbeiten Sie `sourceLocale`, `targetLocales`, `contentPaths` und `outputPathTemplate` für Ihr Repo-Layout.

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
ai-i18n-tools translate-json
```

Optionale Flags (gleiche Ideen wie `translate-docs`): `-l` / `--locale` für eine Untermenge von Zielen, `-p` / `--path` zur Begrenzung von Dateien, `--dry-run`, `--force` (Dateiverfolgung und Segment-Cache für übereinstimmende Dateien löschen), `--force-update` (erneute Verarbeitung, wenn Dateihash übereinstimmt; Segment-Cache gilt weiterhin), `--check-cache` (erneute Validierung von gecachten Segmenten für Locales mit erzwungenem nativem Skript, selbst wenn die Dateiverfolgung übereinstimmt), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Projekte, die nur JSON verwenden, können ausführen:

```bash
ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Wenn UI- oder Dokumentenübersetzung ebenfalls aktiviert sind, führt `sync` **translate-json nach translate-docs** aus (außer `--no-json`). Überspringen Sie JSON mit `--no-json`.

Überprüfen Sie die Abdeckung pro Datei und Sprache:

```bash
ai-i18n-tools status
```

Wenn `translateJson` aktiviert ist, gibt `status` einen `json[]`-Abschnitt aus (✓ aktuell, ● veraltet oder fehlend).

<a id="json-vs-other-pipelines"></a>
### JSON vs. andere Pipelines

| Situation | Verwendung |
|-----------|-------------|
| UI-Zeichenfolgen in `t("…")` / `i18n.t("…")` in JS/TS/Astro | [UI-Zeichenfolgen](/de/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations`-Katalog (`{ "key": { "message": "…", "description": "…" } }`) | Dokumente — `docs[].docusaurusCatalogDir` + `translate-docs`, **nicht** `json[]` |
| VitePress-Themen/Navigation/Seitenleisten-Zeichenfolgen | Dokumente — `docsOutput.vitepressThemeCatalog` + `translate-docs`; **verwenden Sie nicht** `json[]` — siehe [VitePress-Integration](/de/guide/integrations/vitepress) |
| Nextra-`_meta.ts`-Beschriftungen und Themenwörterbuch `.ts` | Dokumente — `translate-docs` (automatisch `_meta` wenn `style: "nextra"`, optional `nextraDictionaryPath`); **verwenden Sie nicht** `json[]` — siehe [Nextra-Integration](/de/guide/integrations/nextra) |
| Fumadocs-`meta.json`-Beschriftungen und UI-Überschreibungskatalog | Dokumente — `translate-docs` (automatisch `meta.json` wenn `style: "fumadocs"`, optional `fumadocsUiCatalog`); **verwenden Sie nicht** `json[]` — siehe [Fumadocs-Integration](/de/guide/integrations/fumadocs) |
| Eigenständige verschachtelte Locale JSON (ZenBrowser-ähnliche `translation.json`-Bäume) | JSON — `json[]` + `translate-json` |
| i18next-Namespace-Dateien (`public/locales/en/common.json`, <code v-pre>{{name}}</code>-Tokens, `key_one`- / `key_other`-Suffixe) | JSON — `json[]` + `translate-json` (siehe [i18next-Namespace-Dateien](#i18next-namespace-files)) |
| Intlayer `*.content.ts`-Wörterbücher + `useIntlayer` | [Migration von Intlayer](/de/guide/migrating-from-intlayer) — `migrate-intlayer`, dann UI-Strings |
| Illustrierte `.svg`-Dateien mit `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](/de/reference/configuration#svg) + `translate-svg` (optional; keine der drei Haupt-Pipelines) |

Feldreferenz: [`json`](#json) in [Konfigurationsreferenz](/de/reference/configuration#json). Cache-Schlüssel für die Bereinigung verwenden `json-block:{blockIndex}:{projectRelPath}` in `file_tracking`.

<a id="i18next-namespace-files"></a>
### i18next-Namespace-Dateien

Die JSON-Pipeline deckt typische i18next-Schlüssel/Wert-Gebietsschemadateien ab: verschachtelte Objekte, String-Arrays, <code v-pre>{{name}}</code>-Interpolation in Werten und unabhängige Plural-Suffix-Schlüssel (`welcome_one`, `welcome_other`). Sie schreibt **nicht** `t("some.key")`-Aufrufstellen um – diese bleiben schlüsselbasiert. Um ein Projekt auf das englische Quellstring-`t()`-Schema von ai-i18n-tools umzustellen, ändern Sie die Aufrufstellen in `t("English text")` (oder führen Sie `migrate-intlayer` aus, wenn die Quelle Intlayer `.content.ts` ist).

Beispiel (englische Quell-Namespaces unter `public/locales/en/`):

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": { "translateJson": true },
  "json": [
    {
      "description": "i18next namespaces",
      "contentPaths": ["public/locales/en/*.json"],
      "outputPathTemplate": "public/locales/{locale}/{basename}"
    }
  ]
}
```

`key_one` / `key_other` / `key_zero` (und andere CLDR-Suffixe) werden als separate Blätter übersetzt. Das reicht aus, damit i18next Plurale weiterhin nach Suffix auflöst; die Pipeline gruppiert sie nicht in einer einzigen Katalogzeile.
