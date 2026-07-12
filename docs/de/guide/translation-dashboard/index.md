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

Die Dashboard-Benutzeroberfläche verwendet dieselbe Gebietsschema-Auflösung wie die CLI: `-L` / `--ui-lang` → `AI_I18N_LANG` → Konfiguration `uiLanguage` → Betriebssystem-Gebietsschema. Siehe [Sprache der Tool-Benutzeroberfläche](/de/guide/tool-ui-language).

![Übersetzungs-Dashboard mit Registerkarte „Dokumentation“ mit Filtern und zwischengespeicherten Segmentzeilen](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## Welchen Tab soll ich verwenden?

| Ich möchte… | Tab | Anleitung |
| --- | --- | --- |
| Dokumentationssegmente reparieren, die bei der Übersetzung fehlgeschlagen sind | **Fehler** | [Fehler](/de/guide/translation-dashboard/failures) |
| Quell-Markdown vor der Übersetzung reparieren | **Markdown-Probleme** | [Markdown-Probleme](/de/guide/translation-dashboard/markdown-issues) |
| Eine zwischengespeicherte Dokumentationsübersetzung überschreiben | **Dokumentation** | [Dokumentations-Cache](/de/guide/translation-dashboard/documentation-cache) |
| Eine UI-Beschriftung korrigieren | **UI-Strings** | [UI-Strings & Plurale](/de/guide/translation-dashboard/ui-strings) |
| Eine Pluralform korrigieren (`one`, `other`, …) | **UI-Plurale** | [UI-Strings & Plurale](/de/guide/translation-dashboard/ui-strings) |
| Terminologie für die UI-Übersetzung sperren | **Glossar** | [Glossar](/de/guide/translation-dashboard/glossary) |
| Cache-Abdeckung und Modellnutzung anzeigen | **Statistiken** | [Statistiken](/de/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## Nach der Bearbeitung

| Sie haben bearbeitet… | Dann ausführen… | Vermeiden Sie… |
| --- | --- | --- |
| Dokumentations-Cache-Zeile | `sync --force-update` oder `translate-docs --force-update` | — |
| UI-String oder Plural | einfaches `sync` oder `translate-ui` | `--force` (überschreibt `user-edited`-Zeilen) |
| Glossar-Zeile | nächstes `translate-ui` oder `proofread-ui` | — |

**Dokumentation (SQLite-Cache)** – Manuelle Bearbeitungen werden im Cache mit dem Modell `user-edited` markiert. Wenn Sie `translate-docs` oder `sync` für eine unveränderte Quelle erneut ausführen, wird die zwischengespeicherte Übersetzung wiederverwendet (kein LLM-Aufruf). Führen Sie `sync --force-update` oder `translate-docs --force-update` aus, um das Markdown auf der Festplatte aus dem Cache zu aktualisieren. Verwenden Sie `--force` nur, wenn Sie den Cache umgehen und eine Neuübersetzung vom LLM wünschen (manuelle Korrekturen werden überschrieben).

**UI-Strings (`strings.json`)** – Manuelle Bearbeitungen werden in `models[locale]` mit `user-edited` markiert. Wenn Sie `translate-ui` oder `sync` erneut ausführen, werden Einträge übersprungen, die bereits eine Übersetzung haben. Verwenden Sie `--force` für UI-Befehle, um manuelle Korrekturen neu zu übersetzen und zu überschreiben.

<a id="tips"></a>
## Tipps

- **Log-Link-Schaltflächen** (🔗 in Tabellenzeilen) geben Datei:Zeilen-Hinweise an das **Terminal** aus, in dem `ai-i18n-tools dashboard` ausgeführt wird – nützlich, um vom Browser zu Ihrem Editor zu springen. Wenn Sie eine von VS Code abgeleitete IDE (wie Cursor, Antigravity, ...) verwenden, können Sie mit `CTRL`-Klick auf den Datei:Zeilen-Link im Terminalfenster die Datei an der angegebenen Zeile öffnen.
- **Schließen** (oben rechts in der Tableiste) fährt den Dashboard-Server ordnungsgemäß herunter.
- Wenn der Server stoppt, während die Browser-Registerkarte noch geöffnet ist, erscheint ein Overlay. Starten Sie `ai-i18n-tools dashboard` neu, um die Verbindung wiederherzustellen, oder schließen Sie das Fenster, wenn Sie mit dem Dashboard fertig sind.
