<a id="configuration-reference"></a>
# Konfigurationsreferenz

<a id="sourcelocale"></a>
### `sourceLocale`

BCP-47-Code für die Ausgangssprache (z. B. `"en-GB"`, `"en"`, `"pt-BR"`). Für diese Sprache wird keine Übersetzungsdatei generiert – der Schlüsseltext selbst ist der Ausgangstext.

**Muss** `SOURCE_LOCALE` entsprechen, der aus Ihrer Laufzeit-i18n-Konfigurationsdatei exportiert wird (`src/i18n.ts` / `src/i18n.js`).

<a id="targetlocales"></a>
### `targetLocales`

Array mit BCP-47-Gebietsschemaschlüsseln, in die übersetzt werden soll (z. B. `["de", "fr", "es", "pt-BR"]`).

`targetLocales` ist die primäre Gebietsschema-Liste für die UI-Übersetzung und die Standard-Gebietsschema-Liste für Dokumentationsblöcke. Verwenden Sie `generate-ui-languages`, um das `ui-languages.json`-Manifest aus `sourceLocale` + `targetLocales` zu erstellen.

<a id="uilanguage-optional"></a>
### `uiLanguage` (optional)

BCP-47-Code für die eigene UI-Sprache des Tools (CLI-Hilfe, Protokolle/Zusammenfassungen und das Übersetzungs-Dashboard). Er ist unabhängig von `sourceLocale` / `targetLocales` und wird durch das Flag `-L` / `--ui-lang` sowie die Umgebungsvariable `AI_I18N_LANG` überschrieben. Unbekannte Werte werden ordnungsgemäß auf das Quellgebietsschema (`en-GB`) herabgestuft – es gibt keine strikte Validierung. Siehe [Tool-UI-Sprache](/de/guide/tool-ui-language).

<a id="languagesmanifestpath-optional"></a>
### `languagesManifestPath` (optional)

Optionale Zeichenfolge auf Stammebene (nicht unter `ui` verschachtelt). Pfad, unter dem `extract` und `generate-ui-languages` das `ui-languages.json`-Manifest schreiben und von dem die CLI es für Anzeigenamen und die Nachbearbeitung von Sprachlisten liest. Wenn weggelassen, wird beim Laden der Konfiguration standardmäßig `ui.flatOutputDir/ui-languages.json` verwendet.

Verwenden Sie dies, wenn:

