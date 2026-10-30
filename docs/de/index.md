---
layout: home
title: ai-i18n-tools
pageClass: home-onboarding
description: >-
  Machen Sie Ihre einsprachige App, Website oder Repository-Dokumentation
  mehrsprachig mit geführter Einrichtung, KI-Übersetzung und
  zwischengespeicherten Wiederholungen. Beginnen Sie mit JavaScript, TypeScript,
  Python oder einer README-Datei.
hero:
  name: ai-i18n-tools
  text: Machen Sie Ihr einsprachiges Projekt mehrsprachig.
  tagline: >-
    Fügen Sie Ihrer App, Website oder Ihren Repository-Doks Sprachen hinzu – mit
    geführter Einrichtung und KI-Übersetzung. Wählen Sie Ihren Anbieter und Ihre
    Modelle aus und verwenden Sie zwischengespeicherte Übersetzungen wieder,
    während Ihr Projekt wächst.
  image:
    src: /ai-i18n-tools_logo.svg
    alt: ai-i18n-tools-Logo
  actions:
    - theme: brand
      text: Wählen Sie Ihr Projekt
      link: '#start-here'
    - theme: alt
      text: Beispiele erkunden
      link: /de/examples
---



<a id="start-with-the-project-you-have"></a>
## Beginnen Sie mit Ihrem vorhandenen Projekt

Heute nur eine Sprache? Beginnen Sie hier. Diese Sprache kann jede beliebige Sprache sein: Legen Sie sie als `sourceLocale` fest. Englisch ist ein gängiges Beispiel in diesen Anleitungen. Internationalisierung (i18n) bereitet Ihr Projekt darauf vor, verschiedene Sprachen zu unterstützen; diese Anleitungen führen Sie von der Einrichtung bis zu Ihrer ersten übersetzten Erfahrung, einschließlich der README-Datei, die Ihr Repository bereits auf GitHub, GitLab oder einem anderen Host anzeigt.

<div class="home-paths">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/typescript.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/nodejs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="javascript-or-typescript-app"></a>
### JavaScript- oder TypeScript-App

Verwandeln Sie Schaltflächen, Beschriftungen und Meldungen im Klartext in eine mehrsprachige Benutzeroberfläche. Richten Sie Ihre Laufzeitumgebung ein, markieren Sie den zu übersetzenden Text und verbinden Sie die Sprachumschaltung. Enthält Coding-Agent-Eingabeaufforderungen für den Vorbereitungsschritt.

React · Next.js · Node.js · CLI

