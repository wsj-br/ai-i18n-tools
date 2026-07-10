<a id="t-calls--plurals"></a>
# t() 调用和复数

<a id="using-t-in-source-code"></a>
## 在源代码中使用 `t()`

使用 **字面字符串**调用 `t()`，以便提取脚本可以找到它：

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

在 React 之外（Node.js、服务器组件、CLI）也适用相同的模式：

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**规则：**

- 仅提取以下形式：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- 键必须是 **字面字符串** — 键不能是变量或表达式。
- 请勿对键使用模板字面量：<code>{'t(`Hello ${name}`)'}</code> 是不可提取的。

<a id="interpolation"></a>
## 插值

使用 i18next 原生第二参数插值来处理 <code v-pre>{{var}}</code> 占位符：

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extract 命令会解析 **第二个参数**（当它是一个纯粹的对象字面量时），并读取仅用于工具的标志，例如 `plurals: true` 和 `zeroDigit`（参见下文的 **基数复数**）。对于普通字符串，仅使用字面量键进行哈希处理；插值选项仍会在运行时传递给 i18next。

如果您的项目使用自定义插值实用程序（例如调用 `t('key')`，然后通过像 <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code> 这样的模板函数管道传输结果），`setupKeyAsDefaultT`（通过 `wrapI18nWithKeyTrim`）使其不再必要——即使源语言环境返回原始键，它也会应用 <code v-pre>{{var}}</code> 插值。将调用站点迁移到 <code v-pre>t('Hello {{name}}', { name })</code> 并删除自定义实用程序。

<a id="cardinal-plurals-plurals-true"></a>
## 基数复数 (`plurals: true`)

**您无需手动编写复数形式。** 在源代码中，只需编写一次消息，并在第二个参数中传递两项内容：

1. **`plurals: true`** — 告诉提取器和 `translate-ui` 此调用是一个基数复数组。
2. **`count`** — i18next 在运行时用于选择正确形式的数字。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

这就是您在调用站点所需要的一切。您**无需**自行定义 `_zero`、`_one`、`_other` 或任何其他后缀键。

当您运行 `translate-ui` 时，**ai-i18n-tools 会调用 LLM** 为每个目标语言环境生成所有必需的基数类别（`zero`、`one`、`two`、`few`、`many`、`other` — 任何 `Intl.PluralRules` 该语言所需的类别）。模型接收您的原始字面量和源语言复数变体，然后返回翻译后的形式。工具会将这些写入 `strings.json` 并发出扁平的 i18next JSON（`<groupId>_zero`、`<groupId>_one` 等），以便运行时复数解析无需您进行额外设置即可工作。

- `zeroDigit`（可选）— 仅限工具；i18next **不**读取。当 `true` 时，LLM 提示符倾向于在每个存在该形式的语言环境的 `_zero` 字符串中使用字面阿拉伯语 `0`；当 `false` 或省略时，使用自然零措辞。在调用 `i18next.t` 之前剥离这些键（参见下面的 `wrapT`）。

**验证：** 如果消息包含**两个或更多**不同的 <code v-pre>{{…}}</code> 占位符，则**其中一个必须是** <code v-pre>{{count}}</code>（复数轴）。否则 `extract` 将**失败**并显示清晰的文件/行消息。

**两个独立的计数**（例如，章节和页数）不能共享一个复数消息 — 使用 **两个** `t()` 调用（每个调用都带有 `plurals: true` 和其自己的 `count`）并在 UI 中连接。

**v1 中没有：** 序数复数（`_ordinal_*`、`ordinal: true`）、区间复数、仅 ICU 的管道。

<a id="how-plurals-are-stored-and-emitted"></a>
## 复数如何存储和发出

**在** `strings.json` 复数组中，使用 **每个哈希一行**，其中包含 `"plural": true`（原始字面量）、`source`（原始字面量），以及 `translated[locale]`（一个映射基数类别（`zero`、`one`、`two`、`few`、`many`、`other`）到该语言环境的字符串的对象）。

**扁平化语言环境 JSON：** 非复数行保持 **源句子 → 翻译**。复数行将输出为 `<groupId>_original`（等于 `source`，供参考）和 `<groupId>_<form>`（针对每个后缀），以便 i18next 原生解析复数。`translate-ui` 还会写入 `{sourceLocale}.json`，其中 **仅包含**复数扁平化键（加载此捆绑包以获取源语言，以便带后缀的键可以解析；纯字符串仍使用键作为默认值）。对于每个目标语言环境，输出的后缀键与该语言环境的 `Intl.PluralRules` 匹配（`requiredCldrPluralForms`）：如果 `strings.json` 省略了某个类别，因为它在压缩后与其他类别匹配（例如，阿拉伯语 `many` 与 `other` 相同），`translate-ui` 仍会通过从备用同级字符串复制来写入每个必需的后缀，以确保运行时查找永远不会错过键。

运行时 (`ai-i18n-tools/runtime`): **调用** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — 它运行 `wrapI18nWithKeyTrim`，注册可选的 `translate-ui` `{sourceLocale}.json` 复数包，然后使用 `buildPluralIndexFromStringsJson(stringsJson)` `wrapT`。`wrapT` 剥离 `plurals` / `zeroDigit`，在需要时将键重写为组 ID，并转发 `count`（可选：如果存在单个非 <code v-pre>{{count}}</code> 占位符，则从该数字选项复制 `count`）。请参阅 [Wire i18next](/zh-Hans/guide/ui-strings/i18next-runtime) 和 [Runtime helpers](/zh-Hans/guide/runtime-helpers)。

**旧环境：** `Intl.PluralRules` 是工具和保持行为一致所必需的；如果您的目标是旧版浏览器，请进行 polyfill。
