<a id="anchor-links"></a>
# アンカーリンク

`docsOutput.style = "flat"` 時、出力は各ロケールのページ間の**相対パス**を書き換えます（`guide.md` → `guide.de.md`）。**アンカーリンク** — パスの後に `#` を付ける通常のmarkdownインライン形式 — は、ターゲットファイル内のセクションにジャンプします：

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

ここでは、リンクのターゲットは`setup.md`、`#first-run`はアンカーです。そのファイル内の適切な見出しにスクロールする必要があります。

<a id="why-anchor-links-need-attention"></a>
## アンカーリンクに注意が必要な理由

- `rewriteRelativeLinks`は各ロケールの**ファイル名**を修正します（`setup.md` → `setup.de.md`）。
- 多くのレンダラーは**表示される見出しのテキスト**から`#`スラグを生成します。翻訳後、ロケールごとに見出しが異なるため、自動生成されたスラグが変化する一方で、書き換えられたリンクはまだ`#first-run`を指している可能性があります。つまり、英語の`#…`アンカーが、翻訳された見出しからレンダラーが生成するスラグと一致しなくなる場合があります。
- 結果として、読者は正しい**ファイル**には到達しますが、**間違った行**に移動するか、ブラウザが一致する見出しを見つけられません。

<a id="what-to-do"></a>
## 実行すること

<a id="docusaurus-sites-preferred"></a>
### Docusaurusサイト (推奨)

[Docusaurus](/ja/guide/integrations/docusaurus) のドキュメント (`docsOutput.style = "docusaurus"`) では、`ai-i18n-tools write-heading-ids` からの HTML アンカーではなく、Docusaurus のネイティブな見出し ID を優先してください:

1. 見出し行に明示的なIDを追加します。Docusaurusの従来の`{#…}`サフィックス（CommonMark）またはMDXコメント`{/* #… */}`（`.mdx`ではこちらが推奨されます）を使用し、`## TLS configuration {#tls-configuration}`や`## TLS configuration {/* #tls-configuration */}`のように記述します。`translate-docs`中は、表示される見出しテキストのみがモデルに送信されます。IDサフィックスは最初に削除され、翻訳された見出し行の**end**に再度固定されます（Docusaurusはタイトルの途中にある`{/* #id */}`を無視します）。
2. Docusaurusプロジェクトのルート（`package.json`に組み込まれている場合は`pnpm run write-heading-ids`であることが多いです）から`docusaurus write-heading-ids`を実行し、IDがない見出しにIDを追加または更新します。`{/* #… */}`形式には`--syntax mdx-comment`を使用します。あるいは、同じ`docs[]` / `contentPaths`に対して`ai-i18n-tools write-heading-ids --slug-style mdx-comment`を実行します。このコマンドは、既存の翻訳ファイル内の同じ英語のIDの位置を修正し（翻訳されたタイトルをスラッグ化しません）、セグメント数が一致する場合は一致するキャッシュセグメントも更新するため、その後の`sync --force-update`で修正されたIDが保持されます。見出しの名前を変更した後は再実行して、古いIDが現在のタイトルと一致するようにします。

Markdown の **アンカーリンク** はこれらの安定した id を指すようにしてください。例: `[label](other.md#tls-configuration)`。ここでフラグメントは `{#…}` または `{/* #… */}` の id に一致し、英語の単語のみから推測されたスラッグではありません。このパターンを使用したコミット済みドキュメントについては、[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) を参照してください。

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### その他のレイアウト (フラット、Starlight、VitePressなど)

Docusaurus を使用していない場合、または `{#…}` / `{/* #… */}` サフィックスの代わりに HTML アンカーが必要な場合:

1. `translate-docs`の前に、ソース`.md` / `.mdx`に対して`ai-i18n-tools write-heading-ids`を実行します（通常と同じ`docs[]` / `contentPaths`です）。これにより、各見出しの前の行に明示的なHTMLアンカーが挿入され、`id`値がすべての翻訳コピーで共有されるようになり、同じ英語のIDが既存の翻訳ファイルにコピーされます。セグメント数が一致する場合、一致するキャッシュセグメントも更新されるため、その後の`sync --force-update`で修正されたIDが保持されます。見出しの名前を変更した後は再実行して、古いアンカーIDが更新され現在のタイトルと一致するようにします。
2. マークダウンの**anchor links**をそれらの安定したIDに向けます（例: `[label](other.md#section-id)`）。ここで、`section-id`はツールが書き込んだアンカーと一致する必要があります。英語の単語だけからの推測ではありません。

<a id="example"></a>
## 例

<a id="docusaurus------suffix"></a>
### Docusaurus `{#…}` / `{/* #… */}` サフィックス

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (英語ソース、クラシック):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

または MDX 推奨のコメント形式:

```markdown
## TLS configuration {/* #tls-configuration */}

Your CA and cert steps…
```

`translate-docs`の後、リンクのフラグメントはすべてのロケールで `#tls-configuration` のまま維持され、変更されるのは見出しテキストとリンクラベルのみです。

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### HTMLアンカー (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`write-heading-ids`後の`docs/security.md`（簡略化）:

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

`translate-docs`後、ファイルパスと`#…`アンカーはすべてのロケールファイルで一致したままになります。たとえば:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

`#tls-configuration`アンカーは、`id`がソースで固定されているため、すべてのロケールで同じです。見出しの**テキスト**とリンクの**ラベル**のみが翻訳されます。

翻訳後もリンクが機能しない場合は、[トラブルシューティング](/ja/guide/documents/troubleshooting)を参照してください。
