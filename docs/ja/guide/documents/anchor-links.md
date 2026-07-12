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

[Docusaurus](/ja/guide/integrations/docusaurus) のドキュメント（`docsOutput.style = "docusaurus"`）では、`ai-i18n-tools write-heading-ids`ではなく Docusaurus のネイティブな見出し ID を優先してください。

1. Docusaurus の `{#…}` サフィックスを使用して、見出し行に明示的な id を追加します（例: `## TLS configuration {#tls-configuration}`）。`translate-docs`の際、翻訳されるのは表示される見出しテキストのみであり、`{#tls-configuration}` サフィックスはすべてのロケールで保持されます。
2. Docusaurus プロジェクトのルートから `docusaurus write-heading-ids` を実行して（`package.json`に組み込んでいる場合は通常 `pnpm run write-heading-ids`）、サフィックスのない見出しに `{#…}` サフィックスを追加または更新します。見出しを変更した後は、古い id が現在のタイトルと一致するよう再実行してください。

markdown の **アンカーリンク**をこれらの安定した id に向けます（例: `[label](other.md#tls-configuration)`）。ここでフラグメントは `{#…}` サフィックスに一致し、英語の単語だけから推測したスラッグではありません。このパターンを使用したコミット済みドキュメントについては、[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) を参照してください。

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### その他のレイアウト (フラット、Starlight、VitePressなど)

Docusaurus を使用していない場合、または `{#…}` サフィックスの代わりに HTML アンカーが必要な場合は以下のようにします。

1. `translate-docs` の前（通常の `docs[]` / `contentPaths` と同じ）に、ソース `.md` / `.mdx` に対して `ai-i18n-tools write-heading-ids` を実行します。これにより各見出しの前の行に明示的なHTMLアンカーが挿入され、すべての翻訳コピーで `id` 値が共有されます。見出しの名前を変更した後は再実行して、古くなったアンカーIDが現在のタイトルに合わせて更新されるようにします。
2. markdownの**アンカーリンク**をこれらの固定IDを指すようにしてください。例：`[label](other.md#section-id)`。ここで `section-id` はツールが書き込んだアンカーと一致している必要があります — 英語の単語から推測したものではありません。

<a id="example"></a>
## 例

<a id="example-docusaurus"></a>
### Docusaurus の `{#…}` サフィックス

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md`（英語ソース）:

```markdown
## TLS configuration {#tls-configuration}

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
