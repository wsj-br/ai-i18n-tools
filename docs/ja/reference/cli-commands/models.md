<a id="cli--models--languages"></a>
# CLI — モデルと言語

<a id="check-models"></a>
### `check-models`

**概要:** `ai-i18n-tools check-models`

各設定済みモデルIDを、アクティブなプロバイダーの`GET /models`リスト（メンバーシップと`expiration_date`）に対して検証します。そのプロバイダーのAPIキーが必要です（Ollamaのようなキーレスプロバイダーの場合は不要）。設定済みのIDが不足しているか期限切れの場合、ゼロ以外の値で終了し、解決されたリクエストタイムアウト（`requestTimeout`またはプロバイダー上の`requestTimeoutMs`、それ以外の場合はトップレベルの値）を尊重します。プロバイダーが価格情報（例：OpenRouter）を返す場合、プロンプト/完了の100万トークンあたりのUSDも表示します。`providers.cheaperinference.zeroDataRetention`がtrueの場合、チェックは`GET /v1/models?zdr=true`を使用し、カタログから除外されたIDは失敗とします。

**関連項目:** [AI モデル](/ja/guide/ai-models#check-models)、[LLM プロバイダー](/ja/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**概要:** `ai-i18n-tools list-models`

アクティブなプロバイダーが`GET /models`リストを介して宣伝するすべてのモデルを一覧表示します（IDでソートされます。アクティブなプロバイダーは設定の`provider`キーに従い、`-P`/`--provider`で上書きできます）。そのプロバイダーのAPIキーが必要です（Ollamaのようなキーレスプロバイダーの場合は不要）。プロバイダーが価格情報（例：OpenRouter）を返す場合、プロンプト/完了の100万トークンあたりのUSDも表示し、`expiration_date`を過ぎたエントリにタグを付けます。`providers.cheaperinference.zeroDataRetention`がtrueの場合、リストは`GET /v1/models?zdr=true`です。

**主なオプション:** `-P` / `--provider`

**関連項目:** [AI モデル](/ja/guide/ai-models#list-models)、[LLM プロバイダー](/ja/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**概要:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-price <usd>] [--min-delta <points>] [--refresh]`

アクティブなプロバイダーのチャットモデルをランク付けし、上位のモデルを表示します（デフォルトは8）。テーブルの列は、順に、ランク、モデルID、インデックス（品質スコアの100倍、小数点以下1桁）、測定されたlanguagebench ChrF、測定されたArena Score、入力価格、出力価格、100万トークンあたりのUSDでのブレンド価格、およびフロンティアティアです。測定値がない場合は`—`です。このコマンドには、そのプロバイダーのAPIキーが必要です（Ollamaのようなキーレスプロバイダーの場合は不要です）。アクティブなプロバイダーは設定`provider`に従います。`-P` / `--provider`で上書きできます。

候補はプロバイダーの`GET /models`リストから取得されます。`providers.cheaperinference.zeroDataRetention`がtrueの場合、そのリクエストは`GET /v1/models?zdr=true`です。期限切れの行とチャット以外の行（埋め込み、音声、画像、ビデオ、モデレーション、リランカー）は除外されます。そのカタログリクエストが失敗した場合、コマンドは1で終了します。

インデックスは品質のみです：languagebench ChrFとArena Score。価格はインデックスの一部ではありません。`--quality`がデフォルトです。インデックスでソートされ、2つのモデルが同じインデックスを示す場合は、より安価なブレンド価格でソートされます。`--price`は、品質と価格のパレートフロンティアを最も安価なものから順にリストします。あるモデルが、他のモデルよりもコストがかからず、少なくとも同じインデックスを持ち、かつ厳密に安価であるか、インデックスが厳密に高い場合、そのモデルは「支配されている」と見なされます。ブレンド価格とインデックスが完全に一致する場合、ティアを共有します。支配されていないモデルはティア1、次にティア2、といった具合です。ティアはその深さであり、最高のインデックスからの距離ではありません。価格のないモデル、次に品質フロアを下回るモデルがフロンティアに続きます。両方のフラグを渡すとエラーになります。どちらも渡さない場合は品質を意味します。オプションの`modelSuggestion`設定の重みは、いずれかのプロファイルのChrF/Arenaミックスと品質フロアを置き換えます。[設定](/ja/reference/configuration#modelsuggestion-optional)を参照してください。同じランキングは[ダッシュボードのモデルタブ](/ja/guide/translation-dashboard/models)でも使用されます。

ChrF は、メトリックが `chrf` である languagebench の `translation_from` および `translation_to` の行の平均であり、このプロジェクトの `sourceLocale` および `targetLocales` に限定されます。ロケールは languagebench の言語コード (プライマリサブタグであり、`pt-BR` から `pt`、`zh-Hant` から `zh`、および `yue` のようないくつかのエイリアスがあります) にマッピングされます。空のセットは `en` を使用します。Arena は LMArena の全体的な Arena スコアであり、Elo ではありません。

ブレンド価格は100万トークンあたり`(3 × input + output) / 4` USDです。そのソースは、この順序で解決されます：ゼロ以外のカタログレート、次にmodels.devの入力および出力レート、次にlanguagebenchの単一コスト数値。`0`のカタログ価格は価格設定なしであり、無料ではありません。不明な価格はインデックスを変更しません。`--quality`では、同じインデックスの中で最後にソートされます。`--price`では、フロアをクリアする価格設定なしのモデルは、すべてのフロンティアティアの後に来ます。

ChrFが欠落している場合、品質フロアより下にソートされます。ChrFまたはArenaが欠落している場合に使用されるプレースホルダー値`0.35`と`0.45`はインデックスのみに影響し、テーブルには代わりに`—`が表示されます。`frontier`列は、フロアをクリアする支配されていない価格設定モデルの場合は`1`、次のティアの場合は`2`、モデルに価格がない場合、フロアを下回る場合、またはエイリアスである場合は`—`です。ChrF、Arena Score、入力価格、出力価格を共有する2つのIDはエイリアスです。短いIDが保持され、日付のないIDは日付のあるIDよりも優先されます（`preview-06-05`、`20241022`）。エイリアスの行は完全なランキングに残りますが、テーブル、`--json`、および`--apply`からは除外されます。`--list`はそれらを表示します。表示される行に支配されたモデルが含まれる場合、テーブルの下の行には、それを上回るティア1モデルの名前が示されます。

`--quality`は、フロアをクリアするモデルを最初に配置し、次に高いインデックス、次に安価なブレンド価格の順に並べます。`--top`（デフォルトは`8`、1以上の整数）は、以下のフィルターの後で、テーブル、`--json`フラグメント、および`--apply`をまとめて制限します。

`--list`は、アクティブなプロバイダーの設定済み`translationModels`に対して同じ列をその順序で表示し、`--top`を無視します。ランク列は、完全なランキングにおける各モデルの順位のままです。カタログに存在しない、期限切れである、またはチャットモデルではない設定済みのIDもリストされますが、測定値には`—`が表示されます。`--list`を`--apply`と組み合わせることはできません。

`--list`の場合を除き、エイリアスの行は最初に削除されます。次に`--max-price`は、100万トークンあたりのブレンド価格がそのUSD以下であるモデルを保持します。ブレンド価格のないモデルは除外されます。次に`--min-delta`は残りの行をたどり、インデックスが以前に保持されたモデルと少なくともそのポイント数だけ異なる場合にのみモデルを保持します。最初に残ったモデルは常に保持されます。`0`のデルタでは行は削除されません。デルタが`0`より大きい場合、インデックスのない行は除外されます。ランク番号は完全なリストのものが維持されます。`--list`を使用すると、ウォークは`translationModels`の順序に従い、エイリアスを保持します。両方のフィルターは`--json`と`--apply`にも適用されます。適用される品質リストの場合、`--max-price`は予算内でフォールバックを保持し、`--min-delta`は小さなインデックスステップを削除します。キャップの下の支配された行は残ることがあります。フロンティア列とテーブルの下の行がそれを示します。[モデルタブ](/ja/guide/translation-dashboard/models)には同じ2つのコントロールがあり、エイリアスも省略されます。

`--json`はこのオブジェクトをstdoutに書き出し（プロバイダーブロック内に貼り付けてください）、テーブルと属性フッターをstderrに送信します：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply`は現在の設定を兄弟の`ai-i18n-tools.config.{timestamp}.backup.json`にコピーし（または`-c`が別のファイル名を指定する場合は`{name}.{timestamp}.backup.json`）、その後`providers.<active>.translationModels`をそれらのIDで置き換えます。名前が衝突した場合、`.backup.json`の前に`-2`、`-3`などが追加されます。コピーが失敗した場合、設定ファイルは変更されません。`uiModels`と`localeModels`は変更されません。スコアは設定ファイルに書き込まれません。ダッシュボードの**Update config**ボタンも同じバックアップを書き込みます。

ベンチマークデータは`<cacheDir>/benchmark-scores.json` (通常は`.translation-cache/benchmark-scores.json`) に7日間キャッシュされます。生のデータセットは実行時にダウンロードされ、パッケージには同梱されません。`--refresh` はlanguagebench、Arena、およびmodels.devを再ダウンロードします。`--refresh` 中に失敗したソースは、以前のキャッシュから読み込まれません。`--refresh` がないと、ダウンロードが失敗した場合でもキャッシュされたスライスが再利用されます。languagebenchまたはArenaのいずれかが失敗した場合、コマンドはもう一方のソースでランク付けを行い、どのソースが失敗したかを報告します。両方が失敗した場合は、終了コード1で終了します。models.devの失敗は、カタログ価格をそのまま維持します。ダッシュボードには更新コントロールがありません。CLIから`--refresh` を実行し、その後「モデル」タブを再読み込みしてください。

フッターには、languagebench (CC BY-SA 4.0)、LMArena Arena Score (CC BY 4.0)、およびmodels.dev (MIT)の帰属が記載されています。

**主なオプション:** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

**関連項目:** [AI モデル](/ja/guide/ai-models)、[モデル タブ](/ja/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**概要:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

1つのサンプルを個別に翻訳することで、設定された各モデルのベンチマークを行います（単一モデルクライアント、フォールバックチェーンなし）。モデルID、入力/出力トークン、実経過翻訳時間、USDコスト（コストを報告しないプロバイダーの場合は`—`）の表に加え、合計行とモデルごとの失敗を出力します。

モデルはデフォルトで、アクティブなプロバイダーの`translationModels`、`uiModels`、`localeModels`のIDの和集合になります（`--model`で上書き）。サンプルはデフォルトで組み込みの英語マークダウンブロックになります（`--text` / `--file`で上書き）。ソース/ターゲットはデフォルトで設定の`sourceLocale`と最初の`docs[]`ターゲットロケールになり、トップレベルの`targetLocales`にフォールバックします（`--source` / `--target`で上書き）。モデルは並行して実行され、設定の`concurrency`（デフォルトは4）によって制限されます。ただし、各モデルは個別に計時されます。アクティブなプロバイダーのAPIキーが必要です。

**主なオプション:** `--model`, `--text`, `--file`, `--source`, `--target`

**関連項目:** [AI モデル](/ja/guide/ai-models#bench-models)

---

<a id="list-languages"></a>
### `list-languages`

**概要:** `ai-i18n-tools list-languages [search]`

バンドルされているUI言語カタログ（`data/ui-languages-complete.json`）を人間が読める形式の表（コード、テキスト方向、英語名、ネイティブ名）としてリスト表示します。設定やAPIキーは不要です。オプションの`search`用語を渡すと、コード、ネイティブ名、英語名、または方向にそれが含まれるエントリのみを保持します（大文字小文字を区別しません）。例: `list-languages portuguese`, `list-languages rtl`, `list-languages zh`。
