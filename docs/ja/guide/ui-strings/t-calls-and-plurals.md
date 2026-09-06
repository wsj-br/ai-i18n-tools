<a id="t-calls--plurals"></a>
# t() 呼び出しと複数形

<a id="using-t-in-source-code"></a>
## ソースコードでの `t()` の使用

抽出スクリプトが見つけられるように、**リテラル文字列**を指定して `t()` を呼び出します。

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t('Save')}</button>;
}
```

同じパターンは React の外（Node.js、サーバーコンポーネント、CLI）でも機能します。

```js
import i18n from './i18n.js';
console.log(i18n.t('Processing complete'));
```

**ルール:**

- 抽出されるのは次の形式のみです: `t("…")`, `t('…')`, `t(`…`)`, `i18n.t("…")`。
- キーは **リテラル文字列**でなければなりません。変数や式をキーとして使用することはできません。
- キーにテンプレートリテラルを使用しないでください: <code>{'t(`Hello ${name}`)'}</code> は抽出できません。

<a id="interpolation"></a>
## 補間

<code v-pre>{{var}}</code> プレースホルダーには、i18next のネイティブな第2引数の補間を使用します。

```js
// i18next handles substitution natively, even in key-as-default mode
t('Hello {{name}}, you have {{count}} messages', { name, count })
// → "Hello Alice, you have 3 messages"
```

抽出コマンドは、**第2引数**がプレーンなオブジェクトリテラルである場合にそれを解析し、`plurals: true` や `zeroDigit` などのツール専用フラグを読み取ります（下記の **基数複数形**を参照）。通常の文字列の場合、ハッシュ化にはリテラルキーのみが使用されますが、補間オプションは実行時に i18next に引き渡されます。

プロジェクトでカスタム補間ユーティリティを使用している場合（例: `t('key')` を呼び出し、その結果を <code v-pre>interpolateTemplate(t('Hello {{name}}'), { name })</code> のようなテンプレート関数に渡す）、`setupKeyAsDefaultT`（`wrapI18nWithKeyTrim` 経由）を使用すればその必要はありません。ソースロケールが生のキーを返す場合でも、<code v-pre>{{var}}</code> 補間が適用されます。呼び出し箇所を <code v-pre>t('Hello {{name}}', { name })</code> に移行し、カスタムユーティリティを削除してください。

<a id="cardinal-plurals-plurals-true"></a>
## 基数複数形 (`plurals: true`)

**複数形を手動で記述する必要はありません。** ソースコードでは、メッセージを1回記述し、第2引数に2つのものを渡します。

1. **`plurals: true`** — この呼び出しが基数複数形グループであることを抽出ツールと `translate-ui` に伝えます。
2. **`count`** — 実行時に i18next が適切な形式を選択するために使用する数値です。

```tsx
{t('{{count}} items in your cart', { plurals: true, count: n })}
```

これが、呼び出し箇所で必要なすべてです。`_zero`, `_one`, `_other` などのサフィックスキーやその他のキーを自身で定義する必要は **ありません**。

`translate-ui` を実行すると、**ai-i18n-tools は LLM を呼び出し**、各ターゲットロケールに必要なすべての基数カテゴリ（`zero`, `one`, `two`, `few`, `many`, `other` — その言語で `Intl.PluralRules` が必要とするもの）を生成します。モデルは元のリテラルとソース言語の複数形バリアントを受け取り、翻訳された形式を返します。ツールはこれらを `strings.json` に書き込み、フラットな i18next JSON（`<groupId>_zero`, `<groupId>_one`, …）を出力するため、実行時の複数形解決は追加の設定なしで機能します。

- `zeroDigit` (オプション) — ツール専用であり、i18next によって **読み取られません**。`true` の場合、LLM プロンプトはその形式が存在する各ロケールの `_zero` 文字列内でリテラルのアラビア数字 `0` を優先します。`false` の場合や省略された場合は、自然なゼロの表現が使用されます。`i18next.t` を呼び出す前にこれらのキーを削除してください（下記の `wrapT` を参照）。

**検証:** メッセージに **2つ以上**の異なる <code v-pre>{{…}}</code> プレースホルダーが含まれている場合、**そのうちの1つは** <code v-pre>{{count}}</code> （複数形の軸）でなければなりません。そうでない場合、`extract` は明確なファイル/行メッセージと共に **失敗**します。

LLM が CLDR 形式を返した後、`translate-ui` は各形式を **元の開発者リテラル**に対してチェックします。すべてのソースプレースホルダーがすべてのカテゴリ（`one` を含む）に含まれていなければならず、形式で新しい <code v-pre>{{…}}</code> / `%d` / `{n}` トークンをでっち上げてはならず、名詞のみのソース（<code v-pre>{{count}}</code> がなく、数字もないもの、例えば `Minutes` のような単位ラベル）は名詞のみのままでなければなりません。不一致の場合はそのモデルのレスポンスを破棄し、フォールバックリストの次のモデルで再試行します。

**2つの独立したカウント**（例: セクションとページ）は1つの複数形メッセージを共有できません。**2つの** `t()` 呼び出し（それぞれに `plurals: true` と独自の `count` を持つ）を使用し、UIで結合してください。

**v1では対応していません:** 序数複数形 (`_ordinal_*`, `ordinal: true`)、区間複数形、ICU 専用パイプライン。

<a id="how-plurals-are-stored-and-emitted"></a>
## 複数形の保存と出力の仕組み

**では**、`strings.json` 複数形グループは**ハッシュごとに1行**を使用し、`"plural": true`、`source`内の元のリテラル、および`translated[locale]`を基数カテゴリ（`zero`、`one`、`two`、`few`、`many`、`other`）からそのロケールの文字列へのマッピングを行うオブジェクトとして保持します。

**フラットなロケールJSON:** 非複数形の行は**元の文 → 翻訳**のままです。複数形の行は`<groupId>_original`（参考として`source`と等しい）および各サフィックスに対する`<groupId>_<form>`として出力され、i18nextがネイティブに複数形を解決できるようにします。`translate-ui`はまた、**複数形のフラットキーのみ**を含む`{sourceLocale}.json`を書き出します（サフィックス付きキーが解決されるように、ソース言語用にこのバンドルを読み込みます。プレーン文字列は引き続きキーをデフォルトとして使用します）。各ターゲットロケールについて、出力されるサフィックスキーはそのロケールの`Intl.PluralRules`（`requiredCldrPluralForms`）に一致します。`strings.json`がコンパクション後に別のカテゴリと一致したためにカテゴリを省略した場合（例: アラビア語の`many`は`other`と同じ）、`translate-ui`はフォールバックする兄弟文字列からコピーすることで、必要なすべてのサフィックスをフラットファイルに書き出し、ランタイムのルックアップでキーの欠落が発生しないようにします。

ランタイム (`ai-i18n-tools/runtime`): **呼び出し** `setupKeyAsDefaultT(i18n, { stringsJson, sourcePluralFlatBundle })` — これは`wrapI18nWithKeyTrim`を実行し、オプションの`translate-ui` `{sourceLocale}.json`複数形バンドルを登録してから、`buildPluralIndexFromStringsJson(stringsJson)`を使用して`wrapT`します。`wrapT`は`plurals` / `zeroDigit`を削除し、必要に応じてキーをグループIDに書き換え、`count`を転送します（オプション: <code v-pre>{{count}}</code>以外のプレースホルダーが1つしかない場合、`count`はその数値オプションからコピーされます）。[i18nextの接続](/ja/guide/ui-strings/i18next-runtime)と[ランタイムヘルパー](/ja/guide/runtime-helpers)を参照してください。
