<a id="ui-strings"></a>
# Benutzeroberflächen-Strings

Entwickelt für jedes JS/TS-Projekt, das i18next verwendet: React-Anwendungen, Next.js (Client- und Server-Komponenten), Node.js-Dienste, CLI-Tools.

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihre App | Weiterlesen |
| --- | --- |
| React / Next.js / Node + i18next | [i18next einbinden](/de/guide/ui-strings/i18next-runtime) (Schritt 4) |
| Reines HTML (kein `t()` im Markup) | [Reine HTML-Apps](/de/guide/ui-strings/plain-html) |
| Astro Marketing-Website (hybrid) | [Astro-Website](/de/guide/ui-strings/astro-website) |
| `t()`-Regeln, Interpolation, Plurale | [t()-Aufrufe & Plurale](/de/guide/ui-strings/t-calls-and-plurals) |
| Sprachauswahl / RTL | [Sprachumschalter & RTL](/de/guide/ui-strings/language-switcher) |
| Laufzeit-API-Signaturen | [Laufzeit-Helfer](/de/guide/runtime-helpers) |

<a id="step-1-initialise"></a>
## Schritt 1: Initialisieren

```bash
npx ai-i18n-tools init
```

Dies schreibt `ai-i18n-tools.config.json` mit der `ui-markdown`-Vorlage. Bearbeiten Sie diese, um folgende Einstellungen vorzunehmen:

- `sourceLocale` - Ihr Quellsprache BCP-47-Code (z. B. `"en-GB"`). **Muss übereinstimmen** `SOURCE_LOCALE` exportiert aus Ihrer Laufzeit-i18n-Setup-Datei (`src/i18n.ts` / `src/i18n.js`).
- `targetLocales` - Array von BCP-47-Codes für Ihre Zielsprache(n) (z. B. `["de", "fr", "pt-BR"]`). Führen Sie `generate-ui-languages` aus, um das `ui-languages.json`-Manifest aus dieser Liste zu erstellen.
- `ui.sourceRoots` - Verzeichnisse oder Glob-Muster, die nach `t("…")`-Aufrufen durchsucht werden sollen (z. B. `["src/"]`, `["src/**/*.ts"]`).
- `ui.stringsJson` - Wo das Master-Katalog geschrieben werden soll (z. B. `"src/locales/strings.json"`).
- `ui.flatOutputDir` – wo `de.json`, `pt-BR.json` usw. geschrieben werden sollen (z. B. `"src/locales/"`).
- `providers.<active>.uiModels` (optional) – geordnete, nur für die Benutzeroberfläche bestimmte Modellliste für `translate-ui`, Pluralgenerierung und `proofread-ui` (nach einem übereinstimmenden `localeModels`-Eintrag, vor `translationModels`). Siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain).

<a id="step-2-extract-strings"></a>
## Schritt 2: Zeichenfolgen extrahieren

```bash
npx ai-i18n-tools extract
```

Durchsucht alle JS/TS-Dateien unter `ui.sourceRoots` nach `t("literal")`- und `i18n.t("literal")`-Aufrufen. Schreibt (oder führt ein in) `ui.stringsJson`.

Der Scanner ist konfigurierbar: Fügen Sie benutzerdefinierte Funktionsnamen über `ui.uiExtractor.funcNames` (oder das ältere `ui.reactExtractor.funcNames`) hinzu. Für Astro-Seiten und -Komponenten fügen Sie `.astro` zu `ui.uiExtractor.extensions` hinzu. Für reines HTML siehe [Reine HTML-Apps](/de/guide/ui-strings/plain-html).

<a id="step-3-translate-ui-strings"></a>
## Schritt 3: UI-Zeichenfolgen übersetzen

```bash
npx ai-i18n-tools translate-ui
```

Liest `strings.json`, sendet Batches an den aktiven LLM-Anbieter für jedes Zielland, schreibt flache JSON-Dateien (`de.json`, `fr.json` usw.) nach `ui.flatOutputDir`. Die Modellauswahl verwendet die UI-Kette: `localeModels(locale)` → `uiModels` → `translationModels` (siehe [Anbieter und Modelle](/de/guide/providers-and-models#model-fallback-chain)).

<a id="per-locale-model-overrides"></a>
### Modellüberschreibungen pro Gebietsschema

Optionale `providers.<active>.localeModels`-Einträge ordnen ein BCP-47-Gebietsschema einer geordneten Modellliste zu, die **vor** `uiModels` und `translationModels` für dieses Gebietsschema versucht wird. Dieselben `localeModels`-Einträge gelten auch für die Dokument-, JSON- und SVG-Übersetzung. Gebietsschema-Tags werden ohne Berücksichtigung der Groß-/Kleinschreibung abgeglichen (`pt-br` = `pt-BR`). Wenn kein Eintrag übereinstimmt, werden für die UI-Arbeit nur `uiModels` und `translationModels` verwendet.

Für jeden Eintrag speichert `translate-ui` die **Modell-ID des aktiven Anbieters**, der jede Sprache erfolgreich übersetzt hat, in einem optionalen `models`-Objekt (dieselben Sprachschlüssel wie `translated`). Im Übersetzungs-Dashboard bearbeitete Zeichenfolgen werden mit dem Sentinel-Wert `user-edited` in `models` für diese Sprache markiert. Die sprachspezifischen Flatfiles unter `ui.flatOutputDir` bleiben nur **Quellzeichenfolge → Übersetzung**; sie enthalten keine `models` (sodass Laufzeit-Bundles unverändert bleiben).

> **Hinweis:** Dashboard-Bearbeitungen von UI-Zeichenfolgen befinden sich in `strings.json`, nicht im SQLite-Dokumentations-Cache. Führen Sie einfaches `sync` oder `translate-ui` (ohne spezielles Flag) aus, um Flat-Sprachdateien aus dem Katalog neu zu schreiben – `--force-update` wird **nicht** an den UI-Schritt weitergeleitet. Vermeiden Sie `--force` bei UI-Befehlen nach manuellen Bearbeitungen: Es übersetzt jeden Eintrag neu und kann Ihre `user-edited`-Zeilen überschreiben.

Binden Sie dann i18next zur Laufzeit ein – [i18next einbinden](/de/guide/ui-strings/i18next-runtime).

<a id="exporting-to-xliff-20-optional"></a>
## Exportieren nach XLIFF 2.0 (optional)

Um UI-Zeichenketten an einen Übersetzungsdienstleister, ein TMS oder ein CAT-Tool weiterzugeben, exportieren Sie den Katalog als **XLIFF 2.0** (eine Datei pro Zielsprachgebiet). Dieser Befehl ist **schreibgeschützt**: Er verändert `strings.json` nicht und ruft keine API auf.

```bash
npx ai-i18n-tools export-ui-xliff
```

Standardmäßig werden die Dateien neben `ui.stringsJson` abgelegt, mit Namen wie `strings.de.xliff`, `strings.pt-BR.xliff` (Basisname Ihres Katalogs + Sprachgebiet + `.xliff`). Verwenden Sie `-o` / `--output-dir`, um an anderer Stelle zu schreiben. Vorhandene Übersetzungen aus `strings.json` erscheinen in `<target>`; fehlende Sprachgebiete verwenden `state="initial"` ohne `<target>`, sodass Tools diese ergänzen können. Verwenden Sie `--untranslated-only`, um nur Einheiten zu exportieren, die für jedes Sprachgebiet noch übersetzt werden müssen (nützlich für Aufträge an Dienstleister). `--dry-run` gibt Pfade aus, ohne Dateien zu schreiben.
