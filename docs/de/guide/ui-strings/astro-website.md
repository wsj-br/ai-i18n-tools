<a id="astro-website"></a>
# Astro-Website

Für statische Astro-Marketing- oder App-Sites (reines Astro, nicht Starlight) kombinieren Sie [Astro-integriertes i18n-Routing](https://docs.astro.build/en/guides/internationalization/) mit ai-i18n-tools. Siehe auch [Astro-Integration](/de/guide/integrations/astro).

Die Referenzimplementierung ist [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (siehe auch die [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)): Englisch unter `/`, neun Zielsprachen unter `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Hybride Pipelines

Die meisten Teams verwenden eine **hybride** Kombination aus beiden Pipelines (diese schließen sich nicht gegenseitig aus):

| Pipeline | Verwendung für | Befehle | Ausgabe |
|----------|---------|----------|--------|
| **Seiten-HTML** | Überschriften, Absätze, Navigationsbezeichnungen, inline-Arrays im Vorlagen-Body | `translate-docs` | `src/pages/{locale}/index.astro` pro Sprache |
| **UI-Strings (`t()`)** | Frontmatter-Daten, Screenshot-Tab-Beschriftungen, geteilte Arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (Quellsprachen-String als Schlüssel) |

Halten Sie drei Listen synchron, wenn Sie eine Sprache hinzufügen oder entfernen: `targetLocales` in `ai-i18n-tools.config.json`, `i18n.locales` in `astro.config.mjs` (Astro verwendet **Kleinbuchstaben** für Routencodes wie `pt-br`) und `ui-languages.json` (über `generate-ui-languages`). Flache Bundle-**Dateinamen** verwenden die Konfigurationsschreibweise (`pt-BR.json`); ordnen Sie die Astro-Route `pt-br` dieser Datei über Ihr Manifestfeld `code` zu (siehe `examples/astro-website/src/i18n/locale.ts`).

Beispiel-`package.json`-Skripte (aus dem Referenzprojekt):

```json
{
  "i18n:extract": "ai-i18n-tools extract",
  "i18n:translate-ui": "ai-i18n-tools translate-ui",
  "i18n:translate": "ai-i18n-tools translate-docs",
  "i18n:locales": "ai-i18n-tools generate-ui-languages",
  "i18n:sync": "ai-i18n-tools sync"
}
```

<a id="ui-strings-ssg"></a>
## UI-Strings (SSG)

Richten Sie die UI-Extraktion mit `init -t ui-astro-website -P ollama` ein und führen Sie dann einen `docs[]`-Block zusammen, wenn Sie auch Seiten-HTML übersetzen (siehe [Seiten parsen und ersetzen](#pages-parse-and-replace)). Übersetzen Sie auch die Repository-README: `init -t ui-astro-website -P ollama --with-readme`. Siehe [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme). Umschließen Sie Text in `t('…')` in TypeScript-Modulen und `.astro`-Frontmatter (und Vorlagen-`{expression}`-Blöcken, wenn Sie UI-Strings gegenüber duplizierten Lokalisierungsseiten bevorzugen). Seiten-HTML benötigt kein `t()`: `translate-docs` kopiert es. Die [JS/TS-Eingabeaufforderung](/de/guide/add-i18n-to-js#run-the-agent-prompt) gilt für diese Frontmatter- und Datendateien, mit Ausnahme der i18next-Installation und des Bootstraps – Astro löst `t` zur Build-Zeit mit `makeT` auf, nicht mit i18next.

```bash
ai-i18n-tools init -t ui-astro-website -P ollama
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

Stellen Sie `sourceLocale` so ein, dass es `i18n.defaultLocale` in `astro.config.mjs` entspricht. Schreiben Sie Flat-Bundles in ein Verzeichnis, das Astro zur Build-Zeit importieren kann (die Vorlage verwendet `public/locales/`). Lösen Sie `t('…')` zur **Build-Zeit** auf, indem Sie das Quellsprachen-Literal als Schlüssel nachschlagen (siehe `examples/astro-website/src/i18n/t.ts`; `strings.json` ist der Extraktions-Cache, nicht das Laufzeit-Bundle). Diese Sprache ist `sourceLocale` und kann jede beliebige Sprache sein. Das Beispiel verwendet Englisch. Sie benötigen **kein** `ai-i18n-tools/runtime` oder i18next für eine statische Website, es sei denn, Sie fügen Client-Islands hinzu, die die Sprache nach dem Laden wechseln.

Verbinden Sie jede Seite, die `t()` aufruft (die Quell-Lokalisierungsseite und jede `src/pages/{locale}/`-Kopie):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Unterstützende Helfer im Beispiel: `src/i18n/utils.ts`, `src/i18n/locale.ts` und `ui-languages.json` für Beschriftungen, Richtung und BCP-47-Codes. Führen Sie `generate-ui-languages` aus, nachdem Sie `targetLocales` geändert haben (setzen Sie optional `languagesManifestPath`, damit das Manifest neben Ihren Helfern liegt, z. B. `src/i18n/ui-languages.json`). `MainLayout.astro` setzt `<html lang>` und `<html dir>` von `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` verwendet `getRelativeLocaleUrl` von `astro:i18n`.

<a id="pages-parse-and-replace"></a>
## Seiten (parse-and-replace)

Für Marketingseiten mit hartcodiertem HTML in `.astro`-Dateien lässt `translate-docs` Textknoten und Attribute (`alt`, `title`, `aria-label`, `placeholder`) extrahieren, diese mit dem Dokument-Cache übersetzen und sprachspezifische Kopien im Seitenverzeichnis ablegen. Für die meisten sichtbaren Texte benötigen Sie **kein** `t()`.

Strukturelle Attribut- und Schlüsselwerte werden standardmäßig **nicht** übersetzt: Der integrierte Schutz deckt JSX/HTML-Attribute wie `class`, `id`, `style`, `src`, `href`, `data-*` und die meisten `aria-*` ab, sowie Objektschlüssel wie `class`, `key` und `id` innerhalb von Vorlagen-`{expression}`-Blöcken. Verwenden Sie `docs[].protectAttributes` und `docs[].protectKeys`, um diese Listen zu erweitern, wenn Sie benutzerdefinierte Attribute verwenden (z. B. Tailwind `variant` oder CMS `slug`-Felder). Dieselben Optionen gelten für MDX JSX während der Markdown-Übersetzung (siehe [protectAttributes / protectKeys](/de/reference/configuration#protectattributes-protectkeys)).

`features.translateDocs` aktivieren und einen `docs[]`-Block hinzufügen, zum Beispiel:

```json
{
  "features": { "translateDocs": true },
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

Führen Sie `ai-i18n-tools translate-docs` aus (oder `pnpm i18n:translate` in [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)). Die Quellseite bleibt bei `src/pages/index.astro` (Englisch im Beispiel; `sourceLocale` kann jede beliebige Sprache sein); jede Ziellokalisierung erhält `src/pages/{locale}/index.astro` mit angepassten Importen für die zusätzliche Verzeichnisebene (zum Beispiel `../layouts/` → `../../layouts/`).

Innerhalb des **Template-Bodys** werden Zeichenfolgenliterale in `{expression}`-Blöcken (Inline-Arrays, Objekt-`title`/`desc`-Felder) übersetzt, wenn sie benutzerseitig sichtbar sind; zitierte Werte auf geschützten Attributen/Schlüsseln, Literale innerhalb von `t('…')`, `<script>` und `<style>` bleiben unverändert. **Frontmatter-TypeScript wird von diesem Pfad nicht übersetzt** – teilen Sie gemeinsame Frontmatter (einschließlich `t()`-Importe und Daten-Arrays) identisch auf der englischen und der lokalen Seite, oder führen Sie `translate-docs` nach der Bearbeitung der englischen Seite erneut aus, damit die lokalen Kopien Frontmatter-Änderungen übernehmen. Verwenden Sie für reine Frontmatter-Kopien stattdessen die [UI-String-Pipeline](#ui-strings-ssg).

Siehe [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) für die vollständige hybride Landingpage (HTML über `translate-docs`, Screenshot-Tab-Beschriftungen über `t()` + `translate-ui`).