- Das Manifest sollte sich außerhalb von `ui.flatOutputDir` befinden (z. B. neben App-Helfern unter `src/i18n/`).
- Sie möchten die [Nachbearbeitung des Sprachumschalters](#language-switcher-languagelistblock) (`languageListBlock`), um Gebietsschema-Bezeichnungen aus dem Projektmanifest und nicht nur aus dem gebündelten Masterkatalog zu erstellen.

`includeUiLanguageEnglishNames` liest diese Datei **nicht** – es verwendet den gebündelten Masterkatalog (siehe `ui.uiExtractor` unten).

**Legacy:** Das Stammverzeichnis `uiLanguagesPath` wird beim Laden einer Konfigurationsdatei weiterhin akzeptiert und automatisch in `languagesManifestPath` umgeschrieben.

<a id="concurrency-optional"></a>
### `concurrency` (optional)

Maximale Anzahl gleichzeitig übersetzter **Zielgebietsschemata** (`translate-ui`, `translate-docs`, `translate-svg` und die entsprechenden Schritte in `sync`). Wenn nicht angegeben, verwendet die CLI standardmäßig **4** für die UI-Übersetzung und **3** für die Dokumentationsübersetzung (integrierte Vorgaben). Kann pro Ausführung mit `-j` / `--concurrency` überschrieben werden.

<a id="batchconcurrency-optional"></a>
### `batchConcurrency` (optional)

**translate-docs**, **translate-svg** und **translate-json** (und die entsprechenden Schritte innerhalb von `sync`): maximale parallele LLM-**Batch**-Anfragen pro Datei (jeder Batch kann viele Segmente enthalten). Standardwert **4**, wenn weggelassen. Wird von `translate-ui` ignoriert. Überschreiben mit `-b` / `--batch-concurrency`.

<a id="fileconcurrency-optional"></a>
### `fileConcurrency` (optional)

Maximale Anzahl gleichzeitig verarbeiteter Dateien **innerhalb einer einzelnen Sprachumgebung** während `translate-docs` und `sync`. Bei Werten größer als **1** werden Dateien innerhalb derselben Sprachumgebung parallel verarbeitet, wobei ein Semaphore zur Steuerung des Speicherverbrauchs verwendet wird. Standardwert ist **1** (sequenzielle Verarbeitung), wenn nicht angegeben. Höhere Werte können den Durchsatz bei I/O-gebundenen Operationen erheblich verbessern, insbesondere wenn alle Segmente bereits zwischengespeichert sind (keine API-Aufrufe erforderlich).

**Beispiel:**

```json
{
  "fileConcurrency": 4
}
```

**Anwendungsfall:** Setzen Sie dies auf `2-4`, wenn Sie `sync --force-update` mit 100 % Cache-Treffern ausführen, um die Gesamtverarbeitungszeit zu verkürzen. Die Verbesserung ist besonders bei vielen kleinen Dateien deutlich spürbar.

<a id="batchsize--maxbatchchars-optional"></a>
### `batchSize` / `maxBatchChars` (optional)

Segment-Batching für **translate-docs**, **translate-svg** und **translate-json**: wie viele Segmente pro API-Anfrage und eine Zeichenobergrenze. Standardwerte: **20** Segmente, **4096** Zeichen (wenn weggelassen).

<a id="provider-and-providers"></a>
### `provider` und `providers`

`provider` (Top-Level, optional) wählt den aktiven Provider-Schlüssel aus `providers`. Er ist optional, wenn genau ein Provider konfiguriert ist; erforderlich, wenn mehr als einer konfiguriert ist.

`providers` (Top-Level) ordnet einen Provider-Schlüssel seinem Block zu. Eingebaute Schlüssel (siehe Preset-Tabelle unten) benötigen nur `translationModels`; jeder andere Schlüssel definiert einen benutzerdefinierten OpenAI-kompatiblen Endpunkt und erfordert `baseUrl` (plus `apiKeyEnv`, es sei denn, der Endpunkt benötigt keinen Schlüssel).

Jeder `providers.<name>`-Block akzeptiert:

- `translationModels`
  Bevorzugte geordnete Liste von Modell-IDs (reine Upstream-IDs, kein `provider/`-Präfix; OpenRouter-IDs behalten ihr natives `vendor/model`-Format). Die erste wird zuerst versucht; spätere Einträge sind Fallbacks bei Fehlern. Dies ist die globale Standardkette für jede Pipeline, wenn keine spezifischere Ebene zutrifft.
- `uiModels` (optional)
  Geordnete, nur für die Benutzeroberfläche bestimmte Modellliste für `translate-ui`, Pluralgenerierung (Schritt 0 und Durchgang B) und `proofread-ui`. Wird nach jedem passenden `localeModels`-Eintrag für das Zielland vor `translationModels` versucht.
- `localeModels` (optional)
  Pro-Locale-Überschreibungen für **alle** Übersetzungs-Pipelines. Array von `{ "locale": "<BCP-47>", "models": ["…"] }`-Objekten. Locale-Tags werden unabhängig von Groß- und Kleinschreibung abgeglichen (`pt-br` = `pt-BR`). Die Liste jedes Locales wird zuerst nur für dieses Locale versucht, dann Pipeline-spezifische Ebenen (`uiModels` für UI) und `translationModels`. Doppelte normalisierte Locale-Schlüssel werden beim Laden der Konfiguration abgelehnt.
- `baseUrl`
  OpenAI-kompatible Basis-URL. Überschreibt die voreingestellte Basis-URL; erforderlich für einen nicht voreingestellten Anbieter.
- `apiKeyEnv`
  Umgebungsvariable, die den API-Schlüssel enthält. Überschreibt die voreingestellte Umgebungsvariable.
- `headers`
  Zusätzliche HTTP-Header, die mit jeder Anfrage an diesen Anbieter gesendet werden.
- `maxTokens`
  Maximale Vervollständigungs-Tokens pro Anfrage. Standard: `8192`.
- `temperature`
  Sampling-Temperatur. Standard: `0.2`.
- `requestTimeoutMs`
  Maximale Wartezeit in Millisekunden für jede Anfrage. Standard: `30000` (30 Sekunden).

Integrierte Anbieter-Presets (Schlüssel — Basis-URL — API-Schlüssel-Umgebungsvariable):

| Anbieter | Basis-URL | API-Schlüssel-Umgebungsvariable |
| --- | --- | --- |
| `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GOOGLE_API_KEY` |
| `deepseek` | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` |
| `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |
| `alibaba` | `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` | `ALIBABA_API_KEY` |
| `apifun` | `https://api.apikey.fun/v1` | `APIFUN_API_KEY` |
| `ollama` | `http://localhost:11434/v1` | (keine) |

Ein Legacy-Top-Level-`openrouter`-Block (mit `baseUrl`, `translationModels`, `defaultModel`, `fallbackModel`, `maxTokens`, `temperature`, `requestTimeoutMs`) wird immer noch akzeptiert und beim Laden automatisch in `providers.openrouter` (mit `provider: "openrouter"`) migriert; `defaultModel` / `fallbackModel` werden in `translationModels` zusammengefasst.

Ein ausführbares Beispiel, das mehrere Anbieter in einer Konfiguration konfiguriert und mit `-P` zwischen ihnen wechselt, finden Sie unter [`examples/multi-provider`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/multi-provider/) (`openai`, `anthropic`, `nvidia` und `deepseek` im selben Dokument).

**Warum mehrere Modelle verwenden:** Verschiedene Provider und Modelle haben unterschiedliche Kosten und bieten unterschiedliche Qualitätsstufen über Sprachen und Gebiete hinweg. Konfigurieren Sie `translationModels` **als eine geordnete Fallback-Kette** (anstatt eines einzelnen Modells), damit die CLI das nächste Modell versuchen kann, wenn eine Anfrage fehlschlägt.

Betrachten Sie die folgende Liste als **Grundlage**, die Sie erweitern können: Wenn die Übersetzung für ein bestimmtes Gebietsschema schlecht oder erfolglos ist, recherchieren Sie, welche Modelle diese Sprache oder Schrift effektiv unterstützen (siehe Online-Ressourcen oder die Dokumentation Ihres Anbieters), und fügen Sie diese Modell-IDs als weitere Alternativen hinzu.

Diese Liste wurde auf **umfassende Abdeckung verschiedener Sprachen** in einem großen Dokumentationsprojekt mit 36 Ziel-Lokalisierungen getestet; sie dient als praktischer Standard, ist jedoch nicht garantiert für jede Lokalisierung optimal.

Beispiel `translationModels` (gleiche Standardeinstellungen wie `npx ai-i18n-tools init`):

<details>
<summary>Standard-Übersetzungsmodell-Fallback-Liste</summary>

```json
"translationModels": [
  "qwen/qwen3-235b-a22b-2507",
  "openai/gpt-4o-mini",
  "deepseek/deepseek-v4-flash",
  "anthropic/claude-3-haiku",
  "qwen/qwen3.6-plus",
  "anthropic/claude-3.5-haiku",
  "google/gemini-3-flash-preview",
  "~anthropic/claude-haiku-latest",
  "google/gemma-4-31b-it",
  "~anthropic/claude-sonnet-latest",
  "openai/gpt-5.3-codex"
  // … add more fallback models as needed
]
```

</details>

<br />

Legen Sie die API-Schlüssel-Umgebungsvariable des aktiven Providers (z. B. `OPENROUTER_API_KEY`) in Ihrer Umgebung oder in der `.env`-Datei fest.

Bevor Sie Modelllisten ändern, führen Sie `npx ai-i18n-tools check-models` aus. Für jeden Anbieter überprüft es jede konfigurierte Modell-ID (`translationModels`, `uiModels` und alle `localeModels`-Einträge) anhand der Live-Modellliste dieses Anbieters (`GET /models`), meldet fehlende oder über `expiration_date` liegende IDs, listet die gültigen Modelle auf und beendet sich mit einem von Null verschiedenen Wert, wenn eine konfigurierte ID ungültig ist. Wenn der Anbieter Preise zurückgibt (z. B. OpenRouter), werden auch geschätzte Eingabe-/Ausgabepreise (USD pro 1 Mio. Tokens) angezeigt.

Um die konfigurierten Modelle bei der tatsächlichen Übersetzungsarbeit zu vergleichen, führen Sie `npx ai-i18n-tools bench-models` aus. Es bewertet jede eindeutige Modell-ID aus `translationModels`, `uiModels` und `localeModels`, indem es eine Stichprobe durch jedes Modell isoliert (parallel, begrenzt durch `concurrency`) übersetzt und pro Modell die Eingabe-/Ausgabe-Tokens, die verstrichene Zeit und die USD-Kosten ausgibt, sodass Sie Geschwindigkeit gegen Preis abwägen können, bevor Sie sich für Modelllisten entscheiden.

<a id="features"></a>
### `features`

| Feld | Pipeline | Beschreibung |
|---|---|---|
| `translateUIStrings` | 1 | Extrahiert `t("…")` / `i18n.t("…")` in `strings.json`, übersetzt dann Einträge und schreibt Flat JSON pro Gebietsschema (die Extraktion läuft automatisch; verwenden Sie das eigenständige `extract`, um nur den Katalog zu aktualisieren). |
| `translateDocs` | 2 | Übersetzt `.md` / `.mdx` / `.astro` Seiten; Docusaurus Shell-JSON, wenn `docs[].docusaurusCatalogDir` gesetzt ist; Nextra `_meta` / Wörterbuch, wenn konfiguriert; VitePress-Theme, wenn `docsOutput.vitepressThemeCatalog` gesetzt ist; Fumadocs `meta.json` / UI-Katalog, wenn `docsOutput.style` `"fumadocs"` ist. |
| `translateJson` | 3 | Beliebige verschachtelte JSON-Struktur unter `json[]` (`translate-json`). |
| `translateSVG` | — | Übersetzen Sie `.svg`-Dateien (erfordert den `svg`-Block auf oberster Ebene). |

**Übersetzen** Sie SVG-Dateien mit `translate-svg`, wenn `features.translateSVG` wahr ist und ein oberster `svg`-Block konfiguriert ist. Der Befehl `sync` führt diesen Schritt aus, wenn beide gesetzt sind (es sei denn, `--no-svg` ist angegeben).

<a id="ui"></a>
### `ui`

- `sourceRoots`  
  Verzeichnisse oder Glob-Muster (relativ zum aktuellen Verzeichnis), die nach `t("…")`-Aufrufen durchsucht werden. Unterstützt Muster wie `src/` oder `["src/**/*.ts"]`.
- `stringsJson`  
  Pfad zur Master-Katalogdatei. Wird von `extract` aktualisiert.
- `flatOutputDir`  
  Verzeichnis, in das die JSON-Dateien pro Locale geschrieben werden (`de.json`, etc.).
- `uiExtractor.funcNames` (oder veraltet `reactExtractor.funcNames`)  
  Zusätzliche zu scannende Funktionsnamen (Standard: `["t", "i18n.t"]`).
- `uiExtractor.extensions` (oder veraltet `reactExtractor.extensions`)  
  Dateierweiterungen, die eingeschlossen werden sollen (Standard: `[".js", ".jsx", ".ts", ".tsx"]`). Fügen Sie `.astro` für Astro-Frontmatter und Template-Ausdrücke hinzu.
- `uiExtractor.includePackageDescription` (oder veraltet `reactExtractor.includePackageDescription`)  
  Wenn `true` (Standard), schließt `extract` auch `package.json` `description` als UI-String ein, falls vorhanden.
- `uiExtractor.packageJsonPath` (oder veraltet `reactExtractor.packageJsonPath`)  
  Benutzerdefinierter Pfad zur `package.json`-Datei, die für die optionale Beschreibungsextraktion verwendet wird.
- `uiExtractor.includeUiLanguageEnglishNames` (oder veraltet `reactExtractor.includeUiLanguageEnglishNames`)

Wenn `true` (Standard `false`), fügt `extract` auch jedes `englishName` aus dem gebündelten ui-languages-Masterkatalog (erstellt aus `sourceLocale` + `targetLocales`) zu `strings.json` hinzu, wenn es nicht bereits aus dem Quellscan vorhanden ist (gleiche Hash-Schlüssel). Liest `languagesManifestPath` nicht.

<a id="cachedir"></a>
### `cacheDir`

- `cacheDir`
SQLite-Cache-Verzeichnis (wird von allen `docs`-Blöcken gemeinsam genutzt). Standard `.translation-cache`. Wiederverwendung über mehrere Ausführungen hinweg. Wenn Sie von einem benutzerdefinierten Dokumentübersetzungs-Cache migrieren, archivieren oder löschen Sie ihn – `cacheDir` erstellt eine eigene SQLite-Datenbank und ist nicht mit anderen Schemata kompatibel.

<a id="best-practice-for-git-exclusions"></a>
#### Best Practice für git-Ausschlüsse:

- Schließen Sie den Inhalt des Übersetzungs-Cache-Ordners aus (z. B. mithilfe von `.gitignore` oder `.git/info/exclude`), um das Einchecken temporärer Cache-Artefakte zu verhindern.
- Behalten Sie `cache.db` bei (löschen Sie es nicht routinemäßig), da die Beibehaltung des SQLite-Caches verhindert, dass unveränderte Segmente erneut übersetzt werden. Dies spart sowohl Laufzeit- als auch API-Kosten, wenn Software, die `ai-i18n-tools` verwendet, aktualisiert oder geändert wird.
- Schließen Sie temporäre Dateien und Protokolldateien aus, um das Einchecken von Sicherungs- und Debug-Dateien zu vermeiden.

<br/>

**Beispiel:**

```gitignore
# Translation cache directory
.translation-cache/*

# Keep SQLite cache for reuse
!.translation-cache/cache.db

# Temporary and log files
*.tmp
*.log
```

<a id="docs"></a>
### `docs`

Array von Dokumentationspipeline-Blöcken. `translate-docs` und die Dokumentationsphase von `sync` **verarbeiten jeden** Block der Reihe nach. Legacy-Schlüssel werden zur Ladezeit weiterhin akzeptiert und neu geschrieben, wenn die Konfigurationsdatei beschreibbar ist; bevorzugen Sie aktuelle Namen in neuen Konfigurationen.

| Legacy-Schlüssel | Aktueller Schlüssel / Verhalten |
| --- | --- |
| `documentations` | `docs` |
| `markdownOutput` | `docs[].docsOutput` |
| `jsonSource` | `docs[].docusaurusCatalogDir` |
| Top-Level `openrouter` | `providers.openrouter` + `provider: "openrouter"` |
| `features.translateMarkdown` | `features.translateDocs` |
| `features.translateJSON` | entfernt (verwenden Sie `docs[].docusaurusCatalogDir` oder `json[]`) |
| `features.extractUIStrings` | entfernt (`extract` läuft vor der UI-Übersetzung) |
| `glossary.uiGlossaryFromStringsJson` | `glossary.uiGlossary` |
| `ui.reactExtractor` | `ui.uiExtractor` (Alias wird weiterhin akzeptiert) |
| `svg.svgExtractor.forceLowercase` | `svg.forceLowercase` |

**Inhaltsquellen**

- `description`
Optionale, menschenlesbare Notiz für diesen Block (wird nicht für Übersetzungen verwendet). Wird bei Angabe dem `translate-docs`-`🌐`-Überschriftentitel vorangestellt; erscheint auch in `status`-Abschnittsüberschriften.
- `contentPaths`
Markdown-/MDX-Seiteninhalte und `.astro`-Vorlagen, die übersetzt werden sollen (`translate-docs` durchsucht diese nach `.md`, `.mdx` und `.astro`). Unterstützt **Verzeichnispfade oder Glob-Muster** (z. B. `"docs/**/*.md"`, `"guides/*.mdx"`, `"src/pages/index.astro"`). Hieraus stammt der lokalisierte Dokumentationstext.
- `sourceFiles`
Optionaler Alias, der beim Laden in `contentPaths` zusammengeführt wird.
- `targetLocales`
Optionale Untermenge von Sprachen (Lokalisierungen) nur für diesen Block (sonst die obergeordnete `targetLocales`). Die wirksamen Dokumentationssprachen ergeben sich als Vereinigung über alle Blöcke.
- `docusaurusCatalogDir`
Optional. Quellverzeichnis für Docusaurus-JSON-Label-Kataloge für diesen Block (z. B. `"i18n/en"` von `docusaurus write-translations`). Seiteninhalte stammen immer von `contentPaths`; `docusaurusCatalogDir` liefert nur Shell-/UI-JSON, nicht MDX.
- `nextraMetaGlob`
Optionale Glob(s) für Nextra `_meta.ts` / `_meta.tsx` / `_meta.js` unter `docsRoot`. Wenn `docsOutput.style` auf `"nextra"` gesetzt ist und dies weggelassen wird, werden alle `_meta`-Dateien unter `docsRoot` automatisch gesammelt.
- `nextraMetaTranslatableKeys`
Optionale Eigenschaftsnamen, deren Zeichenfolgenwerte in Nextra `_meta`-Objekten übersetzt werden (Standard: `title`, `display`, `breadcrumb`).
- `nextraDictionaryPath`
Optionales englisches Nextra-Theme-Wörterbuchmodul (z. B. `"app/_dictionaries/en.ts"`). Wird während `{dir}/{locale}.ts` nach `translate-docs` übersetzt.
- `nextraDictionaryOutputTemplate`
Optionale Ausgabevorlage für lokale Wörterbuchmodule (Standard: `{dir}/{locale}.ts` relativ zum Wörterbuchverzeichnis).

**Ausgabe-Layout**

- `outputDir`
Stammverzeichnis für die übersetzte Ausgabe dieses Blocks.
- `docsOutput.style`
`"nested"` (Standard), `"flat"`, `"doc-system"` oder Aliase `"docusaurus"` / `"astro-starlight"` / `"vitepress"` / `"nextra"`.
- `docsOutput.localeSubpath`
Pfadsegment zwischen `{locale}/` und `{relativeToDocsRoot}` für `doc-system` (erforderlich bei direkter Verwendung von `style: "doc-system"`; voreingestellt bei Verwendung eines Alias). Verwenden Sie `""` für Starlight-ähnliche Locale-Ordner.
- `docsOutput.docsRoot`
Quell-Dokumentationsstamm für Docusaurus-Layout (z. B. `"docs"`). Standard `"docs"`, wenn weggelassen.
- `docsOutput.pathTemplate`
Benutzerdefinierter Markdown-Ausgabepfad. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{docsRoot}"</code>, <code>"{relativeToDocsRoot}"</code>.
- `docsOutput.jsonPathTemplate`
Benutzerdefinierter JSON-Ausgabepfad für Label-Dateien. Unterstützt die gleichen Platzhalter wie `pathTemplate`.
- `docsOutput.localePathLowercase`
Wenn `true`, verwenden integrierte Ausgabelayouts (`nested`, `flat`, `doc-system` ohne `pathTemplate`) kleingeschriebene Gebietsschema-Segmente in Pfaden. Standard `false`; `astro-starlight` und `doc-system` mit leerem `localeSubpath` standardmäßig auf `true` beim Laden der Konfiguration.
- `docsOutput.flatPreserveRelativeDir`
Wenn `docsOutput.style = "flat"`, Quellunterverzeichnisse beibehalten, damit Dateien mit demselben Basisnamen nicht kollidieren. Standard `false`.
- `docsOutput.rewriteRelativeLinks`
Relative Links nach der Übersetzung neu schreiben (automatisch aktiviert, wenn `docsOutput.style = "flat"` und kein benutzerdefiniertes `pathTemplate`).
- `docsOutput.linkRewriteDocsRoot`
Das Repository-Root-Verzeichnis, das beim Berechnen von Präfixen für Flat-Link-Umschreibungen verwendet wird. Dies sollte normalerweise als `"."` belassen werden, es sei denn, Ihre übersetzten Dokumente befinden sich unter einem anderen Projekt-Root-Verzeichnis.
- `docsOutput.rewriteVitepressLinks`
Wenn `true`, den VitePress-Link-Normalisierer nach der Übersetzung ausführen. Standardmäßig aktiviert, wenn `docsOutput.style` auf `"vitepress"` gesetzt ist. Verwenden Sie dies mit jedem `doc-system`-Layout, bei dem sich die Gebietsschema-Ordner neben Englisch unter `docsRoot` befinden. Schreibt README-ähnliche `docs/guide/…`-Pfade in Site-Routen (`/guide/…`) und gebietsschema-relative `../guide/…`-Links um. Für Links zu Repository-Dateien außerhalb des VitePress-Baums (`LICENSE`, `examples/`) verwenden Sie vollständige URLs in der englischen Quelle – siehe [VitePress-Integration – README als Dokumentations-Homepage](/de/guide/integrations/vitepress#readme-as-homepage).
- `docsOutput.rewriteNextraLinks`
Wenn `true`, den Nextra-Link-Normalisierer nach der Übersetzung ausführen. Standardmäßig aktiviert, wenn `docsOutput.style` auf `"nextra"` gesetzt ist. Schreibt `content/en/…` und relative `.mdx`-Pfade in gebietsschema-neutrale Site-Routen (`/guide/…`) für Next.js `i18n` um. Siehe [Nextra-Integration – Link-Konventionen](/de/guide/integrations/nextra#link-conventions).
- `docsOutput.fumadocsParser`
`"dot"` (Standard) oder `"dir"`. Dot schreibt `stem.{locale}.mdx` neben englische Quellen; dir schreibt Gebietsschema-Ordner wie Nextra. Siehe [Fumadocs-Integration – Seitenlayout](/de/guide/integrations/fumadocs#page-layout).
- `docsOutput.rewriteFumadocsLinks`
Wenn `true`, den Fumadocs-Link-Normalisierer nach der Übersetzung ausführen. Standardmäßig aktiviert, wenn `docsOutput.style` auf `"fumadocs"` gesetzt ist. Schreibt Inhaltspfade und relative `.mdx`-Links in `/docs/…`-Routen um.
- `docsOutput.fumadocsUiCatalog`
Optional. Fumadocs UI-Überschreibungskatalog-Bootstrap + Übersetzung innerhalb von `translate-docs`. Felder: `sourcePath` (z. B. `lib/layout.shared.ts`), `catalogPath` (generiertes englisches JSON), optional `outputPathTemplate` (Standard: `ui.{locale}.json` neben `catalogPath`).
- `docs[].fumadocsMetaGlob`
Optionale Globs für die `meta.json`-Sammlung, wenn `docsOutput.style` auf `"fumadocs"` gesetzt ist. Standard: rekursives `meta.json` unter `docsOutput.docsRoot`.
- `docs[].fumadocsMetaTranslatableKeys`
Eigenschaftsnamen, deren String-Werte in Fumadocs `meta.json` übersetzt werden (Standard: `title`, `description`).
- `docsOutput.vitepressThemeCatalog`
Optional. VitePress Theme/Nav/Sidebar Katalog-Bootstrap + Übersetzung innerhalb von `translate-docs`. Felder: `configPath` (VitePress-Konfiguration mit Theme-Strings), `catalogPath` (generiertes englisches verschachteltes JSON), optional `outputPathTemplate` (Standard: `theme.{locale}.json` neben `catalogPath`).

**Nachbearbeitung**

- `docsOutput.postProcessing`
Optionale Transformationen am übersetzten **Markdown-Textkörper** (YAML-Schlüssel und nicht-prosaartige Frontmatter-Werte bleiben erhalten). Wird nach der Segmentwiederherstellung und Link-Umschreibung (flat oder VitePress) und vor `addFrontmatter` ausgeführt.
- `docsOutput.postProcessing.regexAdjustments`
Geordnete Liste von `{ "description"?, "search", "replace" }`. `search` ist ein Regex-Muster (einfache Zeichenfolge verwendet Flag `g` oder `/pattern/flags`). `replace` unterstützt Platzhalter wie `${translatedLocale}`, `${sourceLocale}`, `${sourceFullPath}`, `${translatedFullPath}`, `${sourceFilename}`, `${translatedFilename}`, `${sourceBasedir}`, `${translatedBasedir}`.
<a id="language-switcher-languagelistblock"></a>
- `docsOutput.postProcessing.languageListBlock`
`{ "start", "end", "separator", "label"? }` – generiert eine begrenzte „in anderen Sprachen lesen“-Linkzeile in Quell- und übersetztem Markdown neu. Erfordert `languagesManifestPath` (oder ein Manifest unter `ui.flatOutputDir/ui-languages.json`) für Endonym-Bezeichnungen, wenn `label: "local"`.

**Verhalten und Metadaten**

- `translateFrontmatterFields`
Auf derselben Ebene wie `docsOutput` (pro `docs[]`-Block). Standard `true`: Übersetzt benutzerseitige YAML-Prosa für Starlight/Docusaurus (`title`, `description`, `sidebar.label`, `sidebar_label`, `keywords`, `hero.title`, `hero.tagline`, `hero.image.alt`, `hero.actions[].text`, `pagination_label`, `prev`/`next`-Bezeichnungen). Setzen Sie `false`, um den gesamten Frontmatter-Block unverändert zu lassen; übergeben Sie ein String-Array, um auf bestimmte Dot-Pfade zu beschränken.
- `segmentSplitting`
Auf derselben Ebene wie `docsOutput` (pro `docs[]`-Block). Optionale feiner granulierte Segmente für die `translate-docs`-Extraktion: `{ "enabled", "maxCharsPerSegment"?, "splitPipeTables"?, "splitDenseParagraphs"?, "maxLinesPerParagraphChunk"?, "splitLongLists"?, "maxListItemsPerChunk"?, "qualityRetrySplit"?, "maxQualityRetrySplitDepth"? }`. Wenn `enabled` `true` ist (Standard, wenn `segmentSplitting` weggelassen wird), werden dichte Absätze, GFM-Pipe-Tabellen (der erste Block enthält Kopfzeile, Trennzeichen und erste Datenzeile) und lange Listen geteilt; Unterteile werden mit einzelnen Zeilenumbrüchen wieder zusammengeführt (`tightJoinPrevious`). Setzen Sie `"enabled": false`, um nur ein Segment pro durch Leerzeilen getrennten Textblock zu verwenden. Wenn `qualityRetrySplit` `true` ist (Standard), werden Markdown-Segmente, die nach Ausschöpfung aller Modelle die AST-Validierung nicht bestehen, schrittweise geteilt und ab dem ersten Modell erneut versucht; `maxQualityRetrySplitDepth` (Standard `3`) begrenzt rekursive Teilungen.
- `warnMarkdownSourceIssues`
Wenn `true` (Standard, wenn weggelassen), scannt jeder `translate-docs`-Lauf Markdown-Segmente erneut auf riskante Trennzeichen / nicht geschlossenen Inline-Code, gibt Terminalwarnungen aus und ersetzt `markdown_source_issues`-Zeilen für den Cache-Dateipfad dieser Datei. Setzen Sie `false`, um Warnungen und SQLite-Updates für diesen Block zu überspringen.
- `addFrontmatter`
Wenn `true` (Standard, wenn weggelassen), enthalten übersetzte Markdown-Dateien YAML-Schlüssel: `translation_last_updated`, `source_file_mtime`, `source_file_hash`, `translation_language`, `source_file_path`, und wenn mindestens ein Segment Modellmetadaten enthält, `translation_models` (sortierte Liste der Modell-IDs des aktiven Anbieters). Auf `false` setzen, um dies zu überspringen.
- `emphasisPlaceholders`
Pro `docs[]`-Block. Wenn `true`, werden Markdown-Hervorhebungsbegrenzer vor der Übersetzung als Platzhalter maskiert. Standardmäßig `true` für CJK-Gebietsschemas (`zh`, `ja`, `ko`) und für in `rtlLocales` aufgeführte Gebietsschemas; ansonsten standardmäßig `false`. Überschreibbar über CLI `--emphasis-placeholders` / `--no-emphasis-placeholders`.
- `rtlLocales`
Optionales Array von BCP-47-Codes, die für Hervorhebungs-Platzhalter-Standardwerte als RTL behandelt werden (zusammengeführt mit integrierter RTL-Erkennung).

<a id="protectattributes-protectkeys"></a>
- `protectAttributes`
Optional. Zusätzliche JSX/HTML-Attributnamen, deren **in Anführungszeichen stehende Zeichenkettenwerte** nicht an den Übersetzer gesendet werden dürfen. Wird mit integrierten Standardwerten zusammengeführt (`class`, `id`, `style`, `src`, `href`, `type`, `data-*`, die meisten `aria-*` usw.). Groß-/Kleinschreibung wird ignoriert. Gilt für:

- `.astro`-Analyse-und-Ersetzungs-Extraktion (statische HTML-Tags und String-Literale nach `attr=` innerhalb von `{expression}`-Blöcken).
  - MDX-Platzhalter-Extraktion während der Übersetzung von Markdown/Astro-Abschnitten (`label`, `tooltip` und `aria-label` bei großgeschriebenen JSX-Tags sowie `TabItem` `value`, falls zutreffend).

Beispiel: `"protectAttributes": ["variant", "size"]` behält `variant="primary"` innerhalb von `{items.map(...)}` unverändert über alle Sprachen hinweg.

Sie können auch normalerweise übersetzbare Attribute (z. B. `"title"` oder `"aria-label"`) auflisten, wenn deren Werte wortwörtlich aus dem Englischen übernommen werden sollen.

- `protectKeys`
Optional. Zusätzliche **Namen von Objekteigenschaften**, deren in Anführungszeichen stehende String-Werte innerhalb von `{expression}`-Template-Blöcken und MDX-Objektliteralen nicht übersetzt werden dürfen (z. B. `label:` innerhalb von `<Tabs values={[ … ]}>`). Wird mit integrierten Standardwerten zusammengeführt (`class`, `key`, `id`, `href`, `src` usw.). Groß-/Kleinschreibung wird ignoriert.

Beispiel: `"protectKeys": ["slug", "code"]` überspringt `{ slug: 'getting-started', title: 'Getting started' }` → nur `title` wird übersetzt, wenn `slug` geschützt ist.

<br/>

**Beispiel (`docsOutput.style = "flat"` — Screenshot-Pfade + optionaler Sprachlisten-Wrapper):**

<details>
<summary>Beispiel für die Nachbearbeitung im flachen Layout (Screenshots + languageListBlock)</summary>

```json
"docsOutput": {
  "style": "flat",
  "postProcessing": {
    "regexAdjustments": [
      {
        "description": "Per-locale screenshot folders",
        "search": "images/screenshots/[^/]+/",
        "replace": "images/screenshots/${translatedLocale}/"
      }
    ],
    "languageListBlock": {
      "start": "<small id=\"lang-list\">",
      "end": "</small>",
      "separator": " · ",
      "label": "local"
    }
  }
}
```

</details>

<a id="json"></a>
### `json`

Top-Level-Array von verschachtelten JSON-Übersetzungspipelines. Wird nur verwendet, wenn `features.translateJson` wahr ist (`translate-json` oder die JSON-Phase von `sync`). Siehe [JSON](/de/guide/json).

| Feld | Beschreibung |
|-------|-------------|
| `description` | Optionale Anmerkung für CLI / `status` (wird nicht übersetzt). |
| `contentPaths` | Quell-`.json`-Dateien, Verzeichnisse oder Muster unterhalb des Projekt-Stammverzeichnisses. |
| `outputPathTemplate` | Erforderlicher Ausgabepfad pro Zielsprache. Platzhalter: `{locale}`, `{LOCALE}`, `{llocale}`, `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`. |
| `targetLocales` | Optionaler Teilbereich für diesen Block; andernfalls Stamm-`targetLocales`. |
| `keyPolicy.mode` | `allowlist`, `denylist` oder `both`. |
| `keyPolicy.translateKeys` | Punkt-Pfade / Muster, die eingeschlossen werden sollen, wenn der Modus `allowlist` oder `both` ist. |
| `keyPolicy.skipKeys` | Punkt-Pfade / Muster, die ausgeschlossen werden sollen (Standard-Verweigerungsliste enthält `id`, `slug`, `href`, `url`, `key`, `code`). |

<a id="svg"></a>
### `svg`

Pfade und Layout auf oberster Ebene für SVG-Dateien. Die Übersetzung wird nur ausgeführt, wenn `features.translateSVG` wahr ist (über `translate-svg` oder die SVG-Phase von `sync`).

| Feld            | Beschreibung                                                                                                                                                                                                                                                        |
|------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sourcePath`     | Ein oder mehrere Verzeichnisse **oder Glob-Muster** (z. B. `"images/*.svg"`, `"**/icons/*.svg"`). Die Muster werden relativ zum Projektstamm aufgelöst und rekursiv nach `.svg`-Dateien durchsucht.                                                                         |
| `outputDir`                   | Stammverzeichnis für die übersetzte SVG-Ausgabe.                                                                                                                                                                                                                                          |
| `style`                       | `"flat"` oder `"nested"`, wenn `pathTemplate` nicht gesetzt ist.                                                                                                                                                                                                                               |
| `pathTemplate`   | Benutzerdefinierter SVG-Ausgabepfad. Platzhalter: <code>"{outputDir}"</code>, <code>"{locale}"</code>, <code>"{LOCALE}"</code>, <code>"{llocale}"</code>, <code>"{relPath}"</code>, <code>"{stem}"</code>, <code>"{basename}"</code>, <code>"{extension}"</code>, <code>"{relativeToSourceRoot}"</code>. |
| `localePathLowercase` | Wenn `true`, verwenden integrierte `flat` / `nested` SVG-Layouts kleingeschriebene Gebietsschema-Abschnitte. Benutzerdefinierte `pathTemplate`-Werte bleiben unverändert; verwenden Sie `{llocale}` für klein geschriebene Abschnitte. |
| `forceLowercase` | Kleinschreibung bei der Übersetzung beim erneuten Zusammensetzen des SVG. Nützlich für Designs, die auf vollständig kleingeschriebenen Beschriftungen basieren.                                                                                                                                                                                |

<a id="glossary"></a>
### `glossary`

| Feld          | Beschreibung                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `uiGlossary`   | Pfad zu `strings.json` – erstellt automatisch ein Glossar aus vorhandenen Übersetzungen.                                                                                                 |
| `userGlossary` | Pfad zu einer CSV-Datei mit den Spalten `Original language string` (oder `en`), `locale`, `Translation` – eine Zeile pro Quellbegriff und Zielsprache (`locale` kann `*` für alle Ziele sein). |
| `autoAddUserEditedToGlossary` | Wenn `true`, können Dashboard-Bearbeitungen von UI-Strings automatisch dem Benutzerglossar hinzugefügt werden. |

**Ein leeres Glossar im CSV-Format generieren:**

```bash
npx ai-i18n-tools glossary-generate
```
