<a id="ai-models"></a>
# AIモデル

モデルとは、`google/gemini-2.5-flash`や`gpt-5-mini`など、プロバイダー上の名前付きシステムのことです。`init`は、選択したプロバイダー用のスターター`translationModels`リストを書き込みます。そのリストは出発点として扱ってください。

このプロジェクト用のリストは、`suggest-models`を使用するか、翻訳ダッシュボードの**モデル**にある同じランキングを使用して選択します。どちらの方法でも、公開されているベンチマークに基づいてアクティブなプロバイダーのチャットモデルをランク付けし、その結果を`translationModels`に書き込むことができます。まず、プロバイダーとそのAPIキーを設定してください: [LLMプロバイダー](/ja/guide/providers-and-models)。

<a id="start-with-a-ranked-shortlist"></a>
## 順位付き候補リストから始める

<a id="from-the-command-line"></a>
### コマンドラインから

`suggest-models`は、アクティブなプロバイダーが現在提供しているチャットモデルをランク付けし、短いテーブルを出力します。デフォルトは品質です。翻訳の測定値と一般的な優先度スコアが価格よりも重視されます。

```bash
ai-i18n-tools suggest-models
```

列は、ランク、モデルID、インデックス、測定されたChrF、測定されたArenaスコア、および100万トークンあたりの入出力価格(USD)です。測定値がない場合は`—`になります。インデックスは、加重スコアを100倍したものです。品質ランキングでは、インデックスが高いほどこのプロジェクトにより強く一致することを示します。

テーブルが適切に表示されたら、そのショートリストを構成ファイルに書き込みます:

```bash
ai-i18n-tools suggest-models --apply
```

`--apply`は`providers.<active>.translationModels`を置き換えます。まず、現在の構成を兄弟ファイルである`ai-i18n-tools.config.{timestamp}.backup.json`にコピーします。`uiModels`と`localeModels`はそのまま残ります。`--top`(デフォルトは8)は、テーブルと`--apply`に含めるIDの数です。最初のIDが、翻訳で最初に試行されるものです。

`--price`はより低いレートを優先しますが、品質の最低ラインは維持するため、測定値のない安価なモデルはスコアのあるモデルよりも下になります。`--quality`がデフォルトです。両方のフラグを渡すとエラーになります。

<a id="from-the-dashboard"></a>
### ダッシュボードから

**モデル**タブには同じランキングが表示され、各行にチェックボックスがあります。

```bash
ai-i18n-tools dashboard
```

**モデル**を開きます。**品質**または**価格**を選択します。希望する行にチェックを入れます。チェックされた行が上から順に、翻訳が試行する順序になります。**構成を更新**をクリックすると確認が求められ、同様のバックアップが書き込まれ、その順序が`translationModels`に保存されます。自分で貼り付けたい場合は、**JSONをコピー**で`{ "translationModels": [...] }`のフラグメントをクリップボードにコピーできます。

**最大出力価格**と**最小インデックス差分**は、`suggest-models --max-output-price`と`--min-delta`に対応します。コントロールと列: [モデルタブ](/ja/guide/translation-dashboard/models)。

<a id="how-the-ranking-chooses"></a>
### 順位付けの仕組み

ショートリストは、プロバイダーのライブチャットカタログのベンチマークランキングです。初回実行時は3つの公開データセットをダウンロードするため、時間がかかることがあります。その後の実行では、`<cacheDir>/benchmark-scores.json`(通常は`.translation-cache/benchmark-scores.json`)にある7日間のキャッシュを再利用します。

