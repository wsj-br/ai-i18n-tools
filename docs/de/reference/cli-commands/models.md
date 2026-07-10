<a id="cli--models--catalog"></a>
# CLI – Modelle & Katalog

<a id="check-models"></a>
### `check-models`

**Zusammenfassung:** `ai-i18n-tools check-models`

Überprüfen Sie jede konfigurierte Modell-ID gegen die `GET /models`-Liste des aktiven Anbieters (Mitgliedschaft und `expiration_date`). Erfordert den API-Schlüssel des Anbieters (keinen für schlüssellose Anbieter wie Ollama). Beendet mit einem von Null verschiedenen Exit-Status, wenn eine konfigurierte ID fehlt oder abgelaufen ist, und berücksichtigt die `requestTimeoutMs` des Anbieters. Wenn der Anbieter Preise zurückgibt (z. B. OpenRouter), zeigt er auch den USD-Preis pro 1 Mio. Token für Prompt/Ausführung an.

**Siehe auch:** [LLM-Provider](/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**Zusammenfassung:** `ai-i18n-tools list-models`

Listet alle Modelle auf, die der aktive Provider über seine `GET /models`-Liste anbietet (sortiert nach ID; der aktive Provider folgt dem Konfigurationsschlüssel `provider`, Überschreiben mit `-P` / `--provider`). Erfordert den API-Schlüssel des Providers (keinen für schlüssellose Provider wie Ollama). Wenn der Provider Preise zurückgibt (z. B. OpenRouter), zeigt es auch den USD-Preis pro 1 Mio. Token für Prompt/Vervollständigung an und markiert Einträge, die älter als `expiration_date` sind.

**Schlüsseloptionen:** `-P` / `--provider`

**Siehe auch:** [LLM-Provider](/guide/providers-and-models)

---

<a id="bench-models"></a>
### `bench-models`

**Zusammenfassung:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

Benchmarkt jedes konfigurierte Modell, indem es eine Probe in Isolation übersetzt (Single-Modell-Client, keine Fallback-Kette). Gibt eine Tabelle mit Modell-ID, Eingabe-/Ausgabetoken, Wanduhr-Übersetzungszeit und USD-Kosten aus (`—` für Provider, die keine Kosten melden), sowie eine Zeile mit den Gesamtwerten und pro-Modell-Fehlern.

Modelle standardmäßig auf die Vereinigung der `translationModels`-, `uiModels`- und `localeModels`-IDs des aktiven Providers (Überschreiben mit `--model`); die Probe standardmäßig auf einen eingebauten englischen Markdown-Block (Überschreiben mit `--text` / `--file`); Quelle/Ziel standardmäßig auf die Konfiguration `sourceLocale` und die erste `docs[]`-Ziel-Lokale, Fallback auf die oberste Ebene `targetLocales` (Überschreiben mit `--source` / `--target`). Führt Modelle parallel aus, begrenzt durch die Konfiguration `concurrency` (Standard 4); jedes Modell wird dennoch individuell zeitlich bemessen. Erfordert den API-Schlüssel des aktiven Providers.

**Schlüsseloptionen:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**Zusammenfassung:** `ai-i18n-tools list-languages [search]`

Listet den mitgelieferten UI-Sprachenkatalog (`data/ui-languages-complete.json`) als lesbare Tabelle (Code, Textrichtung, englischer Name, natürlicher Name) auf. Benötigt keine Konfiguration oder API-Schlüssel. Optional kann ein `search`-Term übergeben werden, um nur Einträge zu behalten, deren Code, natürlicher Name, englischer Name oder Richtung ihn enthalten (groß-/kleinschreibungsunabhängig), z. B. `list-languages portuguese`, `list-languages rtl`, `list-languages zh`.
