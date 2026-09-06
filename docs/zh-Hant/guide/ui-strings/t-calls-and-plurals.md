<a id="t-calls--plurals"></a>
# t() 呼叫與複數

<a id="using-t-in-source-code"></a>
## 在原始碼中使用 `t()`

使用 **字串字面值** 呼叫 `t()`，以便提取指令碼能夠找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

相同的模式在 React 之外（Node.js、伺服器元件、CLI）也適用：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**規則：**

- 只有這些形式會被提取：`t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`。
- 鍵值必須是 **字串字面值** — 不能使用變數或表達式作為鍵值。
- 請勿對鍵值使用範本字串：<code>{'t(`Hello ${name}`)'}</code> 無法被提取。

<a id="interpolation"></a>
## 插值

針對 <code v-pre>{{var}}</code> 佔位符，使用 i18next 原生的第二引數插值：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

當第二引數是純物件字面值時，提取指令會解析 **第二引數** 並讀取僅供工具使用的旗標，例如 `plurals: true` 與 `zeroDigit`（請參閱下方的 **基數複數**）。對於普通字串，只有字面值鍵值會用於雜湊；插值選項仍會在執行階段傳遞給 i18next。

如果您的專案使用自訂插值公用程式（例如呼叫 `t('key')`，然後將結果透過範本函式傳遞，如 <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>），`setupKeyAsDefaultT`（透過 `wrapI18nWithKeyTrim`）讓這變得不再必要 — 即使來源地區設定傳回原始鍵值，它也會套用 <code v-pre>{{var}}</code> 插值。請將呼叫端遷移至 <code v-pre>t('Hello {{name}}', { name })</code> 並移除自訂公用程式。

<a id="cardinal-plurals-plurals-true"></a>
## 基數複數 (`plurals: true`)

**您不需要手動撰寫複數形式。** 在原始碼中，只需撰寫一次訊息，並在第二引數中傳遞兩樣東西：

1. **`plurals: true`** — 告訴提取指令與 `translate-ui` 此呼叫是一個基數複數群組。
2. **`count`** — i18next 在執行階段用來挑選正確形式的數字。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

這就是您在呼叫端所需的一切。您 **不需要** 自行定義 `_zero`, `_one`, `_other` 或任何其他後綴鍵值。

當您執行 `translate-ui` 時，**ai-i18n-tools 會呼叫 LLM** 來為每個目標地區設定產生所有必要的基數類別（`zero`, `one`, `two`, `few`, `many`, `other` — 無論 `Intl.PluralRules` 對該語言有何要求）。模型會接收您的原始字面值以及來源語言的複數變體，然後傳回翻譯後的形式。工具會將這些寫入 `strings.json` 並輸出扁平的 i18next JSON（`<groupId>_zero`, `<groupId>_one`, …），這樣執行階段的複數解析就能運作，而您端無需額外設定。

- `zeroDigit`（可選）— 僅供工具使用；i18next **不會** 讀取。當 `true` 時，LLM 提示詞會在每個擁有該形式的地區設定中，偏好於 `_zero` 字串內使用阿拉伯數字 `0`；當 `false` 或省略時，則使用自然的零措辭。請在呼叫 `i18next.t` 之前移除這些鍵值（請參閱下方的 `wrapT`）。

**驗證：** 如果訊息包含 **兩個或更多** 不同的 <code v-pre>{{…}}</code> 佔位符，**其中一個必須是** <code v-pre>{{count}}</code>（複數軸）。否則 `extract` 會 **失敗** 並給出明確的檔案/行號訊息。

在 LLM 傳回 CLDR 形式後，`translate-ui` 也會根據 **原始開發者字面值** 檢查每個形式：每個來源佔位符都必須出現在每個類別中（包含 `one`），形式不得發明新的 <code v-pre>{{…}}</code> / `%d` / `{n}` 權杖，且僅名詞的來源（沒有 <code v-pre>{{count}}</code> 且沒有數字，例如像 `Minutes` 這樣的單位標籤）必須保持僅名詞。若不符，則會捨棄該模型的回應，並重試後備清單中的下一個模型。

**兩個獨立的計數**（例如章節與頁面）無法共用一個複數訊息 — 請使用 **兩個** `t()` 呼叫（每個呼叫都包含 `plurals: true` 與其各自的 `count`）並在 UI 中串接。

**v1 中未包含：** 序數複數 (`_ordinal_*`, `ordinal: true`)、區間複數、僅限 ICU 的管線。

<a id="how-plurals-are-stored-and-emitted"></a>
## 複數的儲存與輸出方式

**在** `strings.json` 中，複數群組使用 **每個雜湊一列**，包含 `"plural": true`、`source` 中的原始字面值，以及 `translated[locale]` 作為將基數類別（`zero`、`one`、`two`、`few`、`many`、`other`）對應至該地區設定字串的物件。

**扁平化地區設定 JSON：** 非複數列保持 **來源句子 → 翻譯**。複數列輸出為 `<groupId>_original`（等同於 `source`，供參考）以及每個後綴的 `<groupId>_<form>`，以便 i18next 原生解析複數。`translate-ui` 也會寫入 `{sourceLocale}.json`，其中包含 **僅有** 複數的扁平鍵（為來源語言載入此套件組合以解析帶後綴的鍵；純字串仍使用鍵作為預設值）。對於每個目標地區設定，輸出的後綴鍵符合該地區設定的 `Intl.PluralRules`（`requiredCldrPluralForms`）：如果 `strings.json` 因為在壓縮後與另一個類別相符而省略了某個類別（例如阿拉伯語的 `many` 與 `other` 相同），`translate-ui` 仍會透過從後備同層字串複製，將每個所需的後綴寫入扁平檔案中，確保執行時期查詢絕不會遺漏任何鍵。

執行時期（`ai-i18n-tools/runtime`）：**呼叫** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它會執行 `wrapI18nWithKeyTrim`，註冊選用的 `translate-ui` `{sourceLocale}.json` 複數套件組合，然後使用 `buildPluralIndexFromStringsJson(stringsJson)` 執行 `wrapT`。`wrapT` 會剝離 `plurals` / `zeroDigit`，在必要時將鍵重寫為群組 ID，並轉發 `count`（選用：如果有單一非 <code v-pre>{{count}}</code> 佔位符，`count` 會從該數值選項複製）。請參閱[連接 i18next](/zh-Hant/guide/ui-strings/i18next-runtime)與[執行時期輔助函式](/zh-Hant/guide/runtime-helpers)。
