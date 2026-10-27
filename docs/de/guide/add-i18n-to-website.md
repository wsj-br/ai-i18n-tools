<a id="add-i18n-to-a-website-or-docs-site"></a>
# i18n zu einer Website oder Dokumentationsseite hinzufügen

Diese Seite ist für eine Dokumentationswebsite (Markdown oder MDX) oder eine Marketing- oder statische Website (eine Astro-Website oder reines HTML) in einer Sprache. Das Tool übersetzt Ihre Seiteninhalte mit den Modellen Ihres LLM-Anbieters und schreibt eine lokalisierte Kopie pro Sprache. Ihr Site-Framework liefert diese Kopien aus und stellt die Sprachauswahl bereit.

Für eine App, deren UI-Strings in `t()`-Aufrufen liegen, verwenden Sie stattdessen [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python).

<a id="what-do-you-have"></a>
## Was haben Sie?

| Ihre Website | Init-Vorlage | Hier starten |
| --- | --- | --- |
| Astro Starlight oder reines Astro | `ui-starlight` / hybride UI-Strings | [Astro](/de/guide/integrations/astro) |
| Docusaurus | `ui-docusaurus` | [Docusaurus](/de/guide/integrations/docusaurus) |
| VitePress | `ui-vitepress` | [VitePress](/de/guide/integrations/vitepress) |
| Nextra 4 (Next.js App Router) | `ui-nextra` | [Nextra](/de/guide/integrations/nextra) |
| Fumadocs 4 (Next.js App Router) | `ui-fumadocs` | [Fumadocs](/de/guide/integrations/fumadocs) |
| Reine HTML-Seiten | `ui-plain-html` oder `docs-plain-html` | [Reine HTML-Apps](/de/guide/ui-strings/plain-html) |
| Kein Site-Framework, nur eine README-Datei und Markdown-Dateien | `docs-markdown` oder eine beliebige Vorlage plus `--with-readme` | [i18n zu Ihren README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme) |

<details class="agent-prompt">
<summary>Agent-Prompts</summary>

- Astro Starlight: nur Hinweise. Astro `t()`-Dateien: [JS/TS-Prompt](/de/guide/add-i18n-to-js#agent-prompt) (i18next überspringen).
- Docusaurus: nur Hinweise (`<Translate>` ist die eigene API von Docusaurus).
- VitePress: [Theme-Katalog-Prompt](/de/guide/integrations/vitepress#wire-configmts-to-generated-theme-json-one-off).
- Nextra: [Wörterbuch-Prompt](/de/guide/integrations/nextra#agent-prompt-dictionary) und [hybrider `t()`-Prompt](/de/guide/integrations/nextra#optional-t-for-app-react-hybrid).
- Fumadocs: [UI-Katalog-Prompt](/de/guide/integrations/fumadocs#agent-prompt).
- README- und Markdown-Dateien: [README-Prompt](/de/guide/add-i18n-to-readme#agent-prompt).

</details>

<a id="steps"></a>
## Schritte

Die gleiche Struktur funktioniert für jedes Framework; die Details finden Sie im oben verlinkten Framework-Leitfaden.

1. Installieren Sie die CLI und legen Sie den API-Schlüssel fest: [Installation](/de/guide/installation), [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key).
2. Gerüst erstellen: `ai-i18n-tools init -t <template> -P <provider>`.
3. Legen Sie `sourceLocale`, `targetLocales` und `docs[].contentPaths` fest (die Seiten und Ordner, die in Ihrer Ausgangssprache geschrieben sind). `sourceLocale` kann jede Sprache sein. Der Framework-Leitfaden zeigt das richtige `docsOutput.style`.
4. Aktivieren Sie die eigene i18n-Funktion Ihres Frameworks, damit es die lokalisierten Seiten bereitstellt und verlinkt. Jeder Leitfaden enthält einen Abschnitt „i18n auf einer bestehenden Site aktivieren“: [VitePress](/de/guide/integrations/vitepress#enable-i18n-in-an-existing-site), [Docusaurus](/de/guide/integrations/docusaurus#enable-i18n-in-an-existing-site), [Nextra](/de/guide/integrations/nextra#enable-i18n-in-an-existing-site), [Fumadocs](/de/guide/integrations/fumadocs#enable-i18n-in-an-existing-site), [Astro](/de/guide/integrations/astro#enable-i18n-in-an-existing-site).
5. Führen Sie `ai-i18n-tools sync` (oder `translate-docs`) aus und erstellen Sie dann die Site.
6. Überprüfen Sie eine lokalisierte Route im Browser. Das eigene Locale-Dropdown des Frameworks ist der Umschalter. Fügen Sie für eine einfache Markdown-Datei wie eine README-Datei eine Linkzeile mit [languageListBlock](/de/guide/documents/language-switcher) hinzu.

<a id="what-gets-translated"></a>
## Was wird übersetzt

Seiteninhalte durchlaufen immer die [Dokumente](/de/guide/documents/)-Pipeline. Framework-Chrome (Navigation, Seitenleiste, Theme-Labels) wird im selben Durchlauf behandelt, sofern das Framework dies unterstützt, und nicht über die separate [JSON](/de/guide/json)-Pipeline.

| Framework | Shell- und Theme-Strings | Wie |
| --- | --- | --- |
| Docusaurus | `write-translations`-Katalog (`{ message, description }`) | `docs[].docusaurusCatalogDir` plus `translate-docs` |
| VitePress | Theme-, Navigations- und Seitenleisten-Katalog | `docsOutput.vitepressThemeCatalog` plus `translate-docs` |
| Nextra | `_meta.ts`-Seitenleisten-Labels | Automatisch mit `style: "nextra"` |
| Nextra | Theme-Wörterbuch `.ts` | `docs[].nextraDictionaryPath` |
| Fumadocs | `meta.json`-Seitenleisten-Labels | Automatisch mit `style: "fumadocs"` |
| Fumadocs | Katalog für UI-Überschreibungen | `docsOutput.fumadocsUiCatalog` |
| Astro Starlight | Integrierte UI-Strings in vielen Sprachen | Nur Seiten |

Bilder und Screenshots werden nicht von `translate-docs` übersetzt. Für sprachspezifische Dateien siehe [Bilder und Screenshots](/de/guide/images-and-screenshots/).

<a id="plain-html"></a>
## Reines HTML

Zwei Optionen, je nachdem, wie sich die Seite verhalten soll:

- Eine Seite, die die Sprache im Browser umschaltet: den Text mit `data-i18n*`-Attributen markieren und die UI-Strings-Laufzeit (`ui-plain-html`) verwenden. Siehe [Reine HTML-Apps](/de/guide/ui-strings/plain-html).
- Eine übersetzte HTML-Datei pro Sprache: die Dokumente-Pipeline (`docs-plain-html`) verwenden. Siehe [HTML-Seiten](/de/guide/documents/html-pages).

Eine Datei gehört zu einem Pfad.

<a id="not-your-case"></a>
## Nicht Ihr Fall?

- App-UI-Strings: [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) oder [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python).
- Ein Repository-README neben der Website oder Markdown-Dateien ohne Site-Framework: [i18n zu Ihrem README und Ihren Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme). `init … --with-readme` fügt diesen Block neben einer Site-Vorlage hinzu.
- Eigenständiges verschachteltes Locale-JSON: [JSON](/de/guide/json).
- Übersetzung von Site- und App-Strings: [Pipelines kombinieren](/de/guide/combining-pipelines).

Referenz für die gemeinsamen Optionen und frameworkspezifische Unterschiede: [Integrationen](/de/guide/integrations/).
