<a id="vitepress-integration"></a>
# VitePress-Integration

Verwenden Sie `init -t ui-vitepress` und `docsOutput.style: "vitepress"` für [VitePress](https://vitepress.dev/)-Dokumentationsseiten. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` und beibehaltenen BCP-47-Gebietsschema-Ordnernamen (`localePathLowercase` ist standardmäßig `false`, sodass Ordner `pt-BR`, `zh-Hans` usw. bleiben).

Siehe auch [Dokumente](/guide/documents/), [JSON](/guide/json) (Theme-Strings) und die ausführbare Demo [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/). Die eigene Dokumentationsseite dieses Repositorys unter `docs/` ist eine vollständige VitePress + ai-i18n-tools-Referenz (neun Sprachen, Theme-JSON, GitHub Pages).

<a id="quick-start"></a>
## Schnellstart

```bash
npx ai-i18n-tools init -t ui-vitepress
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm run docs:build  # VitePress build (project-specific script)
```

Aktivieren Sie sowohl `features.translateDocs` als auch `features.translateJson`, wenn Sie Seiteninhalte und VitePress-Chrome-Strings in einem `sync`-Lauf übersetzen.

<a id="page-layout"></a>
## Seitenlayout

Englischer Markdown befindet sich im VitePress-Inhaltsstamm (typischerweise `docs/`). Übersetzte Kopien werden neben dem Quellbaum geschrieben:

```text
docs/index.md           →  docs/de/index.md
docs/guide/quick-start.md  →  docs/de/guide/quick-start.md
```

Konfigurieren Sie einen `docs[]`-Block:

```json
{
  "contentPaths": ["docs/index.md", "docs/guide"],
  "outputDir": "docs",
  "docsOutput": {
    "style": "vitepress",
    "docsRoot": "docs",
    "rewriteVitepressLinks": true
  }
}
```

Verweisen Sie `contentPaths` auf Ihre englischen `.md`-Dateien und -Verzeichnisse. Setzen Sie `docsRoot` auf denselben Ordner, den VitePress als seinen Inhaltsstamm verwendet.

Verbinden Sie die [Internationalisierung](https://vitepress.dev/guide/i18n) von VitePress: Englisch unter `root`, jedes Ziel-Gebietsschema unter `locales[code].link` (zum Beispiel `/pt-BR/`). Halten Sie `targetLocales` in `ai-i18n-tools.config.json` mit den `locales`-Schlüsseln in `.vitepress/config.mts` synchronisiert.

<a id="theme-strings"></a>
## Themenzeichenfolgen

VitePress-Navigationsleiste, Sidebar, Fußzeile, Suchplatzhalter und andere `themeConfig`-Beschriftungen werden nicht aus Markdown extrahiert. Erstellen Sie einen verschachtelten JSON-Katalog (z. B. `docs/.vitepress/i18n/theme.en.json`) und übersetzen Sie ihn mit JSON:

```json
{
  "features": {
    "translateJson": true
  },
  "json": [
    {
      "description": "VitePress theme/nav/sidebar strings",
      "contentPaths": "docs/.vitepress/i18n/theme.en.json",
      "outputPathTemplate": "docs/.vitepress/i18n/theme.{locale}.json"
    }
  ]
}
```

Laden Sie die pro-Gebietsschema-Datei in `.vitepress/config.mts` und erstellen Sie `locales[code].themeConfig` aus dem übersetzten JSON (Navigations-Text, Seitenleisten-Gruppentitel, Fußzeilen-Nachricht usw.). Kodieren Sie übersetzte Beschriftungen nicht fest in `config.mts` – generieren Sie sie mit `sync` / `translate-json` neu, wenn sich das Englische ändert.

Dieses Paket lädt `theme.{locale}.json` in [docs/.vitepress/config.mts](https://github.com/wsj-br/ai-i18n-tools/blob/main/docs/.vitepress/config.mts); vergleichen Sie dies mit [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) für eine minimale Einrichtung mit zwei Sprachen.

<a id="docusaurus-vs-vitepress-shell-json"></a>
## Docusaurus vs. VitePress Shell-JSON

| Framework | Shell / Theme-Strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`-Katalog (`{ message, description }`) | Dokumente — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Benutzerdefinierter verschachtelter JSON-Katalog, den Sie erstellen | JSON — `json[]` + `translate-json` (oder `sync`, wenn `translateJson` aktiviert ist) |

Legen Sie VitePress-Theme-JSON nicht in `docs[]` ab; verwenden Sie stattdessen `json[]`.

<a id="example-project"></a>
## Beispielprojekt

[examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs/) – englische Quellen unter `docs/`, festgeschriebene Seitenbäume `pt-BR` und `zh-Hans`, plus `theme.pt-BR.json` / `theme.zh-Hans.json`. Führen Sie `pnpm run docs:dev` auf Port 3060 aus.

<a id="readme-as-homepage"></a>
## README als Dokumentations-Homepage

Einige Projekte kopieren `README.md` in die VitePress-Site als `docs/index.md` (dieses Repo verwendet `scripts/sync-readme-to-docs.mjs` vor `docs:build`). Dieses Muster teilt eine Datei zwischen GitHub und der Dokumentations-Site, aber die Link-Regeln unterscheiden sich:

| Link-Typ | Funktioniert auf GitHub | Funktioniert auf VitePress |
|-----------|-----------------|-------------------|
| `docs/guide/foo.md` | Ja | Nein – verwenden Sie Site-Routen oder lassen Sie den Normalisierer während der Synchronisierung umschreiben |
| `./LICENSE`, `examples/demo/` | Ja (Repo-relativ) | Nein – verwenden Sie **vollständige URLs** |
| `/guide/foo` | Nein | Ja |

**Empfehlung:** Verwenden Sie in `README.md` **vollständige URLs** für alles außerhalb des VitePress-Inhaltsbaums (`LICENSE`, `examples/`, Konfigurationsdateien, Agent-Kontextdateien) und für übersetzte README-Kopien unter `translated-docs/`. Verwenden Sie `docs/guide/…`-Pfade (oder Site-Routen in englischen Dokumenten unter `docs/`) für interne Dokumentationslinks; das Synchronisierungsskript und der `rewriteVitepressLinks`-Normalisierer konvertieren diese in `/guide/…`-Routen.

Beispiel:

```markdown
[console-app demo](https://github.com/your-org/your-repo/tree/main/examples/console-app/)
[License](https://github.com/your-org/your-repo/blob/main/LICENSE)
[Quick start](/guide/quick-start)
```

<a id="link-conventions"></a>
## Link-Konventionen

VitePress stellt englische Seiten aus dem Inhaltsstamm und Lokalisierungskopien aus `docs/<locale>/…` bereit, aber **Seiteninterne Links müssen Site-Routen verwenden** (`/guide/quick-start`, `/reference/configuration`) – nicht repo-relative Pfade wie `docs/guide/quick-start.md` oder `../guide/quick-start.md`. Diese README-ähnlichen Pfade funktionieren in GitHub, brechen aber innerhalb von VitePress (404 im Dev-Modus und auf GitHub Pages).

Aktivieren Sie den integrierten Normalisierer, damit `translate-docs` Links in jeder übersetzten Datei automatisch korrigiert:

```json
"docsOutput": {
  "style": "vitepress",
  "docsRoot": "docs",
  "rewriteVitepressLinks": true
}
```

`rewriteVitepressLinks` ist standardmäßig aktiviert, wenn `style` `"vitepress"` ist.

| Autor in englischer Quelle | Nach dem Normalisierer |
|--------------------------|------------------|
| `[JSON](/guide/json)` | `[JSON](/guide/json)` |
| `[Home](./README.md)` im Lokalisierungsindex | `/` |
| `[Demo](https://github.com/org/repo/tree/main/examples/console-app/)` | unverändert (vollständige URL) |

**Regeln für die Erstellung**

- Dokumentenlinks über mehrere Seiten hinweg: Verwenden Sie **Site-Routen** (`/guide/…`, `/reference/…`) in englischem Markdown unter `docs/` oder `docs/guide/…`-Pfade beim Synchronisieren von `README.md`.
- Ausführbare Demos, `LICENSE` und andere Repo-Dateien: Verwenden Sie **vollständige GitHub-URLs** in `README.md` und in den Dokumenten (siehe [README als Dokumentations-Homepage](#readme-as-homepage)).
- Bearbeiten Sie Links in `docs/<locale>/` **nicht** manuell – generieren Sie sie mit `sync` / `translate-docs` neu.

Siehe auch [Link-Umschreibung](/guide/images-and-screenshots/link-rewriting) (flat vs. VitePress) und [Konfiguration — `docsOutput`](/reference/configuration#docsoutput).
