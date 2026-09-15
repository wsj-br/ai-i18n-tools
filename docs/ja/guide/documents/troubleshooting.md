<a id="troubleshooting"></a>
# トラブルシューティング

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## 翻訳されたドキュメントでセクションアンカーリンクが機能しない

`[label](other.md#section-id)`のようなリンクは、正しい翻訳済みファイルを開くことはできるが、目的の見出しにスクロールできなかったり、誤ったセクションにジャンプしたりする可能性がある。`#…`のフラグメントは、そのロケールのどの見出し`id`とも一致しなくなっている。

一般的な原因:

- ソースの見出しに明示的なアンカーIDが設定されていない。サイトは表示されている見出しテキストからスラグを生成しているため、翻訳後に変更される。
- ソースで見出し名を変更したが、直前の`<a id="…"></a>`行が欠落しているか、古いIDのままになっている。
- アンカーリンクが英単語から推測された`#…`フラグメントを使用しており、`write-heading-ids`が生成するIDではなくなっている。

**修正方法**

1. **ソース**の`.md` / `.mdx`で`ai-i18n-tools write-heading-ids`を実行します（`translate-docs`と同じ`docs[]` / `contentPaths`）。デフォルトでは、各ATX見出しの前に`<a id="slug"></a>`を挿入するか、見出しテキストが現在のスラグと一致しなくなった場合に既存のアンカーを更新します。DocusaurusのMDXコメントIDには、`--slug-style mdx-comment`を使用します。
2. アンカーリンクの宛先をこれらのIDにします。例えば、`[setup](guide.md#first-run)`において、`#first-run`は対象見出しの上にあるアンカー行に一致し、英語タイトルのみから推測されたスラグではありません。
3. `translate-docs`（または`sync --force-update`）を再実行し、すべてのロケールコピーに更新されたアンカー行が含まれるようにします。

変更をプレビューするには、まず`--dry-run`で`write-heading-ids`を使用します。完全なパターンについては、[アンカーリンク](/ja/guide/documents/anchor-links)を参照してください。

<a id="image-or-asset-links-404-in-translated-docs"></a>
## 翻訳されたドキュメントで画像またはアセットのリンクが404になる

Markdown リンクまたは `![alt](url)` は英語では機能しますが、翻訳されたコピーでは 404 を返します。これは、URL がソースロケールフォルダーまたは英語のみの静的パスを指していることが原因であることがよくあります。

**修正方法**

1. アセットのレイアウトが `docsOutput.style` (フラット vs ドキュメントシステム) と一致していることを確認します。[リンクの書き換え](/ja/guide/documents/link-rewriting) および [画像とスクリーンショット](/ja/guide/images-and-screenshots/) を参照してください。
2. ロケールセグメントを交換したり、絶対 `/img/…` パスをブリッジしたりするために、`docsOutput.postProcessing.regexAdjustments` を追加または調整します。フラットレイアウトの場合、フラットリンクの書き換えは **前に** `regexAdjustments` が実行されることを覚えておいてください。すでにプレフィックスが付けられた URL に対してパターンを照合します。
3. 書き換えられた markdown が参照するパスにロケール固有のアセットファイルが存在することを確認します (`translate-docs` は URL を書き換えますが、ラスターファイルをコピーしません)。

<a id="hindi-arabic-cjk-or-cyrillic-output-is-romanized-latin-letters"></a>
## ヒンディー語、アラビア語、CJK、またはキリル文字の出力がローマ字化（ラテン文字）される

一部のモデルは意味を翻訳しますが、結果をラテン文字（ローマ字）で出力することがあります（例えば、ヒンディー語が `नमस्ते` ではなく `Namaste` として出力される）。`hi` 単独はデーヴァナーガリー文字を意味します。ローマ字化されたヒンディー語が必要な場合のみ `hi-Latn` を使用してください。

**修正方法**

1. ロケールコードが目的のスクリプトと一致していることを確認します（`hi` と `hi-Latn`、`zh-Hans` と `zh-Hant`、`sr` と `sr-Latn`）。
2. 誤ったスクリプトのキャッシュ行が拒否されるように翻訳を再実行します: UI 文字列には `translate-ui --force`、または `translate-docs --check-cache` / `sync --check-cache`（ファイルレベルのスキップは、想定スクリプトが設定されたロケールでのみバイパスされます。有効なセグメントキャッシュは引き続き再利用されます）。`--force-update` はすべてのロケールを再処理します。
3. モデルがスクリプトチェックに繰り返し失敗する場合は、そのロケールの `localeModels` エントリを追加して、より強力なモデルが最初に試されるようにします — [プロバイダーとモデル](/ja/guide/providers-and-models#model-fallback-chain) を参照してください。
