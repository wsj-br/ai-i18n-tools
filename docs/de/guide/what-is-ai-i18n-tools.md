<a id="what-is-ai-i18n-tools"></a>
# Was ist ai-i18n-tools?

Sie haben eine App, eine Website, eine Dokumentationsseite oder eine Repository-README in einer Sprache und möchten diese in weiteren Sprachen anbieten. Diese Sprache ist `sourceLocale` und es kann eine beliebige Sprache sein. Englisch ist ein gängiges Beispiel in diesen Anleitungen. ai-i18n-tools findet den Text, übersetzt ihn mit den Modellen des von Ihnen gewählten LLM-Anbieters und schreibt die Dateien, die Ihr Projekt bereits lädt. Es cacht jedes Ergebnis, sodass bei erneuten Ausführungen nur neuer oder geänderter Text an das Modell gesendet wird.

<a id="what-you-do-and-what-the-tool-does"></a>
## Was Sie tun und was das Tool tut

| Sie | Das Tool |
| --- | --- |
| Wählen Sie die Sprachen, einen Anbieter und die auszuprobierenden Modelle aus | Extrahiert Text, übersetzt ihn, validiert das Ergebnis und schreibt Kataloge oder Seiten |
| Machen Sie benutzerorientierten Text für das Tool sichtbar: `t()`-Aufrufe im App-Code, die eigene i18n Ihres Frameworks für eine Website oder eine Sprachlisten-Markierung in einer README | Speichert Übersetzungen im Cache und verwendet sie bei jeder erneuten Ausführung wieder |
| Binden Sie das Ergebnis in die App, das Routing der Website oder die Sprachzeile der README ein | Zeigt den Fortschritt an und ermöglicht Ihnen die Überprüfung von Übersetzungen im Dashboard |

Das Tool schreibt Ihren Quellcode nicht um. Für den Wrapping-Schritt werden Coding-Agent-Prompts bereitgestellt. Es installiert weder i18next noch die i18n Ihres Site-Frameworks und erstellt auch keinen Sprachumschalter, obwohl dafür Laufzeit-Helfer bereitgestellt werden.

<a id="where-do-i-start"></a>
## Wo fange ich an?

Die Anleitungen sind unter [i18n zu Ihrem Projekt hinzufügen](/de/guide/add-i18n-to-your-project) gruppiert, mit der gemeinsamen Einrichtung und einer Seite für jede Art von Projekt. Wählen Sie eine Zeile aus:

| Sie haben | Beginnen Sie hier |
| --- | --- |
| Eine JS/TS-App (React, Next.js, Node, CLI) mit Klartext im Quellcode | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) |
| Eine Python-App (Streamlit, FastAPI, Flask, Desktop, Skripte) | [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) |
| Eine Django-App, Flask-Babel-Kataloge oder eine App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) |
| Eine Website oder Dokumentationsseite (VitePress, Docusaurus, Starlight, Nextra, Fumadocs, Astro, reines HTML) | [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website) |
| Eine Repository-README und andere Markdown-Dateien, normalerweise neben einer App | [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) |
| Eigenständige verschachtelte JSON-Lokalisierungsdateien | [JSON](/de/guide/json) |
| SVG-Diagramme mit Textbeschriftungen | [SVG-Übersetzung](/de/guide/svg-translation/) |
| Intlayer-Wörterbücher (von Intlayer migrieren) | [Migration von Intlayer](/de/guide/migrating-from-intlayer) |
| Intlayer-Wörterbücher (Intlayer beibehalten, direkt übersetzen) | [Intlayer direkt übersetzen](/de/guide/translating-intlayer) |

<a id="how-it-works"></a>
## So funktioniert's

1. Installieren Sie die CLI und legen Sie den API-Schlüssel Ihres Anbieters fest: [Installation](/de/guide/installation).
2. Führen Sie `init` aus, um `ai-i18n-tools.config.json` zu schreiben: [Schnellstart](/de/guide/quick-start).
3. Bereiten Sie das Projekt vor: Umschließen Sie Zeichenfolgen in `t()`, aktivieren Sie die i18n Ihres Site-Frameworks oder fügen Sie die Sprachlisten-Markierung zu einer README hinzu.
4. Führen Sie `sync` aus. Es extrahiert Text, übersetzt Neues und schreibt die Ausgabe.
5. Laden Sie die Ausgabe in Ihre App oder Website, fügen Sie einen Sprachumschalter hinzu und führen Sie `sync` erneut aus, wenn sich der Quellcode ändert.