| シグナル | 貢献内容 | ソース |
| --- | --- | --- |
| ChrF | プロジェクトの言語に対する翻訳品質 | [languagebench](https://languagebench.github.io/) (CC BY-SA 4.0) |
| Arenaスコア | 直接比較による総合的な優先度 | [LMArena Arena Score](https://github.com/lm-arena/lm-arena) (CC BY 4.0) |
| 100万トークンあたりのUSD | 入出力価格 | プロバイダーが料金を公開している場合はそのカタログ、それ以外は[models.dev](https://models.dev/) (MIT) |

ChrFは、プロジェクトの`sourceLocale`と`targetLocales`に対するlanguagebenchの翻訳スコアを使用します。ロケールはlanguagebenchの言語コード(プライマリサブタグ)にマッピングされ、`pt-BR`から`pt`、`zh-Hant`から`zh`などのエイリアスがあります。これらの言語をうまく翻訳するモデルは、一般的にスコアが高いだけのモデルよりも上位にランク付けされます。埋め込み、画像、音声、その他の非チャットモデルはスキップされ、有効期限が切れたIDも同様です。

デフォルトのプロファイルである「品質」は、価格よりもChrFとArenaスコアを重視します。「価格」はその重点を逆転させますが、上記の品質下限は維持します。オプションの重みについては[`modelSuggestion`](/ja/reference/configuration#modelsuggestion-optional)を参照してください。

`suggest-models --refresh`はデータセットを再ダウンロードします。その後、**「モデル」** タブをリロードしてください。

`--json`、`--list`、およびスコア計算式を含むすべてのフラグについては、[suggest-models](/ja/reference/cli-commands/models#suggest-models)を参照してください。

<a id="why-the-list-has-more-than-one-model"></a>
## リストに複数のモデルが含まれる理由

<a id="model-fallback-chain"></a>
### モデルフォールバックチェーン

`translationModels`は順序付きリストです。CLIは最初のモデルを試します。リクエストが失敗した場合、解析できないレスポンスを受け取った場合、またはテキストが間違った書記体系である場合、そのバッチに対して次のIDを試します。

1つのIDだけでは単一障害点になります。モデルはタイムアウトしたり、このツールが拒否するテキストを返したり、ある言語はうまく翻訳できても別の言語はうまく翻訳できなかったりすることがあります。よくあるケースは、`hi`がデーヴァナーガリーを期待しているのに、ローマ字化されたヒンディー語が使われる場合です。ローマ字化された出力は、ネイティブスクリプトのロケールでは拒否されます。ローマ字化されたままであるべきロケールには、`hi-Latn`のような明示的な`-Latn`サブタグが必要です。

そのため、ショートリストには最も強力なものから順に複数のIDが含まれています。リスト内の順序が、翻訳が試行される順序です。

**解決階層** (重複排除、順序保持):

| パイプライン | 順序 |
| --- | --- |
| UI (`translate-ui`、複数形、`proofread-ui`) | `localeModels(locale)` → `uiModels` → `translationModels` |
| ドキュメント、JSON、SVG | `localeModels(locale)` → `translationModels` |

ほとんどのプロジェクトでは`translationModels`のみを設定します。他の2つのリストは、特定の種類のテキストや言語に対して、最初に異なるモデルを試すべき場合に使用します。

**UI文字列。** オプションの`uiModels`は、一致するロケールごとのオーバーライドの後、`translationModels`の前に試行されます。UIのテキストは短く目に見えるものであるため、そのチェーンでより強力なモデルを使用するのが一般的な分割方法です。`suggest-models --apply`は`translationModels`のみを書き込みます。

**1つのロケール。** オプションの`localeModels`は、BCP-47タグを、すべてのパイプラインでそのロケールに対して最初に試行されるモデルにマッピングします(`pt-br`は`pt-BR`に一致します)。日本語、韓国語、中国語は、汎用のフォールバックよりも、`z-ai/glm-5.3`や`minimax/minimax-m2.7`のような、それらの書記体系に合わせて調整されたモデルの方がうまくいくことがよくあります。一致するエントリがない場合は、上記のパイプライン階層のみが適用されます。

例 (OpenRouter)。ID は 3 つのリストの形状を示します。`suggest-models` または **モデル** タブから `translationModels` を取得します。UI コピーまたは 1 つのロケールに独自のチェーンが必要な場合は、`uiModels` または `localeModels` を追加します。

```json
{
  "provider": "openrouter",
  "providers": {
    "openrouter": {
      "translationModels": [
        "google/gemini-2.5-flash",
        "deepseek/deepseek-v4-flash",
        "openai/gpt-5-mini"
      ],
      "uiModels": [
        "anthropic/claude-sonnet-latest",
        "openai/gpt-5.4"
      ],
      "localeModels": [
        { "locale": "ja", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "ko", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hans", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] },
        { "locale": "zh-Hant", "models": ["z-ai/glm-5.3", "minimax/minimax-m2.7"] }
      ]
    }
  }
}
```

`init`からのプリセットリスト、およびフィールドリファレンス: [設定 — `provider`と`providers`](/ja/reference/configuration#provider-and-providers)。

<a id="check-list-and-benchmark"></a>
## 確認、一覧表示、ベンチマーク

ショートリストが設定ファイルに記述されたら、これらのコマンドでそれを検査できます。これらを使用する前に翻訳を実行することも可能です。

<a id="check-models"></a>
### `check-models`

設定された各IDが、アクティブなプロバイダーによってまだ提供されているかを確認します。

```bash
ai-i18n-tools check-models
```

プロバイダーの`GET /models`エンドポイントを呼び出し、`translationModels`、`uiModels`、`localeModels`内のすべてのIDをチェックし、見つからないIDや`expiration_date`を過ぎたIDを報告し、設定されたIDのいずれかが無効な場合はゼロ以外の値で終了します。プロバイダーが価格を公開している場合(OpenRouterとCheaper Inferenceは公開しています)、100万トークンあたりのUSDも表示されます。

<a id="list-models"></a>
### `list-models`

プロバイダーが公開している完全なカタログを、IDでソートして出力します。ランキングから漏れたIDを調べるのに使用します。

```bash
ai-i18n-tools list-models
```

<a id="bench-models"></a>
### `bench-models`

設定された各モデルで個別に1つのサンプルを翻訳し、入力トークンと出力トークン、実時間、USDコストを出力します。`suggest-models`は上記の公開スコアを使用します。`bench-models`はモデルを呼び出すため、APIクレジットを消費し、アカウントでのレイテンシと価格を表示します。

```bash
ai-i18n-tools bench-models
```

`translationModels`、`uiModels`、`localeModels`の各ユニークIDは、フォールバックなしで実行されます。特定の比較を行うには、サンプルまたはIDをオーバーライドします:

```bash
ai-i18n-tools bench-models --text "Hello world" --source en --target de --model openai/gpt-5-mini,google/gemini-2.5-flash
```

Cheaper Inferenceで[ゼロデータ保持](/ja/guide/providers-and-models#cheaperinference-zero-data-retention)がオンの場合、`check-models`、`list-models`、`suggest-models`は`GET /models?zdr=true`を読み取ります。

コマンドの詳細: [CLI — モデルと言語](/ja/reference/cli-commands/models)。

<a id="further-reference"></a>
## 関連情報

- [LLM プロバイダー](/ja/guide/providers-and-models) — プリセット、API キー、`-P` を使用したプロバイダーの切り替え。
- [「モデル」タブ](/ja/guide/translation-dashboard/models) — ダッシュボード内の同じランキング。
- [設定 — `provider` と `providers`](/ja/reference/configuration#provider-and-providers) — `translationModels`、`uiModels`、`localeModels`、タイムアウト、コストレート。
- [suggest-models](/ja/reference/cli-commands/models#suggest-models) — フラグ、フィルター、スコアの計算式。
