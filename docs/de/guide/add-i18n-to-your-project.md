<a id="add-i18n-to-your-project"></a>
# i18n zu Ihrem Projekt hinzufügen

Dieser Abschnitt enthält die Anleitungen für ein Projekt, das derzeit nur eine Sprache hat. Beginnen Sie hier. Jede der folgenden Seiten behandelt eine Art von Projekt von der Einrichtung bis zu den ersten übersetzten Dateien. [Erste Schritte](/de/guide/what-is-ai-i18n-tools) behandelt, was das Tool ist, Installationsoptionen sowie Anbieter und Modelle. Sie können eine Anleitung öffnen, ohne diese Seiten zuerst zu lesen.

<a id="what-you-do-and-what-the-tool-does"></a>
## Was Sie tun und was das Tool tut

| Sie | Das Tool |
| --- | --- |
| Wählen Sie die Sprachen, einen Anbieter und die Modelle zum Ausprobieren aus | Extrahiert Text, übersetzt ihn, prüft das Ergebnis und schreibt Kataloge oder Seiten |
| Text sichtbar machen: `t()` im App-Code, die i18n-Funktion Ihres Site-Frameworks oder einen Sprachlisten-Marker in einer README-Datei | Speichert jede Übersetzung im Cache und verwendet sie beim nächsten Durchlauf wieder |
| Dateien laden und eine Sprache prüfen | Zeigt den Fortschritt an und ermöglicht Ihnen die Überprüfung der Formulierungen im [Übersetzungs-Dashboard](/de/guide/translation-dashboard/) |

Die Anleitungen geben an, welche Quelltextänderungen Sie vornehmen müssen. Hinweise für Coding-Agenten sind enthalten, wo diese Änderungen mechanischer Natur sind. Die CLI schreibt die Kataloge und die übersetzten Dateien. Sie installiert weder i18next noch die i18n-Funktion Ihres Site-Frameworks.

<a id="shared-setup"></a>
## Gemeinsame Einrichtung

Jede Anleitung folgt der gleichen Reihenfolge. Die von Ihnen gewählte Seite ergänzt die Details.

1. Installieren Sie die CLI und legen Sie den API-Schlüssel Ihres Anbieters fest. Ollama benötigt keinen Schlüssel. [Installation](/de/guide/installation) und [Anbieter und API-Schlüssel](/de/guide/quick-start#provider-and-api-key).
2. Führen Sie `init` mit der Vorlage aus, die auf dieser Seite genannt wird. Dadurch wird `ai-i18n-tools.config.json` geschrieben.
3. Bereiten Sie das Projekt vor, damit das Tool den Text sehen kann. Verwenden Sie den Agent-Prompt dieser Seite oder die manuellen Schritte auf derselben Seite.
4. Führen Sie `ai-i18n-tools sync` aus, dann `ai-i18n-tools status`.
5. Laden Sie die Ausgabe, prüfen Sie eine Zielsprache und führen Sie `sync` erneut aus, wenn sich die Quelle ändert. Der Cache sendet nur neuen oder geänderten Text an das Modell.

<a id="pages-in-this-section"></a>
## Seiten in diesem Abschnitt

| Sie haben | Seite | Was diese Seite behandelt |
| --- | --- | --- |
| Eine JS/TS-App (React, Next.js, Node, CLI), deren Schaltflächen und Nachrichten noch Klartext sind | [i18n zu einer JS/TS-App hinzufügen](/de/guide/add-i18n-to-js) | i18next installieren, den Bootstrap hinzufügen, Literale in `t()` umschließen und einen Sprachumschalter hinzufügen, dann `extract` und `translate-ui` |
| Eine Python-App (Streamlit, FastAPI, Flask, Desktop, Skripte) | [i18n zu einer Python-App hinzufügen](/de/guide/add-i18n-to-python) | Den `i18n.py`-Helfer platzieren, `t()` oder `_()` umschließen, einen Sprachumschalter hinzufügen. Die CLI kann als eigenständige ausführbare Datei ohne Node.js-Installation ausgeführt werden |
| Eine Django-App, Flask mit Flask-Babel-Katalogen oder jede App, die bereits GNU gettext verwendet | [i18n zu einer Django-/Python-gettext-App hinzufügen](/de/guide/add-i18n-to-django-gettext) | Behalten Sie Ihre `gettext`-, `{% blocktranslate %}`- und `.po`-Dateien bei. Das Tool füllt und kompiliert die Kataloge |
| Eine Dokumentations- oder Marketing-Website (VitePress, Starlight, Docusaurus, Nextra, Fumadocs, Astro, reines HTML) | [i18n zu einer Website oder Dokumentationsseite hinzufügen](/de/guide/add-i18n-to-website) | Aktivieren Sie die i18n des Frameworks mit dem Agent-Prompt der Seite, dann `sync`, um Seiten und Theme-Labels zu übersetzen |
| Eine Repository-README-Datei und andere Markdown-Dateien, normalerweise neben einer App | [i18n zu Ihrer README-Datei und Markdown-Dokumentation hinzufügen](/de/guide/add-i18n-to-readme) | Eine Datei pro Sprache (`translated-docs/README.de.md`) und eine Sprachzeile in der README-Datei. `init --with-readme` fügt diesen Block zu jeder Vorlage hinzu |
| Mehrere der oben genannten Elemente in einem Repository | [Pipelines kombinieren](/de/guide/combining-pipelines) | Eine Konfiguration und ein `sync`. Das übliche Paar sind App-UI-Strings plus die README-Datei |
| Intlayer-Wörterbücher, und Sie möchten Intlayer beibehalten | [Intlayer vor Ort übersetzen](/de/guide/translating-intlayer) | `translate-intlayer` füllt fehlende und veraltete Blätter innerhalb von `*.content.ts` |
| Intlayer-Wörterbücher, und Sie wechseln von Intlayer ab | [Migration von Intlayer](/de/guide/migrating-from-intlayer) | `migrate-intlayer` füllt Kataloge aus den Wörterbüchern und schreibt sichere Aufrufstellen in `t()` um |

Eine App, die auch eine README-Datei hat, verwendet die App-Seite und die README-Seite zusammen. Eine Website, die auch eine README-Datei hat, verwendet die Website-Seite und `init … --with-readme` für den README-Block.

<a id="where-to-go-deeper"></a>
## Wo Sie tiefer einsteigen können

Die Anleitungen enden, sobald die erste Sprache eingerichtet ist. Die Referenzseiten setzen dort an:

- [UI-Strings](/de/guide/ui-strings/), [Dokumente](/de/guide/documents/), [JSON](/de/guide/json) und [SVG](/de/guide/svg-translation/) für jeweils eine Pipeline.
- [Integrationen](/de/guide/integrations/) für Framework-Shell-Strings (Navigation, Seitenleiste, Design).
- [Schnellstart](/de/guide/quick-start) für die Befehlsliste und empfohlene `package.json`-Skripte.
- [LLM-Anbieter](/de/guide/providers-and-models) für Voreinstellungen und API-Schlüssel.
- [KI-Modelle](/de/guide/ai-models) für die Rangliste der engeren Auswahl und die Fallback-Kette.