<a id="translation-modes"></a>
## Übersetzungsmodi

Unter der Haube führt das Tool vier Pipelines aus. Ihre Konfiguration aktiviert die benötigten, und `sync` führt sie der Reihe nach aus.

- UI-Strings — Extrahiert `t("…")`- und `_()`-Aufrufe aus JS/TS- und Python-Quellcode (und ähnliche Markierungen, einschließlich GNU gettext) und schreibt flache JSON-Dateien pro Gebietsschema oder `.po` / `.mo`-Kataloge. Befehle: `extract`, `translate-ui`. Anleitung: [UI-Strings](/de/guide/ui-strings/). Python: [Python-Anwendungen](/de/guide/ui-strings/python).
- Dokumente — Übersetzt Markdown-, MDX- und `.astro`-Seiten, die in `docs[].contentPaths` aufgeführt sind. Funktioniert mit VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro und anderen statischen Dokumentationsseiten sowie mit einer Repository-README (`docsOutput.style` von `flat`). Befehl: `translate-docs`. Anleitungen: [Dokumente](/de/guide/documents/) und [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).
- JSON — Übersetzt verschachtelte JSON-Lokalisierungs-Bundles (Themenbeschriftungen, i18n-Überschreibungen, App-Text, der nicht im Quellcode enthalten ist), die in der obersten Ebene von `json[]` definiert sind. Befehl: `translate-json`. Anleitung: [JSON](/de/guide/json).
- SVG — Übersetzt sichtbaren Text in SVG-Illustrationen (`<text>`, `<title>`, `<desc>`) und schreibt eine Ausgabedatei pro Gebietsschema. Getrennt von der Dokumentübersetzung. Befehl: `translate-svg`. Anleitung: [SVG-Übersetzung](/de/guide/svg-translation/).

Viele Projekte kombinieren Modi. Die häufigste Kombination sind UI-Strings und die Repository-README. Eine Dokumentationsseite wie VitePress ist die andere häufige Kombination. Siehe [Pipelines kombinieren](/de/guide/combining-pipelines) und [i18n zu Ihrer README und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme).

<a id="examples"></a>
## Beispiele

Das Repository enthält ausführbare Beispielprojekte unter `examples/`, jedes mit eigener Konfiguration, committeten Lokalisierungsausgaben und README. Übersetzte Dateien können ohne API-Schlüssel erkundet werden; für eine erneute Ausführung der Übersetzung ist ein Anbieter-Schlüssel erforderlich.

| Wenn Sie haben | Beispiel |
| --- | --- |
| Eine JS/TS-App | [console-app](/de/examples#console-app), [nextjs-app](/de/examples#nextjs-app) |
| Eine Repository-README neben einer App | [console-app](/de/examples#console-app), [nextjs-app](/de/examples#nextjs-app) |
| Eine Python-App | [python-streamlit](/de/examples#python-streamlit), [python-fastapi](/de/examples#python-fastapi), [python-gettext](/de/examples#python-gettext) |
| Eine Dokumentationsseite | [docusaurus-docs](/de/examples#docusaurus-docs), [vitepress-docs](/de/examples#vitepress-docs), [astro-docs](/de/examples#astro-docs) |
| Eine Website oder reines HTML | [astro-website](/de/examples#astro-website), [plain-html](/de/examples#plain-html) |

Die vollständige Liste und `npx degit` Kopierbefehle finden Sie unter [Beispiele](/de/examples).

<a id="next-steps"></a>
## Nächste Schritte

1. [Installation](/de/guide/installation) – Installieren Sie das npm-Paket oder laden Sie die [eigenständige ausführbare Datei](/de/guide/installation#standalone-executables) für ein Python-Projekt herunter und legen Sie Ihren Provider-API-Schlüssel fest.
2. [Schnellstart](/de/guide/quick-start) – Erstellen Sie eine Konfigurationsvorlage und führen Sie Ihre erste Übersetzung aus.
3. [LLM-Provider](/de/guide/providers-and-models) – Wählen Sie einen Provider, einen API-Schlüssel und eine `-P`-Überschreibung.
4. [KI-Modelle](/de/guide/ai-models) – Erstellen Sie mit `suggest-models` oder über den Tab **Modelle** im Dashboard eine Rangfolge für eine Auswahlliste und behalten Sie mehrere Modelle bei, sodass bei einer fehlgeschlagenen Übersetzung das nächste Modell ausprobiert werden kann.
