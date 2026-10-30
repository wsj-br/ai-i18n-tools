<a id="translating-intlayer-in-place"></a>
# Intlayer をインプレースで翻訳する

[Intlayer](https://intlayer.org/) は、翻訳を型付きコンテンツ辞書に保持するアプリケーション、または翻訳管理システムや人手翻訳を使用するアプリケーションに適したソリューションです。`translate-intlayer` はその読者向けです。これは、`*.content.ts` 辞書内の欠落しているロケールのリーフと古くなったロケールのリーフを、その場で埋めます。辞書は信頼できる唯一の情報源のまま、Intlayer は実行時に残り、ai-i18n-tools は翻訳エンジン（プロバイダー選択、用語集、翻訳コンテキスト、モデルのフォールバック）として機能します。

<a id="keep-intlayer-or-move-to-source-string-calls"></a>
## Intlayer を維持するか、ソース文字列の呼び出しに移行するか？

| 対象読者 | コマンド | ガイド |
| --- | --- | --- |
| 型付きコンテンツ辞書、翻訳管理システム、または人手翻訳。Intlayer は実行時に残ります。 | `translate-intlayer` | このページ |
| ソース文字列呼び出し、`t('…')`。ソース言語のテキストは、それを使用するコードと一緒に保持されます。ソース言語は任意の言語にできます。 | `migrate-intlayer` | [Intlayer からソース文字列呼び出しへ移行する](/ja/guide/migrating-from-intlayer) |

`translate-intlayer` は、ソース文字列を追加したり既存の文字列を編集したりするたびに再実行する継続的なタスクです。`migrate-intlayer` は、もう一方の読者向けの一回限りの移行です。書き換えられた各呼び出しは、ソース言語の文字列をそれを使用するコードと一緒に保持するため、保守が簡単になり、そのコードの複雑さが軽減されます。その言語は `sourceLocale` であり、任意の言語にできます。

<a id="what-translate-intlayer-does"></a>
## `translate-intlayer` の動作

1. `*.content.ts` をパースし、すべての`t({ locale: '…' })`リーフを収集します。ロケール値は、プレーンな文字列またはIntlayerの`insert('…')`挿入ノードにすることができます。
2. UIブロックの`ui.stringsJson`をソーステキストでシードし、その後、欠落しているロケールと古いロケールに対して、[`translate-ui`](/ja/reference/cli-commands/ui-strings#translate-ui) と同じエンジンを実行します。
3. 新しいロケールごとの文字列を各`t({ … })`オブジェクトに書き戻します。編集は正確です。欠落しているロケール行または古いロケール行のみが変更されるため、フォーマット、キーの順序、コメントは保持されます。既存の翻訳はそのまま残されます。リーフが`insert('…')`を使用する場合、新しいロケール値も`insert(…)`でラップされるため、リーフは実行時に呼び出し可能な状態を保ちます。
4. プレースホルダーを保持します。Intlayerの挿入構文 <code v-pre>{{token}}</code> は変更されずに渡されます。単一の中括弧の`{token}`プレースホルダーもサポートされており、これらは翻訳のために<code v-pre>{{token}}</code>となり、書き込み時には`{token}`に戻ります。
5. `--dry-run` によるドライラン: 大規模言語モデルを呼び出したり何かを書き込んだりせずに、欠落数と古くなった項目数を報告します。

<a id="missing-vs-stale"></a>
## 欠落と古くなった状態

リーフとロケールの組み合わせは、次のいずれかの場合に翻訳されます。

- ロケールがリーフに存在しない（欠落）、または
- そのロケールについて、前回の実行以降にソースロケールのテキストが変更された（古くなった）。ソース言語は `sourceLocale` であり、任意の言語にできます。

古くなった状態は `cacheDir` 内でリーフごとに追跡されるため、英語文字列を 1 つ編集しても、次回の実行で再翻訳されるのはそのリーフだけです。それ以外はすべてキャッシュされたままです。初回実行の時点ですでに古くなっていた翻訳は、現在のものとして受け入れられます。後続の編集だけが古くなった状態としてマークされます。

<a id="translate-your-project"></a>
## プロジェクトを翻訳する

1. `ai-i18n-tools` をインストールします（[インストール](/ja/guide/installation)を参照）。プロジェクトにまだ `ai-i18n-tools.config.json` がない場合は、スキャフォールドを生成します。

   ```bash
   ai-i18n-tools init -P gemini
   ```

`sourceLocale` と `targetLocales` を辞書で使用するロケールに設定し、`ui.sourceRoots`、`ui.stringsJson`、`ui.flatOutputDir` をソースとカタログパスに向けます。これは `translate-ui` が使用するものと同じキーです。[ユーザーインターフェイス文字列 — 手順 1: 初期化](/ja/guide/ui-strings/#step-1-initialise) を参照してください。カタログはスクラッチディレクトリ（例: `.i18n/`）に置くことができます。これは翻訳キャッシュとして使用され、手作業で編集することはありません。
2. まずドライランして、何が埋められるか確認します。

   ```bash
   ai-i18n-tools translate-intlayer src --dry-run
   ```

3. 適用します（プロバイダーのエーピーアイキーが必要です）。

   ```bash
   ai-i18n-tools translate-intlayer src
   ```

4. 新しい文字列を追加したり英語の文字列を編集したりするたびに再実行します。新しいリーフまたは変更されたリーフだけが翻訳されます。必要に応じて `-l de,fr` または `--ui-block` で実行範囲を絞ります。

<a id="run-the-example"></a>
## サンプルを実行する

[intlayer-translate](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/intlayer-translate) の例は、小さな Vite + React アプリです。このアプリの辞書には英語とブラジルポルトガル語が同梱されており、スペイン語と簡体字中国語は意図的に欠落しています。`pristine/` は読み取り専用の参照用で、`src/` は作業コピーです。`pnpm reset` は `src/` をその開始状態に戻します（さらにカタログとキャッシュをクリアします）ので、演習を繰り返せます。

```bash
npx degit wsj-br/ai-i18n-tools/examples/intlayer-translate intlayer-translate
cd intlayer-translate
pnpm install
pnpm reset
pnpm translate:dry
pnpm translate
```

`pnpm dev`は`http://localhost:3093`でアプリを実行します。翻訳を表示するには、ロケールを`es`または`zh-Hans`に切り替えてください。翻訳が適用されるまでは、文字列は英語にフォールバックします。`pnpm translate`の後、反映された翻訳が表示されます。英語の文字列を編集し、`pnpm translate`を再実行すると、そのリーフのみが更新されるのを確認できます。

完全なウォークスルー: [examples/intlayer-translate/README.md](https://github.com/wsj-br/ai-i18n-tools/blob/main/examples/intlayer-translate/README.md)。

<a id="command"></a>
## コマンド

```bash
ai-i18n-tools translate-intlayer [paths...] [-l <codes>] [--ui-block <selector>] [--dry-run] [-j <n>]
```

`features.translateUIStrings` と UI ブロックの `ui.stringsJson` (`translate-ui` と同じ) が必要です。`--dry-run` は LLM を呼び出しません。

| オプション | 意味 |
| --- | --- |
| `[paths...]` | スキャン対象のファイル/ディレクトリ/グロブ（デフォルト：`ui.sourceRoots`） |
| `-l`, `--locale <codes>` | 入力するターゲットロケール (カンマ区切り) (デフォルト: ブロックの `targetLocales`) |
| `--ui-block <selector>` | UI ブロック: 0 から始まるインデックス、説明、または `stringsJson` パス (デフォルト: ブロック 0) |
| `--dry-run` | 不足/古いカウントのみを報告。LLM の呼び出し、書き込みなし |
| `-j`, `--concurrency <n>` | 並列処理するターゲットロケールの最大数 (デフォルト: 設定の `concurrency` または 4) |

**関連項目:** [CLI — UI 文字列](/ja/reference/cli-commands/ui-strings#translate-intlayer)、[Intlayer からソース文字列呼び出しへの移行](/ja/guide/migrating-from-intlayer)
