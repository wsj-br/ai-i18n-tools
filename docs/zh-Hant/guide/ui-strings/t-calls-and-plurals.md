<a id="t-calls--plurals"></a>
# t() 呼叫與複數

<a id="using-t-in-source-code"></a>
## 在原始碼中使用 `t()`

使用 **字面字串**呼叫 `t()`，以便提取腳本可以找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

相同的模式也適用於 React 之外的環境（Node.js、伺服器元件、CLI）：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**規則：**

- 僅提取這些形式：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 鍵必須是 **字面字串** — 鍵不能是變數或表達式。
- 請勿為鍵使用模板字面值：<code>{'t(`Hello ${name}`)'}</code> 無法提取。

<a id="interpolation"></a>
## 內插

對於 <code v-pre>{{var}}</code> 預留位置，請使用 i18next 原生的第二個引數內插：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令會解析 **第二個參數**（當它是一個純物件字面量時），並讀取僅限工具使用的旗標，例如 `plurals: true` 和 `zeroDigit`（請參閱下方的 **基數複數**）。對於普通字串，僅使用字面鍵進行雜湊；插值選項仍會在執行階段傳遞給 i18next。

如果您的專案使用自訂內插公用程式（例如呼叫 `t('key')`，然後透過範本函數（如 <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>）傳遞結果），則 `setupKeyAsDefaultT`（透過 `wrapI18nWithKeyTrim`）使其變得不必要 — 即使原始語言環境傳回原始鍵，它也會應用 <code v-pre>{{var}}</code> 內插。將呼叫站點遷移到 <code v-pre>t('Hello {{name}}', { name })</code> 並移除自訂公用程式。

<a id="cardinal-plurals-plurals-true"></a>
## 基數複數 (`plurals: true`)

**您無需手動編寫複數形式。** 在原始碼中，只需編寫一次訊息，並在第二個引數中傳遞兩件事：

1. **`plurals: true`** — 告知提取和 `translate-ui` 此呼叫是一個基數複數群組。
2. **`count`** — i18next 在執行時用於選擇正確形式的數字。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

這就是您在呼叫站點所需的一切。您**無需**自行定義 `_zero`、`_one`、`_other` 或任何其他後綴鍵。

當您執行 `translate-ui` 時，**ai-i18n-tools 會呼叫 LLM** 為每個目標語言環境（`zero`、`one`、`two`、`few`、`many`、`other` — 任何 `Intl.PluralRules` 該語言所需的）生成所有必需的基數類別。模型會接收您的原始文字以及原始語言的複數變體，然後傳回翻譯後的格式。工具會將這些寫入 `strings.json` 並發出扁平的 i18next JSON（`<groupId>_zero`、`<groupId>_one` 等），以便在您這邊無需額外設定即可進行執行時複數解析。

- `zeroDigit`（可選）— 僅限工具；i18next **不**讀取。當 `true` 時，LLM 提示會優先在每個存在該形式的語言環境的 `_zero` 字串中使用文字阿拉伯數字 `0`；當 `false` 或省略時，則使用自然零措辭。在呼叫 `i18next.t` 之前移除這些鍵（請參閱下面的 `wrapT`）。

**驗證：** 如果訊息包含**兩個或更多**不同的 <code v-pre>{{…}}</code> 預留位置，則**其中一個必須是** <code v-pre>{{count}}</code>（複數軸）。否則，`extract` 會**失敗**並顯示清晰的檔案/行訊息。

**兩個獨立的計數**（例如章節和頁數）不能共用一個複數訊息 — 請使用 **兩個** `t()` 呼叫（每個都帶有 `plurals: true` 和其自己的 `count`）並在 UI 中串連。

**v1 中沒有：** 序數複數（`_ordinal_*`、`ordinal: true`）、區間複數、僅限 ICU 的管道。

<a id="how-plurals-are-stored-and-emitted"></a>
## 複數的儲存和發出方式

**在** `strings.json` 複數群組中使用 **每個雜湊一個列**，其中包含 `"plural": true`（原始字面值，位於 `source` 中）以及一個物件 `translated[locale]`，該物件將基數類別（`zero`、`one`、`two`、`few`、`many`、`other`）對應到該語言環境的字串。

**平面化語言環境 JSON：** 非複數列仍為 **來源句子 → 翻譯**。複數列會輸出為 `<groupId>_original`（等於 `source`，供參考）和 `<groupId>_<form>`，每個後綴對應一個字串，以便 i18next 原生解析複數。`translate-ui` 也會寫入 `{sourceLocale}.json`，其中 **僅包含**複數的平面化鍵（載入此捆綁包以取得來源語言，以便後綴鍵能夠解析；純字串仍使用鍵作為預設值）。對於每個目標語言環境，輸出的後綴鍵會符合該語言環境的 `Intl.PluralRules`（`requiredCldrPluralForms`）：如果 `strings.json` 省略了某個類別，因為它在壓縮後與另一個類別匹配（例如，阿拉伯語的 `many` 與 `other` 相同），`translate-ui` 仍會將每個必需的後綴寫入平面化檔案，方法是從備用同級字串複製，這樣執行階段查找就不會遺漏任何鍵。

執行時 (`ai-i18n-tools/runtime`): **呼叫** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它會執行 `wrapI18nWithKeyTrim`，註冊可選的 `translate-ui` `{sourceLocale}.json` 複數套件，然後使用 `buildPluralIndexFromStringsJson(stringsJson)` 執行 `wrapT`。`wrapT` 會移除 `plurals` / `zeroDigit`，在需要時將鍵重寫為群組 ID，並轉發 `count` (可選：如果只有一個非 <code v-pre>{{count}}</code> 預留位置，則從該數字選項複製 `count`)。請參閱 [Wire i18next](/zh-Hant/guide/ui-strings/i18next-runtime) 和 [Runtime helpers](/zh-Hant/guide/runtime-helpers)。

**舊版環境：** `Intl.PluralRules` 是工具和一致行為所必需的；如果您的目標是極舊的瀏覽器，請進行 polyfill。
