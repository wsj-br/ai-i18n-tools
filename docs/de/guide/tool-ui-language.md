<a id="tool-ui-language"></a>
# Sprache der Tool-Benutzeroberfläche

Das `ai-i18n-tools` lokalisiert seine eigene Benutzeroberfläche – CLI-Hilfetexte, häufig verwendete Protokoll-/Zusammenfassungs-/Fehlermeldungen und das Übersetzungs-Dashboard – unabhängig von der `sourceLocale` / `targetLocales` Ihres Projekts. Es ist keine Konfiguration erforderlich: Standardmäßig folgt das Tool dem Gebietsschema Ihres Betriebssystems.

<a id="locale-resolution"></a>
## Gebietsschema-Auflösung

Das UI-Gebietsschema wird aus diesen Quellen aufgelöst, wobei die höchste Priorität zuerst gilt:

1. `-L` / `--ui-lang <code>` globale Flagge (z. B. `-L pt-BR`).
2. `AI_I18N_LANG` Umgebungsvariable (z. B. `export AI_I18N_LANG=es`).
3. Der `uiLanguage` Konfigurationsschlüssel in `ai-i18n-tools.config.json` (BCP-47-String).
4. Das Host-Betriebssystem-Locale (über `Intl.DateTimeFormat().resolvedOptions().locale`).

<a id="matching-and-fallback"></a>
## Abgleich und Fallback

Die angeforderte Lokale wird genau oder durch die nächste Variation (z. B. `pt-PT` wird zu `pt-BR`, und `en-US` wird zu `en-GB`) mit den mitgelieferten Benutzeroberflächen-Sprachen abgeglichen; wenn nichts übereinstimmt, wird auf die Quellsprachlocale (`en-GB`) zurückgegriffen. Wenn eine Benutzeroberflächen-Sprache explizit angefordert wird (über die Flag, Umgebungsvariable oder `uiLanguage`), aber kein mitgeliefertes Paket übereinstimmt, gibt die CLI eine einmalige Warnung aus, dass die Standard-Lokale verwendet wird; eine Lokale, die nur aus dem Host-Betriebssystem abgeleitet wird, warnt nie.

<a id="shipped-ui-languages"></a>
## Verfügbare UI-Sprachen

Englisch (UK, Quelle), Deutsch, Spanisch, Französisch, Hindi (lateinische Schrift), Japanisch, Koreanisch, Portugiesisch (Brasilien), Chinesisch (vereinfacht), Chinesisch (traditionell).

<a id="translation-dashboard"></a>
## Übersetzungs-Dashboard

Das Übersetzungs-Dashboard liest das aufgelöste Gebietsschema, die Layout-Richtung und das Übersetzungs-Bundle von `GET /api/ui-i18n` und wendet sie beim Laden an (es setzt `<html lang>` / `dir` und lokalisiert statisches Markup über `data-i18n*`-Attribute).

<a id="related"></a>
## Verwandt

- [`AI_I18N_LANG`](/de/reference/environment-variables) – Überschreibung der Umgebungsvariablen
- [`uiLanguage`](/de/reference/configuration#uilanguage-optional) – Überschreibung des Konfigurationsschlüssels
- [`-L` / `--ui-lang`](/de/reference/cli-commands/) – Überschreibung des CLI-Flags (höchste Priorität)
