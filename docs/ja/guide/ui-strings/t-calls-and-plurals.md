<a id="t-calls--plurals"></a>
# t() の呼び出しと複数形

<a id="using-t-in-source-code"></a>
## ソースコードでの `t()` の使用

抽出スクリプトが検出できるように、`t()` には **リテラル文字列**を渡してください。

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

このパターンはReactの外（Node.js、サーバーコンポーネント、CLI）でも同様に使用できます。

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**ルール：**

- 抽出されるのは、以下の形式のみです：`t("…")`、`t('…')`、`t(`…`)`、`i18n.t("…")`。
- キーは**リテラル文字列**でなければなりません。変数や式をキーとして使用しないでください。
- キーにテンプレートリテラルを使用しないでください：<code>{'t(`Hello ${name}`)'}</code>は抽出できません。

<a id="interpolation"></a>
## 補間

<code v-pre>{{var}}</code> プレースホルダーには、i18next のネイティブな第 2 引数補間を使用します。

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

extractコマンドは、第**2引数**が単純なオブジェクトリテラルである場合にそれを解析し、`plurals: true`や`zeroDigit`といったツール用途専用のフラグを読み取ります（下記の**基数複数形**を参照）。通常の文字列では、ハッシュ化にはリテラルキーのみが使用されます。インターポレーションのオプションは実行時にi18nextに引き渡されます。

プロジェクトでカスタム補間ユーティリティを使用している場合（例: `t('key')` を呼び出し、その結果を <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code> のようなテンプレート関数でパイプ処理する場合）、`setupKeyAsDefaultT`（`wrapI18nWithKeyTrim` 経由）はそれを不要にします。ソースロケールが生のキーを返す場合でも、<code v-pre>{{var}}</code> 補間を適用します。呼び出しサイトを <code v-pre>t('Hello {{name}}', { name })</code> に移行し、カスタムユーティリティを削除してください。

<a id="cardinal-plurals-plurals-true"></a>
## 基数複数形 (`plurals: true`)

**複数形を手動で記述することはありません。** ソースコードでは、メッセージを一度記述し、第 2 引数に次の 2 つを渡します。

1. **`plurals: true`** — 抽出と `translate-ui` に、この呼び出しが基数複数形グループであることを伝えます。
2. **`count`** — i18next が実行時に適切な形式を選択するために使用する数値。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

呼び出しサイトで必要なのはこれだけです。`_zero`、`_one`、`_other`、またはその他のサフィックスキーを**自分で**定義することはありません。

`translate-ui` を実行すると、**ai-i18n-tools は LLM を呼び出し**、各ターゲットロケールに必要なすべての基数カテゴリ（`zero`、`one`、`two`、`few`、`many`、`other` — その言語で `Intl.PluralRules` が要求するもの）を生成します。モデルは元のリテラルとソース言語の複数形バリアントを受け取り、翻訳された形式を返します。ツールはそれらを `strings.json` に書き込み、フラットな i18next JSON（`<groupId>_zero`、`<groupId>_one` など）を出力するため、実行時の複数形解決は、あなたの側で追加の設定なしで機能します。

- `zeroDigit` (オプション) — ツール専用。i18next では**読み込まれません**。`true` の場合、LLM プロンプトは、その形式が存在する各ロケールで `_zero` 文字列にリテラルなアラビア語の `0` を優先します。`false` または省略された場合、自然なゼロの表現が使用されます。`i18next.t` を呼び出す前にこれらのキーを削除します（以下の `wrapT` を参照）。

**検証:** メッセージに **2 つ以上**の異なる <code v-pre>{{…}}</code> プレースホルダーが含まれている場合、**そのうちの 1 つは** <code v-pre>{{count}}</code>（複数形の軸）でなければなりません。そうでない場合、`extract` は明確なファイル/行メッセージとともに**失敗します**。

**2つの独立したカウント**（例：セクションとページ）は、1つの複数形メッセージを共有できません。**2つ**の`t()`呼び出しを使用し（それぞれ`plurals: true`と独自の`count`付き）、UIで連結してください。

**v1 では使用できません：** 序数の複数形（`_ordinal_*`、`ordinal: true`）、区間複数形、ICU 専用パイプライン。

<a id="how-plurals-are-stored-and-emitted"></a>
## 複数形の保存と出力方法

**この** `strings.json` 複数のグループは **ハッシュごとに1行**を使用し、`"plural": true`、元のリテラル `source`、および `translated[locale]` をオブジェクトとして、基数カテゴリ（`zero`、`one`、`two`、`few`、`many`、`other`）をそのロケールの文字列にマッピングします。

**フラットなロケールJSON：**非複数形の行は**原文 → 翻訳**のままです。複数形の行は、i18nextが複数形をネイティブに解決できるように、`<groupId>_original`（参照用に`source`に等しい）および各接尾辞の`<groupId>_<form>`として出力されます。`translate-ui`はまた、**複数形のフラットキーのみ**を含む`{sourceLocale}.json`も出力します（ソース言語用にこのバンドルを読み込んで、接尾辞付きキーが解決されるようにします。通常の文字列は引き続きキーをデフォルトとして使用します）。各ターゲットロケールに対して、出力される接尾辞キーはそのロケールの`Intl.PluralRules`に一致します（`requiredCldrPluralForms`）。`strings.json`がコンパクション後に一致するためカテゴリを省略した場合（例：アラビア語の`many`が`other`と同じ）でも、`translate-ui`はフォールバックとなる兄弟文字列からコピーすることで、実行時のルックアップがキーを欠落しないように、必要なすべての接尾辞をフラットファイルに書き出します。

ランタイム (`ai-i18n-tools/runtime`): `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` を**呼び出します** — これは `wrapI18nWithKeyTrim` を実行し、オプションの `translate-ui` `{sourceLocale}.json` 複数形バンドルを登録し、`buildPluralIndexFromStringsJson(stringsJson)` を使用して `wrapT` を実行します。`wrapT` は `plurals` / `zeroDigit` を削除し、必要に応じてキーをグループ ID に書き換え、`count` を転送します (オプション: <code v-pre>{{count}}</code> 以外のプレースホルダーが 1 つだけの場合、`count` はその数値オプションからコピーされます)。[i18next の配線](/ja/guide/ui-strings/i18next-runtime) および [ランタイムヘルパー](/ja/guide/runtime-helpers) を参照してください。

**古い環境：** ツールや一貫性のある動作のために `Intl.PluralRules` が必要です。非常に古いブラウザを対象にする場合は、ポリフィルを使用してください。
