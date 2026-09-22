<a id="migrating-from-intlayer"></a>
# Intlayerからの移行

[Intlayer](https://intlayer.org/) から移行しますか？このコマンドは、既存の翻訳辞書と、アプリ内での最もシンプルな翻訳の利用を ai-i18n-tools に取り込みます。安全な更新を自動的に行い、その後、まだ対応が必要な項目について分かりやすいレポートを作成します。これにより、すべての違いを事前に理解する必要なく、段階的に移行を進めることができます。

すでに i18next の JSON 翻訳ファイルを使用していますか？この移行コマンドは不要です。代わりに [JSON パイプライン](/ja/guide/json#i18next-namespace-files) を使用してください。

<a id="what-migrate-intlayer-does"></a>
## `migrate-intlayer`の機能

1. `*.content.ts`のデフォルトエクスポートを解析します（`key` + `content` + `t({ locale: '…' })`の葉）。
2. ソースロケールのテキストと辞書にすでにある翻訳から、`ui.stringsJson`および`ui.flatOutputDir`配下のロケールごとのファイルにシードします。インポートされた行には`models`フィールドがありません（今回の実行では機械翻訳されていません）。
3. **安全**な呼び出しサイトを書き換えます：
   - `binding.path.to.leaf.value` → `t('English source')`
   - `binding.path.value.replace('{token}', expr)` → <code v-pre>t('English {{token}}', { token: expr })</code>
4. その他のすべて（動的キー、JSXスプレッド、連鎖する`.replace().replace()`、分割代入）はそのままにします。レポートには、それらの各サイトについて、正確な式、具体的な`t()`またはJSXの置換、および追加する`import { t } from '…';`行がリストされます。
5. デフォルトではドライランです。カタログのシードと安全な書き換えを適用するには、`--write`を渡します。レポートは常に書き込まれます。また、手動での書き換え後に削除する残った`useIntlayer` / `IntlayerProvider`の使用や辞書ファイル、まだ`extract`と`translate-ui`が必要なカタログキー、そしてアプリのi18nモジュールに貼り付けるランタイムブートストラップもリストされます。

<a id="migrate-your-project"></a>
## プロジェクトの移行

1. `ai-i18n-tools` をインストールします（[インストール](/ja/guide/installation)を参照）。プロジェクトにまだ `ai-i18n-tools.config.json` がない場合は、スキャフォールドを生成します。

   ```bash
   ai-i18n-tools init [-P <provider>]
   ```

`sourceLocale`と`targetLocales`を編集して、Intlayer辞書に既に存在するロケールと一致させ、`ui.sourceRoots`、`ui.stringsJson`、`ui.flatOutputDir`を設定して、アプリのソースおよび目的のカタログパスを指すようにします。これは`translate-ui`が使用するのと同じキーです。[UI文字列 — ステップ1: 初期化](/ja/guide/ui-strings/#step-1-initialise)を参照してください。
2. まずドライランを実行します: `ai-i18n-tools migrate-intlayer`（`--write`なし）。`migrate-intlayer-report.md`を読んで、何が見つかるか、およびファイル変更前にどの呼び出し箇所を手動でレビューする必要があるかを確認します。
3. `ai-i18n-tools migrate-intlayer --write`を実行して`ui.stringsJson` / `ui.flatOutputDir`をシードし、安全な呼び出し箇所を書き換えます。
4. 再生成されたレポート`migrate-intlayer-report.md`をAIコーディングエージェントに渡す（推奨）か、以下の手順に従って自分で作業します:

- レポートの最後には**ステップバイステップのTODO**があります: そこに示されている具体的な`t('…')`/JSXを使用して各手動レビュー箇所を完了し、`import { t } from '…';`行を追加し、その後、レポートにリストされている残りの`*.content.ts`ファイルと`useIntlayer` / `IntlayerProvider`の使用箇所を削除します。
   - レポートのランタイムブートストラップをアプリのi18nモジュールに貼り付けます。ロケール制御で、`loadLocale(next)`を呼び出してから`i18n.changeLanguage(next)`を呼び出します。`loadLocale`はフラットバンドルを登録するだけで、アクティブな言語は切り替えません。
   - レポートで新規としてマークされているソース文字列に対して、`ai-i18n-tools extract`を実行してから`ai-i18n-tools translate-ui`（または`sync`）を実行します。`extract`はブートストラップがインポートする`ui-languages.json`も書き込むため、新しい文字列が追加されていない場合でも、アプリを起動する前に実行してください。`strings.json`、フラットロケールファイル、または`ui-languages.json`を手動で編集しないでください。それらはこれらのコマンドが管理しています。
   - レポートのクリーンアップリストが完了し、アプリがai-i18n-tools上で実行されたら、`intlayer` / `react-intlayer`の依存関係と辞書ファイルを削除します。

<a id="run-the-example"></a>
## サンプルを実行する

上記の手順は、あらゆる Intlayer プロジェクトに適用されます。[intlayer-migration](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-migration) の例では、基本的な（自動書き換え可能な）ケースと複雑な（手動レビューが必要な）ケースを含む小規模な Vite + React アプリでこれらの手順を順に説明しており、自身のコードで試す前にレポートとランタイムブートストラップを確認できます。`intlayer-pristine/` が変更されることはなく、`src/` が作業用コピーです。

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-migration intlayer-migration
cd intlayer-migration
pnpm install
pnpm reset
pnpm migrate:dry
pnpm migrate:write
```

`migrate-intlayer-report.md`をAIコーディングエージェントに渡します（またはフラグが立てられたファイルを自分で編集します）。レポートには、`src/i18n.ts`に貼り付けるランタイムモジュールが含まれています。ロケールコントロールで、`loadLocale(next)`を呼び出してから`i18n.changeLanguage(next)`を呼び出します。`loadLocale`はフラットバンドルのみを登録します。

```bash
pnpm i18n:sync
pnpm dev
```

`pnpm i18n:sync` は最初に `extract` を実行し、`ui-languages.json` を書き込みます。ブートストラップはそのファイルをインポートするため、抽出後にアプリを起動してください。`strings.json`、フラットロケールファイル、または `ui-languages.json` を手動で編集しないでください。

`pnpm reset`は`intlayer-pristine/`を`src/`にコピーし直し、生成されたカタログをクリアして、やり直せるようにします。

完全なウォークスルー：[examples/intlayer-migration/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-migration/README.md)。

<a id="command"></a>
## コマンド

```bash
ai-i18n-tools migrate-intlayer [paths...] [--write] [--report <path>] [--content-glob <glob>] [--t-import <specifier>]
```

設定に`ui.stringsJson`と`ui.flatOutputDir`が必要です（`translate-ui`と同じ）。LLMは呼び出しません。

| オプション | 意味 |
| --- | --- |
| `[paths...]` | スキャン対象のファイル/ディレクトリ/グロブ（デフォルト：`ui.sourceRoots`） |
| `--write` | カタログのシードと安全な呼び出し箇所の書き換えを実行（デフォルト：ドライラン） |
| `--report <path>` | レポートのパス（デフォルト：`migrate-intlayer-report.md`） |
| `--content-glob <glob>` | 辞書ファイル名のglob（デフォルト: `**/*.content.ts`） |
| `--t-import <specifier>` | 生成された`t()`のインポート指定子（デフォルト：`src/i18n.ts`が存在する場合は相対`./i18n`、それ以外は`i18next`） |

`--write` の実行後、レポートに記載された手動レビュー対象サイトの確認を完了し、リストに記載されている未使用の `*.content.ts` ファイルと `IntlayerProvider` ラッパーを削除し、ランタイムブートストラップを貼り付けて、ロケールコントロールから `i18n.changeLanguage` を呼び出してください。レポートで新規とマークされたソース文字列については、`extract` を実行してから `translate-ui` (または `sync`) を実行します。`extract` は `ui-languages.json` も書き込み、ブートストラップがこれをインポートします。`strings.json`、フラットロケールファイル、または `ui-languages.json` を手動で編集しないでください。

**関連項目：** [CLI — UI文字列](/ja/reference/cli-commands/ui-strings#migrate-intlayer)、[i18nextの組み込み](/ja/guide/ui-strings/i18next-runtime)
