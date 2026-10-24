<a id="integrations"></a>
# Integrationen

Framework-spezifische Anleitungen für Dokumentations-Websites, Astro-Projekte und Python-Anwendungen. Dokumentations-Integrationen verwenden die [Documents](/de/guide/documents/)-Pipeline (`translate-docs` / `sync`) für Seiteninhalte; Shell-Strings (Navigation, Seitenleiste, Theme) werden innerhalb derselben Pipeline verarbeitet, sofern angegeben – nicht über die separate [JSON](/de/guide/json)-Pipeline. Python-Anwendungen verwenden die [UI strings](/de/guide/ui-strings/python)-Pipeline (`extract` / `translate-ui`).

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihre Website | Init-Vorlage | Hier starten |
| --- | --- | --- |
| Astro Starlight oder reines Astro | `ui-starlight` / hybride UI-Strings | [Astro](/de/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/de/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/de/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/de/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/de/guide/integrations/fumadocs) |
| Python (Streamlit, FastAPI, Flask, Django, gettext, Desktop) | `ui-python` / `ui-python-gettext` / `ui-python-flask` / `ui-python-django` | [Python](/de/guide/integrations/python) |

<a id="shared-concepts"></a>
## Gemeinsame Konzepte

Integrationen für Dokumentations-Frameworks nutzen dasselbe `docs[]`-Blockmodell, das unter [Documents](/de/guide/documents/) beschrieben ist. Setzen Sie `docsOutput.style` passend zu Ihrem Framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` oder `"astro-starlight"`). Informationen zum Layout des Ausgabeordners und zum Verhalten beim Umschreiben von Links finden Sie unter [Output layouts](/de/guide/documents/output-layouts) und [Link rewriting](/de/guide/documents/link-rewriting). Die Python-Einrichtung erfolgt separat: [Python](/de/guide/integrations/python).

Jedes `init -t ui-* -P <provider>` Scaffold schreibt den LLM-Provider-Block dieses Presets. Vor `translate-docs` oder `sync` legen Sie den entsprechenden API-Schlüssel fest – siehe [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key).

Einen frameworkübergreifenden Vergleich finden Sie unter [Framework-Shell-Übersetzung](#framework-shell-translation). Jede der unten verlinkten Anleitungen behandelt die Einrichtung für das jeweilige Framework.

<a id="framework-shell-translation"></a>
## Übersetzung der Framework-Shell

| Framework | Shell / Theme-Strings | Pipeline |
|-----------|----------------------|----------|
| Docusaurus | `write-translations`-Katalog (`{ message, description }`) | Dokumente — `docs[].docusaurusCatalogDir` + `translate-docs` |
| VitePress | Theme-/Navigations-/Seitenleisten-Katalog | Dokumente — `docsOutput.vitepressThemeCatalog` + `translate-docs` |
| Nextra | `_meta.ts`-Seitenleistenbeschriftungen | Dokumente — automatisch, wenn `style: "nextra"` + `translate-docs` |
| Nextra | Theme-Wörterbuch `.ts` | Dokumente — `docs[].nextraDictionaryPath` + `translate-docs` |
| Fumadocs | `meta.json`-Seitenleistenbeschriftungen | Dokumente — automatisch, wenn `style: "fumadocs"` + `translate-docs` |
| Fumadocs | UI-Überschreibungs-Katalog | Dokumente — `docsOutput.fumadocsUiCatalog` + `translate-docs` |
| Astro Starlight | Eingebaute UI-Strings (viele Gebietsschemata); keine zusätzliche Shell-Pipeline | Dokumente — `translate-docs` (nur Seiten) |

Legen Sie **keine** Framework-Shell-/Theme-Strings in `json[]` ab – diese Pipeline ist für nicht verwandte App-Locale-Bundles vorgesehen. Details zur Einrichtung pro Framework finden Sie in den Anleitungen, die unter [Welche Anleitung soll ich lesen?](#which-guide-to-read) verlinkt sind.

<a id="runnable-examples"></a>
## Ausführbare Beispiele

| Framework | Beispiel-Repo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Reine Astro-Website | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
| Streamlit | [examples/python-streamlit](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-streamlit) |
| Flask | [examples/python-flask](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-flask) |
| FastAPI | [examples/python-fastapi](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-fastapi) |
| GNU gettext | [examples/python-gettext](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/python-gettext) |
