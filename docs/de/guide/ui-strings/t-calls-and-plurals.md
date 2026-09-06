<a id="t-calls--plurals"></a>
# t()-Aufrufe & Pluralformen

<a id="using-t-in-source-code"></a>
## Verwendung von `t()` im Quellcode

Rufen Sie `t()` mit einem **Literal-String** auf, damit das Extraktionsskript ihn finden kann:

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

Dasselbe Muster funktioniert auch außerhalb von React (Node.js, Serverkomponenten, CLI):

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**Regeln:**

- Nur diese Formen werden extrahiert: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`.
- Der Schlüssel muss ein **Literal-String** sein – keine Variablen oder Ausdrücke als Schlüssel.
- Verwenden Sie keine Template-Literale für den Schlüssel: <code>{'t(`Hello ${name}`)'}</code> ist nicht extrahierbar.

<a id="interpolation"></a>
## Interpolation

Verwenden Sie die native i18next-Interpolation des zweiten Arguments für <code v-pre>{{var}}</code>-Platzhalter:

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

Der Extraktionsbefehl parst das **zweite Argument**, wenn es ein einfaches Objektliteral ist, und liest nur für Tools bestimmte Flags wie `plurals: true` und `zeroDigit` (siehe **Kardinalpluralformen** unten). Für gewöhnliche Strings wird nur der Literal-Schlüssel zum Hashing verwendet; Interpolationsoptionen werden zur Laufzeit weiterhin an i18next weitergegeben.

Wenn Ihr Projekt ein benutzerdefiniertes Interpolations-Dienstprogramm verwendet (z. B. Aufruf von `t('key')` und anschließendes Weiterleiten des Ergebnisses durch eine Template-Funktion wie <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>), macht `setupKeyAsDefaultT` (über `wrapI18nWithKeyTrim`) dies überflüssig – es wendet die <code v-pre>{{var}}</code>-Interpolation an, selbst wenn das Quell-Locale den Rohschlüssel zurückgibt. Migrieren Sie Aufrufstellen zu <code v-pre>t('Hello {{name}}', { name })</code> und entfernen Sie das benutzerdefinierte Dienstprogramm.

<a id="cardinal-plurals-plurals-true"></a>
## Kardinalpluralformen (`plurals: true`)

**Sie schreiben Pluralformen nicht von Hand.** Im Quellcode schreiben Sie die Nachricht einmal und übergeben zwei Dinge im zweiten Argument:

1. **`plurals: true`** – teilt dem Extraktionsskript und `translate-ui` mit, dass dieser Aufruf eine kardinale Pluralgruppe ist.
2. **`count`** – die Zahl, die i18next zur Laufzeit verwendet, um die richtige Form auszuwählen.

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

Das ist alles, was Sie an der Aufrufstelle benötigen. Sie definieren **nicht** `_zero`, `_one`, `_other` oder andere Suffixschlüssel selbst.

Wenn Sie `translate-ui` ausführen, **ruft ai-i18n-tools ein LLM auf**, um jede erforderliche Kardinalkategorie für jedes Ziel-Locale zu generieren (`zero`, `one`, `two`, `few`, `many`, `other` – je nachdem, was `Intl.PluralRules` für diese Sprache erfordert). Das Modell erhält Ihr ursprüngliches Literal sowie die Pluralvarianten der Ausgangssprache und gibt dann die übersetzten Formen zurück. Das Tooling schreibt diese in `strings.json` und gibt flaches i18next-JSON aus (`<groupId>_zero`, `<groupId>_one`, …), sodass die Pluralauflösung zur Laufzeit ohne zusätzliche Einrichtung auf Ihrer Seite funktioniert.

- `zeroDigit` (optional) – nur für Tools; wird **nicht** von i18next gelesen. Wenn `true`, bevorzugt die LLM-Eingabeaufforderung ein wörtliches arabisches `0` im `_zero`-String für jedes Locale, in dem diese Form existiert; wenn `false` oder weggelassen, wird eine natürliche Null-Formulierung verwendet. Entfernen Sie diese Schlüssel, bevor Sie `i18next.t` aufrufen (siehe `wrapT` unten).

**Validierung:** Wenn die Nachricht **zwei oder mehr** unterschiedliche <code v-pre>{{…}}</code> Platzhalter enthält, **muss einer von ihnen** <code v-pre>{{count}}</code> sein (die plurale Achse). Andernfalls schlägt `extract` **fehl** mit einer klaren Datei-/Zeilenmeldung.

Nachdem das LLM CLDR-Formen zurückgegeben hat, prüft `translate-ui` auch jede Form gegen das **ursprüngliche Entwickler-Literal**: Jeder Quellplatzhalter muss in jeder Kategorie (einschließlich `one`) erscheinen, Formen dürfen keine neuen <code v-pre>{{…}}</code> / `%d` / `{n}`-Tokens erfinden, und nur-Substantiv-Quellen (kein <code v-pre>{{count}}</code> und keine Ziffern, z. B. Einheitenbezeichnungen wie `Minutes`) müssen nur-Substantiv bleiben. Bei Nichtübereinstimmungen wird die Antwort dieses Modells verworfen und das nächste Modell in der Fallback-Liste erneut versucht.

**Zwei unabhängige Zählungen** (z. B. Abschnitte und Seiten) können keine gemeinsame Pluralnachricht haben – verwenden Sie **zwei** `t()`-Aufrufe (jeder mit `plurals: true` und seinem eigenen `count`) und verketten Sie sie in der Benutzeroberfläche.

**Nicht in v1:** Ordnungspluralformen (`_ordinal_*`, `ordinal: true`), Intervallpluralformen, nur-ICU-Pipelines.

<a id="how-plurals-are-stored-and-emitted"></a>
## Wie Plurale gespeichert und ausgegeben werden

**In** `strings.json` verwenden Pluralgruppen **eine Zeile pro Hash** mit `"plural": true`, dem ursprünglichen Literal in `source` und `translated[locale]` als Objekt, das Kardinalkategorien (`zero`, `one`, `two`, `few`, `many`, `other`) den Zeichenfolgen für dieses Gebietsschema zuordnet.

**Flaches Locale-JSON:** Nicht-Plural-Zeilen bleiben **Quellsatz → Übersetzung**. Pluralzeilen werden als `<groupId>_original` (entspricht `source`, als Referenz) und `<groupId>_<form>` für jedes Suffix ausgegeben, sodass i18next Plurale nativ auflöst. `translate-ui` schreibt auch `{sourceLocale}.json`, das **nur** flache Plural-Schlüssel enthält (laden Sie dieses Bundle für die Quellsprache, damit suffigierte Schlüssel aufgelöst werden; einfache Zeichenfolgen verwenden weiterhin den Schlüssel als Standard). Für jedes Ziel-Locale stimmen die ausgegebenen Suffixschlüssel mit `Intl.PluralRules` für dieses Locale überein (`requiredCldrPluralForms`): Wenn `strings.json` eine Kategorie weggelassen hat, weil sie nach der Komprimierung mit einer anderen übereinstimmte (z. B. Arabisch `many` gleich `other`), schreibt `translate-ui` dennoch jedes erforderliche Suffix in die flache Datei, indem es von einer Fallback-Geschwisterzeichenfolge kopiert, sodass die Laufzeitsuche niemals einen Schlüssel verpasst.

Laufzeit (`ai-i18n-tools/runtime`): **Rufen Sie** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` auf – es führt `wrapI18nWithKeyTrim` aus, registriert das optionale `translate-ui` `{sourceLocale}.json` Plural-Bundle und dann `wrapT` unter Verwendung von `buildPluralIndexFromStringsJson(stringsJson)`. `wrapT` entfernt `plurals` / `zeroDigit`, schreibt den Schlüssel bei Bedarf in die Gruppen-ID um und leitet `count` weiter (optional: Wenn es einen einzelnen Nicht-<code v-pre>{{count}}</code>-Platzhalter gibt, wird `count` von dieser numerischen Option kopiert). Siehe [i18next verdrahten](/de/guide/ui-strings/i18next-runtime) und [Laufzeit-Helfer](/de/guide/runtime-helpers).
