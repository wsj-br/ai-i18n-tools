<a id="cli--models--languages"></a>
# CLI — モデルと言語

<a id="check-models"></a>
### `check-models`

**概要:** `ai-i18n-tools check-models`

設定された各モデルIDを、アクティブなプロバイダーの`GET /models`リスト（メンバーシップと`expiration_date`）に対して検証します。そのプロバイダーのAPIキーが必要です（Ollamaのようなキー不要のプロバイダーの場合は不要）。設定されたIDのいずれかが欠落しているか期限切れの場合は非ゼロで終了し、解決されたリクエストタイムアウト（プロバイダーの`requestTimeout`または`requestTimeoutMs`、それ以外の場合はトップレベルの値）に従います。プロバイダーが価格を返す場合（例: OpenRouter）、プロンプト/補完の100万トークンあたりのUSDも表示します。

**関連項目:** [LLMプロバイダー](/ja/guide/providers-and-models)

---

<a id="list-models"></a>
### `list-models`

**概要:** `ai-i18n-tools list-models`

アクティブなプロバイダーが`GET /models`リスト経由で公表しているすべてのモデルをリスト表示します（ID順にソート、アクティブなプロバイダーは設定の`provider`キーに従いますが、`-P` / `--provider`で上書き可能）。そのプロバイダーのAPIキーが必要です（Ollamaのようなキー不要のプロバイダーでは不要）。プロバイダーが価格を返す場合（例: OpenRouter）、プロンプト/補完の100万トークンあたりのUSDも表示し、`expiration_date`を過ぎたエントリにタグを付けます。

**主なオプション:** `-P` / `--provider`

**関連項目:** [LLMプロバイダー](/ja/guide/providers-and-models)

---

<a id="suggest-models"></a>
### `suggest-models`

**概要:** `ai-i18n-tools suggest-models [--quality | --price] [--top <n>] [--json] [--apply] [--list] [--max-output-price <usd>] [--min-delta <points>] [--refresh]`

アクティブなプロバイダーのチャットモデルをランク付けし、上位モデル（デフォルトで5つ）を表示します。テーブルの列は、順にランク、モデルID、インデックス（加重スコアに100を掛けた値、小数点以下1桁）、測定されたlanguagebench ChrF、測定されたArenaスコア、および100万トークンあたりの入力・出力価格（USD）です。測定値が存在しない場合は`—`と表示されます。このコマンドには、そのプロバイダーのAPIキーが必要です（Ollamaなどのキー不要なプロバイダーの場合は不要です）。アクティブなプロバイダーは設定`provider`に従います。これを`-P` / `--provider`で上書きできます。

候補はプロバイダーの`GET /models`リストから取得されます。期限切れの行およびチャット用ではない行（埋め込み、音声、画像、動画、モデレーション、リランカー）は除外されます。カタログの要求が失敗した場合、コマンドは1を返して終了します。

