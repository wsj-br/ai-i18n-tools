<a id="astro-integration"></a>
# Astro-Integration

Verwenden Sie ai-i18n-tools mit [Astro](https://astro.build/) in zwei gängigen Setups: **Astro Starlight** Dokumentationsseiten und **reinen Astro** Marketing- oder App-Seiten. Beide verwenden Dokumente (`translate-docs`) für den Seiteninhalt; reine Astro-Seiten kombinieren dies oft mit UI-Strings (`extract` / `translate-ui`) für `t()`-Strings in Frontmatter und gemeinsamen Daten.

Siehe auch [UI-Strings](/de/guide/ui-strings/astro-website), [Dokumente](/de/guide/documents/) und die unten stehenden ausführbaren Beispiele.

<a id="astro-starlight"></a>
## Astro Starlight

Verwenden Sie `init -t ui-starlight` und `docsOutput.style: "astro-starlight"` für [Astro Starlight](https://starlight.astro.build/)-Dokumentationsseiten. Das Preset ist ein Alias für `doc-system` mit einem leeren `localeSubpath` – übersetzte Seiten landen unter `src/content/docs/<locale>/` neben dem Quell-Locale-Baum. `sourceLocale` kann jede Sprache sein.

<a id="quick-start"></a>
### Schnellstart

```bash
ai-i18n-tools init -t ui-starlight -P cheaperinference
# edit ai-i18n-tools.config.json (targetLocales, providers, contentPaths)
pnpm run i18n:sync   # or: ai-i18n-tools sync
pnpm dev             # Starlight dev server (project-specific script)
```

<a id="page-layout"></a>
### Seitenlayout

Englische Markdown- und MDX-Dateien befinden sich im Starlight-Inhaltsstamm (typischerweise `src/content/docs/`). Übersetzte Kopien werden neben dem Quellbaum geschrieben:

```text
src/content/docs/quick-start.md     →  src/content/docs/de/quick-start.md
src/content/docs/guide/setup.mdx    →  src/content/docs/fr/guide/setup.mdx
```

Konfigurieren Sie einen `docs[]`-Block:

```json
{
  "contentPaths": ["src/content/docs/"],
  "outputDir": "src/content/docs",
  "docsOutput": {
    "style": "astro-starlight",
    "docsRoot": "src/content/docs"
  }
}
```

Richten Sie `contentPaths` auf die in `sourceLocale` geschriebenen `.md`- / `.mdx`-Dateien und -Verzeichnisse. Diese Sprache kann jede beliebige Sprache sein. Setzen Sie `docsRoot` auf denselben Ordner, den Starlight als seinen Inhalts-Root verwendet.

Starlight UI-Overrides können bei Bedarf `src/content/i18n/en.json` mit `jsonPathTemplate` in einem separaten `docs[]`-Block verwenden – siehe [Dokumente – Initialisierung für die Dokumentation](/de/guide/documents/#step-1-initialise-for-documentation).

Starlight liefert integrierte UI-Strings für viele Sprachen (Navigationsbeschriftungen, Such-Platzhalter, Inhaltsverzeichnis usw.). Es gibt keine separate Shell-/Theme-Pipeline zum Konfigurieren – verwenden Sie `translate-docs` nur für Seiteninhalte. Für andere Frameworks siehe [Framework-Shell-Übersetzung](/de/guide/integrations/#framework-shell-translation).

Explizite Sidebar-`label`s, die Site-`title` und `social[].label` in `astro.config.mjs` sind englische Literale, die dieses Tool nicht übersetzt. Bevorzugen Sie `slug`-Einträge, damit das Label aus dem übersetzten Frontmatter der Seite stammt (`title`). Eine Gruppe oder ein externer Link, der eine eigene Formulierung benötigt, verwendet Starlights pro-Locale-`translations`-Map (`label` für das Standard-Locale, `translations['pt-BR']` für die anderen). `social[].label` hat kein Übersetzungsfeld im aktuellen Starlight-Schema; es bleibt wie geschrieben. Siehe [Starlight-Sidebar](https://starlight.astro.build/guides/sidebar/#internationalization) und [examples/astro-docs/astro.config.mjs](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/astro-docs/astro.config.mjs), das `slug`-Einträge verwendet.

<a id="enable-i18n-in-an-existing-site"></a>
### i18n auf einer bestehenden Site aktivieren

- `locales` in der Starlight-Konfiguration, einschließlich eines `root`-Eintrags, wenn Englisch ohne Präfix sein soll (`label` und erforderliches `lang`).
- `defaultLocale: 'root'`, wenn die Standardsprache dieses Root-Locale ist. Lassen Sie `defaultLocale` nur weg, wenn Starlights Standard bereits übereinstimmt.
- Englische Seiten bleiben in `src/content/docs/`; `translate-docs` schreibt `src/content/docs/<locale>/`.
- `targetLocales` ausgerichtet an den Nicht-Root-Locale-Schlüsseln (achten Sie auf die Groß-/Kleinschreibung: Starlight-Verzeichnisschlüssel sind oft klein geschrieben, wie z.B. `pt-br`).

<a id="example-project"></a>
### Beispielprojekt

[examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) – englische Quellen unter `src/content/docs/`, übertragene Übersetzungen unter `src/content/docs/<locale>/`, RTL-Gebietsschema (`ar`) und Glossar-gesteuerte Übersetzung. Führen Sie `pnpm dev` auf Port 3050 aus.

<a id="plain-astro-marketing-and-app-sites"></a>
## Reines Astro (Marketing- und App-Seiten)

Für statische Astro-Marketing- oder App-Seiten (nicht Starlight) kombinieren Sie [Astro integriertes i18n-Routing](https://docs.astro.build/en/guides/internationalization/) mit ai-i18n-tools. Die Referenzimplementierung ist [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website): Englisch unter `/`, Zielsprachen unter `/{locale}/`.

Die meisten Teams verwenden eine **Hybridlösung** aus zwei Pipelines auf derselben Seite:

| Pipeline | Verwendung für | Befehle | Ausgabe |
|----------|---------|----------|--------|
| **Seiten-HTML** | Überschriften, Absätze, Navigationsbezeichnungen, inline-Arrays im Vorlagen-Body | `translate-docs` | `src/pages/{locale}/index.astro` pro Sprache |
| **UI-Strings (`t()`)** | Frontmatter-Daten, Tab-Labels, gemeinsame Arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (Quellsprachen-String als Schlüssel) |

<a id="quick-start-1"></a>
### Schnellstart

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
# enable features.translateDocs and add a docs[] block for page HTML (see below)
pnpm run i18n:sync
pnpm dev
```

Erstellen Sie ein Gerüst für die UI-Extraktion mit `init -t ui-astro-website -P ollama` und führen Sie dann einen `docs[]`-Block zusammen, wenn Sie auch Seiten-HTML übersetzen:

```json
{
  "features": {
    "translateUIStrings": true,
    "translateDocs": true
  },
  "ui": {
    "sourceRoots": ["src/"],
    "stringsJson": "public/locales/strings.json",
    "flatOutputDir": "public/locales/"
  },
  "docs": [{
    "contentPaths": ["src/pages/index.astro"],
    "outputDir": "src/pages",
    "docsOutput": {
      "style": "astro-starlight",
      "docsRoot": "src/pages"
    },
    "addFrontmatter": false
  }]
}
```

Halten Sie drei Listen synchron, wenn Sie eine Sprache hinzufügen oder entfernen: `targetLocales` in `ai-i18n-tools.config.json`, `i18n.locales` in `astro.config.mjs` (Astro verwendet **Kleinbuchstaben** für Routencodes wie `pt-br`) und `ui-languages.json` (über `generate-ui-languages`). Flat-Bundle-**Dateinamen** verwenden die Konfigurationsschreibweise (`pt-BR.json`); ordnen Sie die Astro-Route `pt-br` dieser Datei über Ihr Manifest-Feld `code` zu.

Lösen Sie `t('…')` zur **Build-Zeit**, indem Sie das Quellsprachen-Literal als Schlüssel nachschlagen — siehe `examples/astro-website/src/i18n/t.ts`. `sourceLocale` kann jede Sprache sein. Das Beispiel verwendet Englisch. Sie benötigen `ai-i18n-tools/runtime` oder i18next nicht für eine statische Site, es sei denn, Sie fügen Client-Islands hinzu, die die Sprache nach dem Laden wechseln.

<a id="example-project-1"></a>
### Beispielprojekt

[examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) – hybride Landingpage mit HTML über `translate-docs` und Screenshot-Tab-Labels über `t()` + `translate-ui`.

<a id="example-projects"></a>
## Beispielprojekte

| Projekt | Anwendungsfall | Port |
|---------|----------|------|
| [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) | Starlight-Dokumentation | 3050 |
| [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) | Einfache Astro-Marketing-Website (HTML + `t()` hybrid) | (siehe README) |

Vergleichen Sie [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) mit [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) – ähnlicher Tutorial-Inhalt, Docusaurus-Ausgabestil anstelle von Starlight.
