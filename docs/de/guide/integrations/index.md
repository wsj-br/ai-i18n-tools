<a id="integrations"></a>
# Integrationen

Framework-spezifische Anleitungen zum Einbinden von ai-i18n-tools in Dokumentationsseiten und Astro-Projekte. Jede Integration verwendet die [Dokumente](/guide/documents/)-Pipeline (`translate-docs` / `sync`) für Seiteninhalte; Shell-Strings (Navigation, Seitenleiste, Theme) werden, wo angegeben, innerhalb derselben Pipeline behandelt – nicht über die separate [JSON](/guide/json)-Pipeline.

<a id="which-guide-to-read"></a>
## Welchen Leitfaden Sie lesen sollten

| Ihre Website | Init-Vorlage | Hier starten |
| --- | --- | --- |
| Astro Starlight oder reines Astro | `ui-starlight` / hybride UI-Strings | [Astro](/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/guide/integrations/fumadocs) |

<a id="shared-concepts"></a>
## Gemeinsame Konzepte

Alle Dokumentations-Framework-Integrationen teilen dasselbe `docs[]`-Blockmodell, das unter [Dokumente](/guide/documents/) beschrieben ist. Setzen Sie `docsOutput.style` passend zu Ihrem Framework (`"docusaurus"`, `"vitepress"`, `"nextra"`, `"fumadocs"` oder `"astro-starlight"`). Informationen zum Layout des Ausgabeordners und zum Verhalten der Link-Umschreibung finden Sie unter [Ausgabe-Layouts](/guide/documents/output-layouts) und [Link-Umschreibung](/guide/documents/link-rewriting).

Legen Sie **keine** Framework-Shell- oder Theme-Strings in `json[]` ab – diese Pipeline ist für nicht verwandte Anwendungs-Locale-Bundles vorgesehen. Jede Integrationsseite erklärt, welche Katalogpfade und CLI-Flags Navigation, Seitenleiste und Theme-Labels für das jeweilige Framework abdecken.

<a id="examples"></a>
## Ausführbare Beispiele

| Framework | Beispiel-Repo |
| --- | --- |
| Astro Starlight | [examples/astro-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-docs) |
| Reine Astro-Website | [examples/astro-website](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/astro-website) |
| Docusaurus | [examples/nextjs-app/docs-site](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextjs-app/docs-site) |
| VitePress | [examples/vitepress-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/vitepress-docs) |
| Nextra | [examples/nextra-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/nextra-docs) |
| Fumadocs | [examples/fumadocs-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/fumadocs-docs) |
