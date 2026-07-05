<a id="translation-dashboard"></a>
# Übersetzungs-Dashboard

Das Übersetzungs-Dashboard ist eine lokale Web-Benutzeroberfläche zum Prüfen und Bearbeiten der Übersetzungsdaten Ihres Projekts. Es liest aus drei Speichern:

- **SQLite-Cache** (`cacheDir`) – Übersetzungen von Dokumentationssegmenten, Fehleraufzeichnungen, Markdown-Problemanalysen
- **`strings.json`** – UI-String-Katalog (einfache Strings und Pluralgruppen)
- **Benutzerglossar-CSV** (`glossary.userGlossary`) – Terminologiehinweise für `translate-ui` und `proofread-ui`

Verwenden Sie es nach einem Übersetzungslauf, um Probleme zu finden, fehlerhafte Ausgaben zu überschreiben oder die Cache-Abdeckung zu überprüfen – ohne manuell SQLite oder JSON durchsuchen zu müssen.

<a id="start-the-dashboard"></a>
## Dashboard starten

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

Der Standard-Listen-Port ist **8675**. Falls dieser Port nicht verfügbar ist, versucht der Server den nächsten Port (bis zu 1000 Versuche) und protokolliert den gewählten Port. Der veraltete Alias `editor` funktioniert weiterhin, gibt aber eine Warnung aus – bevorzugen Sie `dashboard`.

Die Dashboard-Benutzeroberfläche verwendet dieselbe Gebietsschema-Auflösung wie die CLI: `-L` / `--ui-lang` → `AI_I18N_LANG` → Konfiguration `uiLanguage` → OS-Gebietsschema. Siehe [Tool-UI-Sprache](/reference/environment-variables#tool-ui-language).

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## Welchen Tab soll ich verwenden?

| Ich möchte… | Tab | Anleitung |
| --- | --- | --- |
| Dokumentationssegmente reparieren, die bei der Übersetzung fehlgeschlagen sind | **Fehler** | [Fehler](/guide/translation-dashboard/failures) |
| Quell-Markdown vor der Übersetzung reparieren | **Markdown-Probleme** | [Markdown-Probleme](/guide/translation-dashboard/markdown-issues) |
| Eine zwischengespeicherte Dokumentationsübersetzung überschreiben | **Dokumentation** | [Dokumentations-Cache](/guide/translation-dashboard/documentation-cache) |
| Eine UI-Beschriftung korrigieren | **UI-Strings** | [UI-Strings & Plurale](/guide/translation-dashboard/ui-strings) |
| Eine Pluralform korrigieren (`one`, `other`, …) | **UI-Plurale** | [UI-Strings & Plurale](/guide/translation-dashboard/ui-strings) |
| Terminologie für die UI-Übersetzung sperren | **Glossar** | [Glossar](/guide/translation-dashboard/glossary) |
| Cache-Abdeckung und Modellnutzung anzeigen | **Statistiken** | [Statistiken](/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## Nach der Bearbeitung

| Sie haben bearbeitet… | Dann ausführen… | Vermeiden Sie… |
| --- | --- | --- |
| Dokumentations-Cache-Zeile | `sync --force-update` oder `translate-docs --force-update` | — |
| UI-String oder Plural | einfaches `sync` oder `translate-ui` | `--force` (überschreibt `user-edited`-Zeilen) |
| Glossar-Zeile | nächstes `translate-ui` oder `proofread-ui` | — |

Manuelle Bearbeitungen werden im Cache oder `strings.json` mit dem Modell `user-edited` markiert. Das erneute Übersetzen von unverändertem Quelltext überspringt diese Zeilen, es sei denn, Sie verwenden `--force`.

<a id="tips"></a>
## Tipps

- **Log-Link-Schaltflächen** (🔗 in Tabellenzeilen) geben Datei:Zeilen-Hinweise an das **Terminal** aus, in dem `ai-i18n-tools dashboard` ausgeführt wird – nützlich, um vom Browser zu Ihrem Editor zu springen.
- **Schließen** (oben rechts in der Tab-Leiste) fährt den Dashboard-Server ordnungsgemäß herunter.
- Wenn der Server stoppt, während der Browser-Tab noch geöffnet ist, erscheint eine Überlagerung; starten Sie `ai-i18n-tools dashboard` neu, um die Verbindung wiederherzustellen.