`--quality`がデフォルトです。これはChrFとArenaスコアを価格よりも重視します。`--price`は価格をそれらのスコアよりも重視しつつ、品質の下限を維持するため、測定されていない安価なモデルがリストの上位に来ることはありません。両方のフラグを渡すとエラーになります。どちらも渡さない場合は品質が優先されます。オプションの`modelSuggestion`設定内の重み付けは、いずれのプロファイルも置き換えます。[Configuration](/ja/reference/configuration#modelsuggestion)を参照してください。同じ重み付けが[dashboard Models tab](/ja/guide/translation-dashboard/models)でも使用されます。

ChrFは、メトリックが`chrf`であるlanguagebenchの`translation_from`および`translation_to`行の平均であり、このプロジェクトの`sourceLocale`および`targetLocales`に限定されます。ロケールはlanguagebenchの言語コード（主要なサブタグ。`pt-BR`から`pt`、`zh-Hant`から`zh`、`yue`へのエイリアスなど一部の例外あり）にマッピングされます。空のセットの場合は`en`が使用されます。ArenaはLMArenaの総合Arenaスコアであり、Eloではありません。ランク付けの価格は100万トークンあたりの`(3 × input + output) / 4` USDです。価格のソースは、ゼロ以外のカタログレート、次にmodels.devの入力および出力レート、最後にlanguagebenchの単一コスト数値の順です。カタログ価格が`0`の場合は価格設定なしとみなされ、無料ではありません。価格不明なモデルは、品質プロファイルでは中立、価格プロファイルでは最悪として扱われます。ChrFが欠落している場合は品質下限を下回る順位になります。ChrFまたはArenaの欠落に対して使用される`0.35`および`0.45`の代用値はインデックスにのみ影響し、テーブルには`—`と表示されます。

下限をクリアした行が先に表示され、次にインデックスが高い順、その次に安価な混合価格順となります。`--top`（デフォルトは`5`、1以上の整数）は、以下のフィルター適用後に、テーブル、`--json`フラグメント、および`--apply`を制限します。

`--list`は、アクティブなプロバイダーの設定済み`translationModels`に対して同じ列をその順序で表示し、`--top`を無視します。ランク列は、完全なランキングにおける各モデルの順位のままです。カタログに存在しない、期限切れである、またはチャットモデルではない設定済みのIDもリストされますが、測定値には`—`が表示されます。`--list`を`--apply`と組み合わせることはできません。

`--max-output-price`は、100万トークンあたりの出力価格が指定されたUSD以下のモデルを保持します。出力価格がないモデルは除外されます。`--min-delta`は残りの行を順に確認し、インデックスが直前に保持されたモデルより指定されたポイント数以上低い場合にのみモデルを保持します。最初に残ったモデルは常に保持されます。デルタが`0`の場合は行をドロップしません。デルタが`0`より大きい場合、インデックスのない行は除外されます。ランク番号は完全なリストのものが維持されます。`--list`を指定すると、確認は`translationModels`順に従います。両方のフィルターは`--json`および`--apply`にも適用されます。[Models tab](/ja/guide/translation-dashboard/models)にも同じ2つのコントロールがあります。

`--json`はこのオブジェクトをstdoutに書き出し（プロバイダーブロック内に貼り付けてください）、テーブルと属性フッターをstderrに送信します：

```json
{
  "translationModels": ["model-a", "model-b"]
}
```

`--apply`は`providers.<active>.translationModels`をそれらのIDで置き換えます。`uiModels`と`localeModels`は変更されません。スコアは設定ファイルには書き込まれません。

ベンチマークデータは `<cacheDir>/benchmark-scores.json` (通常は `.translation-cache/benchmark-scores.json`) に7日間キャッシュされます。生のデータセットは実行時にダウンロードされ、パッケージには同梱されません。`--refresh` は languagebench、Arena、および models.dev を再ダウンロードします。`--refresh` 中に失敗したソースは、以前のキャッシュから補充されません。`--refresh` を指定しない場合、ダウンロードに失敗するとキャッシュされたスライスが再利用されます。languagebench または Arena のいずれかが失敗した場合、コマンドはもう一方のソースでランク付けを行い、どのソースが失敗したかを表示します。両方が失敗した場合は、終了コード 1 で終了します。models.dev の失敗では、カタログ価格はそのまま保持されます。ダッシュボードには更新コントロールがないため、CLI から `--refresh` を実行してから、Models タブを再読み込みしてください。

フッターには、languagebench (CC BY-SA 4.0)、LMArena Arena Score (CC BY 4.0)、およびmodels.dev (MIT)の帰属が記載されています。

**主要なオプション:** `--quality`、`--price`、`--top`、`--json`、`--apply`、`--list`、`--max-output-price`、`--min-delta`、`--refresh`、`-P` / `--provider`

**参照:** [LLM プロバイダー](/ja/guide/providers-and-models)、[Models タブ](/ja/guide/translation-dashboard/models)

---

<a id="bench-models"></a>
### `bench-models`

**概要:** `ai-i18n-tools bench-models [--model <ids>] [--text <text> | --file <path>] [--source <locale>] [--target <locale>]`

1つのサンプルを個別に翻訳することで、設定された各モデルのベンチマークを行います（単一モデルクライアント、フォールバックチェーンなし）。モデルID、入力/出力トークン、実経過翻訳時間、USDコスト（コストを報告しないプロバイダーの場合は`—`）の表に加え、合計行とモデルごとの失敗を出力します。

モデルはデフォルトで、アクティブなプロバイダーの`translationModels`、`uiModels`、`localeModels`のIDの和集合になります（`--model`で上書き）。サンプルはデフォルトで組み込みの英語マークダウンブロックになります（`--text` / `--file`で上書き）。ソース/ターゲットはデフォルトで設定の`sourceLocale`と最初の`docs[]`ターゲットロケールになり、トップレベルの`targetLocales`にフォールバックします（`--source` / `--target`で上書き）。モデルは並行して実行され、設定の`concurrency`（デフォルトは4）によって制限されます。ただし、各モデルは個別に計時されます。アクティブなプロバイダーのAPIキーが必要です。

**主なオプション:** `--model`, `--text`, `--file`, `--source`, `--target`

---

<a id="list-languages"></a>
### `list-languages`

**概要:** `ai-i18n-tools list-languages [search]`

バンドルされているUI言語カタログ（`data/ui-languages-complete.json`）を人間が読める形式の表（コード、テキスト方向、英語名、ネイティブ名）としてリスト表示します。設定やAPIキーは不要です。オプションの`search`用語を渡すと、コード、ネイティブ名、英語名、または方向にそれが含まれるエントリのみを保持します（大文字小文字を区別しません）。例: `list-languages portuguese`, `list-languages rtl`, `list-languages zh`。