[I18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/fastapi.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/flask.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/ui/terminal.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-app"></a>
### Python-App

Umschließen Sie benutzerorientierten Text und laden Sie übersetzte Nachrichten mit einem generierten Helfer. Verwenden Sie bereits Django oder GNU gettext? Behalten Sie Ihre gettext-Aufrufe bei und lassen Sie das Tool die `.po`-Dateien füllen. Führen Sie die Übersetzungs-CLI von einer eigenständigen ausführbaren Datei ohne separate Node.js-Installation aus.

Streamlit · FastAPI · Flask · Django · CLI

[i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) · [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/astro.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/docusaurus.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="website-or-documentation"></a>
### Website oder Dokumentation

Veröffentlichen Sie lokalisierte Seiten und verbinden Sie diese mit den Sprachrouten Ihrer Website. Befolgen Sie frameworkspezifische Schritte für Navigation, Theme-Labels und das Sprachmenü.

VitePress · Starlight · Docusaurus · Astro

[I18n zu einer Website oder Doku-Website hinzufügen](/de/guide/add-i18n-to-website)

</article>
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/github.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gitlab.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/bitbucket.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="repository-readme-and-docs"></a>
### Repository-README und -Dokumentation

Übersetzen Sie `README.md` und andere Markdown-Dateien in eine Datei pro Sprache, mit einer Reihe von Links dazwischen. Kombinieren Sie dies mit den UI-Strings Ihrer App oder übersetzen Sie das README separat.

GitHub · GitLab · Bitbucket

[I18n zu README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme)

</article>
</div>

Sie sind sich nicht sicher, welcher Weg der richtige ist? [i18n zu Ihrem Projekt hinzufügen](/de/guide/add-i18n-to-your-project) listet alle Anleitungen auf. [Sehen Sie, was ai-i18n-tools leistet](/de/guide/what-is-ai-i18n-tools), um zu erfahren, wie die Pipelines zusammenpassen.

<a id="from-setup-to-your-first-new-language"></a>
## Von der Einrichtung bis zu Ihrer ersten neuen Sprache

<div class="home-steps">

1. **Bereiten Sie Ihr Projekt vor.** Wählen Sie Ihre Sprachen, einen Übersetzungsanbieter und die auszuprobierenden Modelle. Für Apps markieren Sie benutzerorientierten Text und richten die Übersetzungs-Laufzeitumgebung ein. Für Websites aktivieren Sie das Sprach-Routing Ihres Frameworks. Die Anleitungen enthalten Coding-Agent-Eingabeaufforderungen, wo Quelltextänderungen erforderlich sind.
2. **Übersetzen Sie in verwendbare Dateien.** Sobald die Einrichtung abgeschlossen ist, führen Sie `sync` aus. Es extrahiert unterstützte App-Strings, übersetzt den von Ihnen aktivierten Inhalt und schreibt Lokalisierungsdateien oder lokalisierte Seiten.
3. **Laden, prüfen und fortfahren.** Verbinden Sie die Ausgabe mit Ihrer App oder Website, verbinden Sie die Sprachumschaltung und prüfen Sie eine Zielsprache. Führen Sie es nach Quelltextänderungen erneut aus, um neuen oder geänderten Text zu übersetzen.

</div>

Sie übernehmen die Einrichtung der Laufzeitumgebung und des Routings, manuell oder mit einem Coding-Agent. Die CLI übernimmt Extraktion, Übersetzung, Validierung und Dateigenerierung – nicht die automatische Quellcode-Umschreibung oder die Installation von Sprachumschaltern. [Folgen Sie der vollständigen Schnellstartanleitung](/de/guide/quick-start).

<a id="your-source-text-ready-for-more-languages"></a>
## Ihr Quelltext. Bereit für weitere Sprachen.

Dieses anschauliche JS/TS-Beispiel zeigt die Struktur des Ergebnisses nach der Laufzeiteinrichtung und Übersetzung. Das Markieren der Quellzeichenfolge macht sie auffindbar; jede generierte Locale-Datei ordnet diesen Satz seiner Übersetzung zu.

::: code-group

```js [Prepared source]
t("Save changes");
```

```json [Generated de.json]
{
  "Save changes": "Änderungen speichern"
}
```

```json [Generated pt-BR.json]
{
  "Save changes": "Salvar alterações"
}
```

```json [Generated zh-Hans.json]
{
  "Save changes": "保存更改"
}
```

:::

Der Quelltext bleibt in Ihrem Code lesbar. Ihre App lädt die generierten Lokalisierungsdateien zur Laufzeit. Möchten Sie die vollständige Anbindung sehen? [Erkunden Sie das funktionierende Next.js-Beispiel](/de/examples#nextjs-app). Websites verfolgen einen anderen Ansatz: [generieren Sie lokalisierte Seiten](/de/guide/add-i18n-to-website), anstatt jeden Absatz zu umschließen.

<a id="built-for-the-next-update-too"></a>
## Auch für das nächste Update ausgelegt

<div class="home-features">
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/openai.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/anthropic.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/openrouter.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/gemini.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-mono" src="/icons/brands/ollama.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="choose-your-provider-and-models"></a>
### Wählen Sie Ihren Anbieter und Ihre Modelle

Verwenden Sie unterstützte Anbieter wie OpenAI, Anthropic, OpenRouter, Gemini, lokales Ollama oder neun weitere integrierte Optionen. Sie können auch jeden OpenAI-kompatiblen Anbieter verwenden. Die Übersetzungsqualität richtet sich nach der Modellliste (`translationModels`, plus sprachspezifische Überschreibungen). `suggest-models` erstellt diese Liste aus veröffentlichten Übersetzungs-Benchmarks, die auch die Rangfolge unter **Modelle** im Dashboard bildet.

[LLM-Anbieter](/de/guide/providers-and-models) · [KI-Modelle](/de/guide/ai-models)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/refresh-cw.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="reuse-work-already-done"></a>
### Bereits geleistete Arbeit wiederverwenden

Zwischengespeicherte Übersetzungen ermöglichen es erneuten Durchläufen, sich auf neuen oder geänderten Text zu konzentrieren, anstatt alles erneut zu übersetzen.

[Übersetzungen aktuell halten](/de/guide/quick-start#keep-it-translated)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layout-dashboard.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="review-ai-output-locally"></a>
### KI-Ausgabe lokal überprüfen

Prüfen Sie Übersetzungen, korrigieren Sie Formulierungen und verwalten Sie die Terminologie im Übersetzungs-Dashboard.

[Das Dashboard anzeigen](/de/guide/translation-dashboard/)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/layers.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="keep-app-and-content-together"></a>
### App und Inhalte zusammenhalten

Übersetzen Sie App-Nachrichten, Dokumentation, verschachteltes Locale-JSON und SVG-Textbeschriftungen aus einer Konfiguration. Aktivieren Sie nur, was Sie benötigen.

[Pipelines kombinieren](/de/guide/combining-pipelines)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/file-text.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="translate-the-readme-with-the-app"></a>
### Die README-Datei mit der App übersetzen

Ein `sync` deckt UI-Strings und Repository-Markdown ab und schreibt eine Sprachzeile in die README.

[I18n zu README- und Markdown-Dokumenten hinzufügen](/de/guide/add-i18n-to-readme)

</article>
</div>

<a id="see-a-working-project-first"></a>
## Sehen Sie sich zuerst ein funktionierendes Projekt an

Diese Beispiele umfassen Konfiguration und übertragene übersetzte Dateien. Erkunden Sie die Ausgabe ohne API-Schlüssel; das erneute Ausführen der Übersetzung erfordert einen konfigurierten Anbieter und normalerweise einen Schlüssel. Lokales Ollama benötigt keinen API-Schlüssel.

<div class="home-examples">
<article class="home-card">

<div class="home-card-logos">
<img class="icon-mono" src="/icons/brands/nextjs.svg" alt="" aria-hidden="true" width="26" height="26" />
<img class="icon-light" src="/icons/brands/react.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="a-multilingual-app"></a>
### Eine mehrsprachige App

Sehen Sie React-Komponenten, Laufzeit-Anbindung, Pluralformen und Sprachumschaltung in einem funktionierenden Next.js-Projekt.

[Das Next.js-Beispiel erkunden](/de/examples#nextjs-app)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/python.svg" alt="" aria-hidden="true" width="26" height="26" />
<img src="/icons/brands/streamlit.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="python-in-practice"></a>
### Python in der Praxis

Sehen Sie, wie eine Streamlit-App ihre Nachrichten kapselt und übersetztes JSON verwendet, ohne eine JavaScript-Laufzeitumgebung zur App hinzuzufügen.

[Das Streamlit-Beispiel erkunden](/de/examples#python-streamlit)

</article>
<article class="home-card">

<div class="home-card-logos">
<img src="/icons/brands/vitepress.svg" alt="" aria-hidden="true" width="26" height="26" />
</div>

<a id="docs-in-more-languages"></a>
### Dokumentation in weiteren Sprachen

Sehen Sie übersetzte VitePress-Seiten zusammen mit lokalisierter Navigation und Theme-Labels.

[Das VitePress-Beispiel erkunden](/de/examples#vitepress-docs)

</article>
</div>

[Alle ausführbaren Beispiele durchsuchen](/de/examples), einschließlich einfachem HTML, anderer Frameworks und bestehender i18n-Workflows.

<a id="already-have-i18n-keep-what-works"></a>
## Bereits i18n im Einsatz? Behalten Sie, was funktioniert.

Sie müssen nicht von vorne anfangen.

<div class="home-existing">
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/code.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="source-string-calls"></a>
### Quellstring-Aufrufe

Behalten Sie die `t()`- und gettext-Aufrufe bei, die bereits im Projekt vorhanden sind.

[JS/TS-UI-Strings](/de/guide/ui-strings/) · [Python und gettext](/de/guide/ui-strings/python)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/braces.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="json-bundles"></a>
### JSON-Bundles

Übersetzen Sie verschachtelte Locale-Dateien, einschließlich i18next-Namespaces. Website-Navigation und Theme-Kataloge gehören zur [Dokumentübersetzung](/de/guide/add-i18n-to-website#what-gets-translated), nicht zu diesem Pfad.

[JSON-Bundles übersetzen](/de/guide/json)

</article>
<article class="home-card">

<div class="home-card-icon">
<img src="/icons/ui/languages.svg" alt="" aria-hidden="true" width="22" height="22" />
</div>

<a id="intlayer-dictionaries"></a>
### Intlayer-Wörterbücher

Behalten Sie Intlayer bei und füllen Sie fehlende Übersetzungen aus, oder stellen Sie die App auf Quell-String-Aufrufe um.

[An Ort und Stelle übersetzen](/de/guide/translating-intlayer) · [Auf Quellstring-Aufrufe umstellen](/de/guide/migrating-from-intlayer)

</article>
</div>

Haben Sie auch Diagramme? [Übersetzen Sie SVG-Textlabels](/de/guide/svg-translation/) neben Ihrer App oder Ihren Dokumenten.

<a id="ready-to-add-your-first-language"></a>
## Bereit, Ihre erste Sprache hinzuzufügen?

<div class="home-cta">

[Wählen Sie Ihr Projekt](#start-here) für die vollständige Anleitung, oder [öffnen Sie den Schnellstart](/de/guide/quick-start) für Installation und Konfiguration.

Installieren Sie das [npm-Paket](/de/guide/installation) für ein Node.js-Projekt.

<a id="python-no-nodejs"></a>

Für Python [laden Sie die eigenständige ausführbare Datei herunter](/de/guide/installation#standalone-executables)—keine separate Node.js-Installation erforderlich.

<div class="home-badges">

[![npm version](https://img.shields.io/npm/v/ai-i18n-tools.svg)](https://www.npmjs.com/package/ai-i18n-tools) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/wsj-br/ai-i18n-tools/blob/main/LICENSE)

[![Linux x64](https://img.shields.io/badge/Linux-x64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Linux arm64](https://img.shields.io/badge/Linux-arm64-FCC624?logo=linux&logoColor=black)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS arm64](https://img.shields.io/badge/macOS-arm64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![macOS x64](https://img.shields.io/badge/macOS-x64-000000?logo=apple&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases) [![Windows x64](https://img.shields.io/badge/Windows-x64-0078D6?logo=windows&logoColor=white)](https://github.com/wsj-br/ai-i18n-tools/releases)

</div>

</div>

<a id="go-deeper-when-you-need-to"></a>
## Bei Bedarf tiefer eintauchen

[Integrationen](/de/guide/integrations/) · [LLM-Anbieter](/de/guide/providers-and-models) · [KI-Modelle](/de/guide/ai-models) · [Konfiguration](/de/reference/configuration) · [CLI-Referenz](/de/reference/cli-commands/)

<br/>

<br/>

::: info Über diese Website
Die nicht-englische Benutzeroberfläche und Dokumentation wurden mit ai-i18n-tools übersetzt. KI-Übersetzungen können Fehler enthalten.

Alle Produktnamen, Logos und Marken sind Eigentum ihrer jeweiligen Inhaber. Symbole und Namen werden ausschließlich zu Identifikationszwecken verwendet. Dieses Projekt ist nicht mit diesen Marken verbunden oder wird von ihnen unterstützt.
:::
