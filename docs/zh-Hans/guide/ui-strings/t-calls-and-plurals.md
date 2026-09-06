<a id="t-calls--plurals"></a>
# t() 调用与复数

<a id="using-t-in-source-code"></a>
## 在源代码中使用 `t()`

使用 **字面量字符串** 调用 `t()`，以便提取脚本能找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

同样的模式在 React 之外（Node.js、服务器组件、CLI）也适用：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**规则：**

- 仅提取这些形式：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 键必须是 **字面量字符串** —— 不能将变量或表达式作为键。
- 不要为键使用模板字面量：<code>{'t(`Hello ${name}`)'}</code> 无法提取。

<a id="interpolation"></a>
## 插值

对 <code v-pre>{{var}}</code> 占位符使用 i18next 原生的第二个参数插值：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

当第二个参数是普通对象字面量时，提取命令会解析 **第二个参数** 并读取仅供工具使用的标志，例如 `plurals: true` 和 `zeroDigit`（参见下文的 **基数复数**）。对于普通字符串，仅使用字面量键进行哈希处理；插值选项仍会在运行时传递给 i18next。

如果你的项目使用了自定义插值工具（例如调用 `t('key')` 然后通过模板函数处理结果，如 <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code>），`setupKeyAsDefaultT`（通过 `wrapI18nWithKeyTrim`）使得这变得不再必要——即使源语言环境返回原始键，它也会应用 <code v-pre>{{var}}</code> 插值。将调用点迁移到 <code v-pre>t('Hello {{name}}', { name })</code> 并移除自定义工具。

<a id="cardinal-plurals-plurals-true"></a>
## 基数复数 (`plurals: true`)

**你不需要手动编写复数形式。** 在源代码中，只需编写一次消息，并在第二个参数中传递两样东西：

1. **`plurals: true`** —— 告诉提取脚本和 `translate-ui` 此调用是一个基数复数组。
2. **`count`** —— i18next 在运行时用于选择正确形式的数字。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

这就是你在调用点所需的全部内容。你 **不需要** 自己定义 `_zero`、`_one`、`_other` 或任何其他后缀键。

当你运行 `translate-ui` 时，**ai-i18n-tools 会调用 LLM** 为每个目标语言环境生成所有必需的基数类别（`zero`、`one`、`two`、`few`、`many`、`other` —— 无论 `Intl.PluralRules` 对该语言有何要求）。模型接收你的原始字面量以及源语言的复数变体，然后返回翻译后的形式。工具将这些写入 `strings.json` 并输出扁平的 i18next JSON（`<groupId>_zero`、`<groupId>_one`、…），这样运行时复数解析无需你进行额外设置即可工作。

- `zeroDigit`（可选）—— 仅供工具使用；i18next **不会** 读取。当为 `true` 时，LLM 提示词会在存在该形式的每个语言环境的 `_zero` 字符串中优先使用字面阿拉伯数字 `0`；当为 `false` 或省略时，使用自然的零表述。在调用 `i18next.t` 之前剥离这些键（参见下文的 `wrapT`）。

**验证：** 如果消息包含 **两个或更多** 不同的 <code v-pre>{{…}}</code> 占位符，**其中一个必须是** <code v-pre>{{count}}</code>（复数轴）。否则 `extract` 会 **失败** 并给出明确的文件/行号消息。

在 LLM 返回 CLDR 形式后，`translate-ui` 还会根据 **原始开发者字面量** 检查每种形式：每个源占位符都必须出现在每个类别中（包括 `one`），形式不得发明新的 <code v-pre>{{…}}</code> / `%d` / `{n}` 标记，并且仅包含名词的源（没有 <code v-pre>{{count}}</code> 且没有数字，例如像 `Minutes` 这样的单位标签）必须保持仅名词。不匹配将丢弃该模型的响应，并重试备用列表中的下一个模型。

**两个独立的计数**（例如章节和页数）不能共享一个复数消息 —— 使用 **两个** `t()` 调用（每个调用带有 `plurals: true` 和各自的 `count`）并在 UI 中拼接。

**v1 版本中不支持：** 序数复数（`_ordinal_*`、`ordinal: true`）、区间复数、仅 ICU 的流水线。

<a id="how-plurals-are-stored-and-emitted"></a>
## 复数形式的存储与输出方式

**在** `strings.json` 中，复数组使用**每个哈希一行**，包含 `"plural": true`、`source` 中的原始字面量，以及 `translated[locale]` 作为一个对象，将基数类别（`zero`、`one`、`two`、`few`、`many`、`other`）映射到该区域设置的字符串。

**扁平化区域设置 JSON：** 非复数行保持为**源句子 → 翻译**。复数行输出为 `<groupId>_original`（等于 `source`，供参考）以及每个后缀的 `<groupId>_<form>`，以便 i18next 原生解析复数。`translate-ui` 还会写入 `{sourceLocale}.json`，其中**仅**包含复数扁平键（为源语言加载此捆绑包以便解析带后缀的键；普通字符串仍使用键作为默认值）。对于每个目标区域设置，输出的后缀键与该区域设置的 `Intl.PluralRules` (`requiredCldrPluralForms`) 匹配：如果 `strings.json` 在压缩后由于与另一个类别匹配而省略了某个类别（例如阿拉伯语 `many` 与 `other` 相同），`translate-ui` 仍会通过从回退的同级字符串复制，将每个所需的后缀写入扁平文件，从而确保运行时查找永远不会漏掉键。

运行时 (`ai-i18n-tools/runtime`)：**调用** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` —— 它运行 `wrapI18nWithKeyTrim`，注册可选的 `translate-ui` `{sourceLocale}.json` 复数捆绑包，然后使用 `buildPluralIndexFromStringsJson(stringsJson)` 执行 `wrapT`。`wrapT` 去除 `plurals` / `zeroDigit`，在需要时将键重写为组 ID，并转发 `count`（可选：如果存在单个非 <code v-pre>{{count}}</code> 占位符，`count` 将从该数字选项中复制）。参见 [连接 i18next](/zh-Hans/guide/ui-strings/i18next-runtime) 和 [运行时辅助函数](/zh-Hans/guide/runtime-helpers)。
