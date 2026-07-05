<a id="astro-website"></a>
# Astro-Website

Für statische Astro-Marketing- oder App-Websites (reines Astro, nicht Starlight) kombinieren Sie [Astro-integriertes i18n-Routing](https://docs.astro.build/en/guides/internationalization/) mit ai-i18n-tools. Siehe auch [Astro-Integration](/guide/astro-integration).

Die Referenzimplementierung ist [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) (siehe auch die [README](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/README.md)): Englisch unter `/`, neun Zielsprachen unter `/{locale}/` (`de`, `fr`, `es`, `ar`, `ja`, `ko`, `zh-cn`, `zh-tw`, `pt-br`).

<a id="hybrid-pipelines"></a>
## Hybride Pipelines

Die meisten Teams verwenden eine **hybride** Kombination aus beiden Pipelines (diese schließen sich nicht gegenseitig aus):

| Pipeline | Verwendung für | Befehle | Ausgabe |
|----------|---------|----------|--------|
| **Seiten-HTML** | Überschriften, Absätze, Navigationsbezeichnungen, inline-Arrays im Vorlagen-Body | `translate-docs` | `src/pages/{locale}/index.astro` pro Sprache |
| **UI-Zeichenketten (`t()`)** | Frontmatter-Daten, Reiterbeschriftungen für Screenshots, gemeinsam genutzte Arrays | `extract` → `translate-ui` | `public/locales/{locale}.json` (Englischer Originaltext als Schlüssel) |

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

Extrahieren Sie UI-Strings mit `init -t ui-astro-website` und fügen Sie dann einen `docs[]`-Block ein, wenn Sie auch Seiten-HTML übersetzen (siehe [Seiten parsen und ersetzen](#astro-website-pages-parse-and-replace)). Umschließen Sie den Text in `t('…')` in TypeScript-Modulen und `.astro`-Frontmatter (und Vorlagen-`{expression}`-Blöcke, wenn Sie UI-Strings gegenüber duplizierten Lokalisierungsseiten bevorzugen):

```bash
npx ai-i18n-tools init -t ui-astro-website
npx ai-i18n-tools extract
npx ai-i18n-tools translate-ui
```

Legen Sie `sourceLocale` so fest, dass es `i18n.defaultLocale` in `astro.config.mjs` entspricht. Schreiben Sie flache Bündel in ein Verzeichnis, das Astro zur Build-Zeit importieren kann (die Vorlage verwendet `public/locales/`). Lösen Sie `t('…')` zur **Build-Zeit** auf, indem Sie den englischen Quelltext als Schlüssel nachschlagen (siehe `examples/astro-website/src/i18n/t.ts`; `strings.json` ist der Extraktions-Cache, nicht das Laufzeit-Bündel). Sie benötigen **kein** `ai-i18n-tools/runtime` oder i18next für eine statische Website, es sei denn, Sie fügen Client-Islands hinzu, die nach dem Laden die Sprache wechseln.

Verbinden Sie jede Seite, die `t()` aufruft (englische Startseite und jede `src/pages/{locale}/`-Kopie):

```astro
import { loadFlatBundle, makeT } from '../i18n/t';        // or ../../i18n/t in locale subfolders
import { resolvePageLocale, useTranslations } from '../i18n/utils';

const locale = resolvePageLocale(Astro.currentLocale);
const flat = await loadFlatBundle(Astro.currentLocale);
const t = useTranslations(locale, makeT(flat));
```

Unterstützende Hilfsfunktionen im Beispiel: `src/i18n/utils.ts`, `src/i18n/locale.ts` und `ui-languages.json` für Bezeichnungen, Schreibrichtung und BCP-47-Codes. Führen Sie `generate-ui-languages` nach Änderungen an `targetLocales` aus (optional setzen Sie `ui.uiLanguagesPath`, sodass das Manifest neben Ihren Hilfsfunktionen liegt, z. B. `src/i18n/ui-languages.json`). `MainLayout.astro` setzt `<html lang>` und `<html dir>` aus `resolveUiLanguage(Astro.currentLocale)`; `LanguagePicker.astro` verwendet `getRelativeLocaleUrl` aus `astro:i18n`.

<a id="pages-parse-and-replace"></a>
## Seiten (Parsen und Ersetzen)

Für Marketingseiten mit hartcodiertem HTML in `.astro`-Dateien lässt `translate-docs` Textknoten und Attribute (`alt`, `title`, `aria-label`, `placeholder`) extrahieren, diese mit dem Dokument-Cache übersetzen und sprachspezifische Kopien im Seitenverzeichnis ablegen. Für die meisten sichtbaren Texte benötigen Sie **kein** `t()`.

Strukturelle Attribut- und Schlüsselwerte werden standardmäßig **nicht** übersetzt: Der integrierte Schutz deckt JSX/HTML-Attribute wie `class`, `id`, `style`, `src`, `href`, `data-*` und die meisten `aria-*` ab, sowie Objektschlüssel wie `class`, `key` und `id` innerhalb von Vorlagen-`{expression}`-Blöcken. Verwenden Sie `docs[].protectAttributes` und `docs[].protectKeys`, um diese Listen zu erweitern, wenn Sie benutzerdefinierte Attribute verwenden (z. B. Tailwind `variant` oder CMS `slug`-Felder). Dieselben Optionen gelten für MDX JSX während der Markdown-Übersetzung (siehe [protectAttributes / protectKeys](/reference/configuration#protectattributes-protectkeys)).

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

Führen Sie `npx ai-i18n-tools translate-docs` (oder `pnpm i18n:translate` in [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/)) aus. Die englische Quelle bleibt unter `src/pages/index.astro`; jede Zielsprache erhält `src/pages/{locale}/index.astro` mit angepassten Importen für die zusätzliche Verzeichnisebene (z. B. `../layouts/` → `../../layouts/`).

Innerhalb des **Vorlagenkörpers** werden String-Literale in `{expression}`-Blöcken (Inline-Arrays, Objekt-`title`/`desc`-Felder) übersetzt, wenn sie für den Benutzer sichtbar sind; in Anführungszeichen stehende Werte für geschützte Attribute/Schlüssel, Literale innerhalb von `t('…')`, `<script>` und `<style>` bleiben unverändert. **Frontmatter TypeScript wird über diesen Pfad nicht übersetzt** – halten Sie gemeinsames Frontmatter (einschließlich `t()`-Importe und Daten-Arrays) auf englischen und lokalisierten Seiten identisch, oder führen Sie `translate-docs` nach der Bearbeitung der englischen Seite erneut aus, damit die lokalen Kopien Frontmatter-Änderungen übernehmen. Für reinen Frontmatter-Text verwenden Sie stattdessen die [UI-String-Pipeline](#astro-website-ui-strings-ssg).

Siehe [`examples/astro-website`](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website/) für die vollständige hybride Landingpage (HTML über `translate-docs`, Screenshot-Tab-Beschriftungen über `t()` + `translate-ui`).
