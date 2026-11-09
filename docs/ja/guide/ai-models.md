<a id="ai-models"></a>
# AIモデル

モデルとは、`google/gemini-2.5-flash`や`gpt-5-mini`など、プロバイダー上の名前付きシステムのことです。`init`は、選択したプロバイダー用のスターター`translationModels`リストを書き込みます。そのリストは出発点として扱ってください。

このプロジェクト用のリストは、`suggest-models`を使用するか、翻訳ダッシュボードの**モデル**にある同じランキングを使用して選択します。どちらの方法でも、公開されているベンチマークに基づいてアクティブなプロバイダーのチャットモデルをランク付けし、その結果を`translationModels`に書き込むことができます。まず、プロバイダーとそのAPIキーを設定してください: [LLMプロバイダー](/ja/guide/providers-and-models)。

<a id="start-with-a-ranked-list"></a>
## ランク付けされたリストから始める

<a id="from-the-command-line"></a>
### コマンドラインから

`suggest-models` は、アクティブなプロバイダーが現在提供しているチャットモデルをランク付けし、短い表を出力します。品質がデフォルトです。インデックスはlanguagebench ChrFとArena Scoreです。価格は別の列であり、ソート順の一部であり、インデックスの一部ではありません。

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --top 10 --max-price 6
```

列は、ランク、モデルID、インデックス、測定ChrF、測定Arenaスコア、入力価格、出力価格、100万トークンあたりのブレンド価格（米ドル）、およびフロンティアティアです。欠落している測定値は`—`です。インデックスは品質スコアを100倍したものです。インデックスが高いほど、このプロジェクトの言語により強く適合します。他の行のChrF、Arenaスコア、およびトークン価格を繰り返すIDは、このテーブルから除外されます。`--list`はそれでもそれを表示します。

テーブルが正しく表示されたら、そのリストをconfigに書き込みます。

```bash
ai-i18n-tools suggest-models --apply
ai-i18n-tools suggest-models --apply --top 10 --max-price 6
```

`--apply`は`providers.<active>.translationModels`を置き換えます。まず、現在の設定を兄弟の`ai-i18n-tools.config.{timestamp}.backup.json`にコピーします。`uiModels`と`localeModels`はそのままです。`--top`（デフォルトは8）は、テーブルと`--apply`に含まれるIDの数です。最初のIDは、翻訳が最初に試行するものです。そのリストには、`--max-price`と`--min-delta`を追加します。価格上限は、フォールバックが予算を超えるコストになるのを防ぎ、インデックスギャップは、その上位に保持されているモデルからわずかな差しかないモデルを除外します。

`--price` は、品質と価格のフロンティア上で最も安価なモデルを最初にリストし、品質の最低基準を維持します。そのため、測定値のない安価なモデルは、スコアを持つモデルよりも下に表示されます。`--quality` がデフォルトです。両方のフラグを渡すとエラーになります。

<a id="from-the-dashboard"></a>
### ダッシュボードから

**モデル**タブには同じランキングが表示され、各行にチェックボックスがあります。

```bash
ai-i18n-tools dashboard
```

**モデル**を開きます。**品質**または**価格**を選択します。希望する行にチェックを入れます。チェックされた行が上から順に、翻訳が試行する順序になります。**構成を更新**をクリックすると確認が求められ、同様のバックアップが書き込まれ、その順序が`translationModels`に保存されます。自分で貼り付けたい場合は、**JSONをコピー**で`{ "translationModels": [...] }`のフラグメントをクリップボードにコピーできます。

**最大ブレンド価格** と **最小インデックス差分** は`suggest-models --max-price`と`--min-delta`に一致します。コントロールと列：[モデルタブ](/ja/guide/translation-dashboard/models)。

<a id="how-the-ranking-chooses"></a>
### ランキングの選択方法

このリストは、プロバイダーのライブチャットカタログのベンチマークランキングです。初回実行時には3つの公開データセットをダウンロードするため、時間がかかる場合があります。それ以降の実行では、7日間のキャッシュを再利用します。

| シグナル | 貢献内容 | ソース |
| --- | --- | --- |
| ChrF | プロジェクトの言語における翻訳品質 | [languagebench](https://huggingface.co/spaces/fair-forward/languagebench) (CC BY-SA 4.0) |
| アリーナスコア | 直接比較による全体的な好み | [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC BY 4.0) |
| 100万トークンあたりのUSD | 入力、出力、およびブレンド価格 `(3 × input + output) / 4` | プロバイダーが料金を公開している場合はそのカタログ、それ以外の場合は[models.dev](https://models.dev/) (MIT) |

これらのシグナルから、ランキングは各候補モデルに対して2つの値を導き出します。品質インデックス（ChrFとアリーナスコアを組み合わせたもの）と、ブレンドされたトークン価格に対して品質を評価する[パレートフロンティア](https://en.wikipedia.org/wiki/Pareto_frontier)ティアです。

ChrFは、プロジェクトの`sourceLocale`と`targetLocales`に対するlanguagebenchの翻訳スコアを使用します。ロケールはlanguagebenchの言語コード(プライマリサブタグ)にマッピングされ、`pt-BR`から`pt`、`zh-Hant`から`zh`などのエイリアスがあります。これらの言語をうまく翻訳するモデルは、一般的にスコアが高いだけのモデルよりも上位にランク付けされます。埋め込み、画像、音声、その他の非チャットモデルはスキップされ、有効期限が切れたIDも同様です。

インデックスはChrFとアリーナスコアです。価格は含まれません。スコアはChrF（デフォルト55%）とアリーナスコア（デフォルト45%）に重み付けされ、それぞれプロバイダーのチャットカタログで最高のスコアに対して正規化され、0〜100のスケールで小数点以下1桁に丸められます。代替値（ChrFには`0.35`、アリーナには`0.45`）は、測定値が欠落している場合にのみ適用されます。テーブルには`—`と表示されます。

品質フロアは、最小ChrFしきい値です（品質の場合は候補プールで最高のChrFのデフォルト70%、価格の場合は60%）。このフロアを下回るモデル（ChrF測定値がないモデルを含む）は、フロアをクリアしたモデルの後にソートされ、フロンティア列に`—`と表示されます。デフォルトプロファイルである品質は、インデックスでソートされ、インデックスが同じ場合はより安価なブレンド価格で区別されます。価格は、フロンティアティア（ティア1が最も安価なものから、次にティア2、といった順）でモデルを並べます。オプションのカスタムウェイトとフロアは[`modelSuggestion`](/ja/reference/configuration#modelsuggestion-optional)にあります。

ChrF、アリーナスコア、入力価格、出力価格を共有する2つのIDはエイリアスです。提案では、より短いID、および`preview-06-05`や`20241022`のように日付が含まれていないIDが、日付が含まれているIDよりも優先されます。他のIDは完全なランキングに残るため、`--list`は設定されたエイリアスを表示でき、それらはテーブル、`--json`、および`--apply`から除外されます。

<a id="reading-the-frontier-column"></a>
#### フロンティア列の読み方

フロンティア列はスコアではなく、ティアです。別のモデルが（ブレンド価格で）より高価でなく、少なくとも同じインデックスを持ち、かつ厳密に安価であるか、インデックスが厳密に高い場合、そのモデルは支配されていると見なされます。`2`は`1`の2倍悪いわけではなく、ティアの数値は行間の品質を比較しません。それを比較するのはインデックスのみです。2つの行が`3`と`4`を表示していても、両方を上回るティア1モデルから1ポイント以内に収まることがあります。

- `1`は、他のどのモデルもより安価でインデックスがより高いわけではないことを意味します。`--price`では、ティア1は最も安価なものから最も高価なものへと続き、各ステップはより高価になり、インデックスも高くなります。`--min-delta`は、わずかな利点しか追加しないステップを隠します。
- `2`は、そのモデルが支配されているが、ティア1モデルによってのみ支配されていることを意味します。テーブルの下の行には、支配されている各行を上回るティア1モデルの名前が記載されています。ダッシュボードの値をホバーすると、同じモデルが表示されます。
- `3`以降も、同じルールがさらに1ステップ下に進みます。数値が高いほどチェーンは長くなり、インデックスが最高のモデルから遠ざかるわけではありません。
- `—`は、そのモデルに価格がない、品質フロアを下回っている、または別の行のエイリアスであることを意味します。これは比較されません。

ティア1は効率性チェックです。厳密に安価で、かつスコアが高いものは他にありません。より高いティアもリストに含めることができます。ベンダーの多様性、レート制限、レイテンシ、コンテキストウィンドウはインデックスの対象外であり、ティア1モデルがレート制限されたりバッチを拒否したりした場合でも、別のベンダーからのフォールバックは依然として役立ちます。同じモデルの別のIDは、その役には立ちません。

エイリアスではない完全な同点（同じブレンド価格とインデックスで、トークン価格またはスコアが異なる場合）は、ティアを共有します。インデックスはテーブルに示されているように比較され、小数点以下1桁に丸められます。

ティアはカタログ全体で計算されるため、`--max-price`、`--min-delta`、および`--top`は行を再番号付けせずに非表示にします。完全なリストでティア1のモデルは、価格上限後もティア1のままです。`--max-price`は、予算を超えるモデルを削除します。それは、上限以下のすべての支配されている行を削除するわけではありません。フロンティア列とテーブルの下の行にそれらが表示されます。

`--price`は、ティア1を最も安価なものから最も高価なものへとリストし、次にティア2も同様にリストします。デフォルトである品質は、インデックスでソートされ、フロンティア列をラベルとして扱います。

`suggest-models --refresh`はデータセットを再ダウンロードします。その後、**「モデル」** タブをリロードしてください。

`--json`、`--list`、およびスコア計算式を含むすべてのフラグについては、[suggest-models](/ja/reference/cli-commands/models#suggest-models)を参照してください。

<a id="why-the-list-has-more-than-one-model"></a>
## リストに複数のモデルがある理由

<a id="model-fallback-chain"></a>
### モデルのフォールバックチェーン

`translationModels`は順序付きリストです。CLIは最初のモデルを試します。リクエストが失敗した場合、解析できないレスポンスを受け取った場合、またはテキストが間違った書記体系である場合、そのバッチに対して次のIDを試します。

1つのIDは単一障害点です。モデルはタイムアウトしたり、このツールが拒否するテキストを返したり、ある言語はうまく翻訳し、別の言語はうまく翻訳できない場合があります。よくあるケースは、`hi`がデーヴァナーガリー文字を期待しているのに、ローマ字化されたヒンディー語が使われる場合です。ネイティブスクリプトのロケールでは、ローマ字化された出力は拒否されます。ローマ字化されたままであるべきロケールには、たとえば`hi-Latn`のような明示的な`-Latn`サブタグが必要です。

そのため、リストには複数のIDが含まれており、強度の高いものが最初に来ます。リスト内の順序は、翻訳が試行する順序です。

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

`init`からのプリセットリスト、およびフィールドリファレンス：[設定 —](/ja/reference/configuration#provider-and-providers) `provider` [および](/ja/reference/configuration#provider-and-providers) `providers`。

<a id="check-list-and-benchmark"></a>
## 確認、リスト表示、ベンチマーク

リストがconfigに設定されると、これらのコマンドでそれを検査できます。それらを使用する前に翻訳を実行できます。

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

コマンドの詳細: [CLI — モデルと言語](/ja/reference/cli-commands/models)。

<a id="further-reference"></a>
## 詳細情報

- [LLM プロバイダー](/ja/guide/providers-and-models) — プリセット、API キー、および`-P`を使用したプロバイダーの切り替え。
- [モデルタブ](/ja/guide/translation-dashboard/models) — ダッシュボードでの同じランキング。
- [設定 —](/ja/reference/configuration#provider-and-providers) `provider` [および](/ja/reference/configuration#provider-and-providers) `providers` — `translationModels`、`uiModels`、`localeModels`、タイムアウト、およびコストレート。
- [suggest-models](/ja/reference/cli-commands/models#suggest-models) — フラグ、フィルター、およびスコア計算式。

::: info 外部ベンチマークソース
スコアは外部データソースから計算されます。

- [languagebench ChrF](https://huggingface.co/spaces/fair-forward/languagebench) (CC-BY-SA-4.0ライセンス)
- [LMArena Arena Score](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset) (CC-BY-4.0ライセンス)、および
- [models.dev](https://models.dev/) の価格（MITライセンス）。
:::
