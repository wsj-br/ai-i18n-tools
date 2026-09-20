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

1. 見出し行に Docusaurus の従来の `{#…}` サフィックス (CommonMark) または MDX コメント `{/* #… */}` (`.mdx` ではこちらが推奨) で明示的な id を付与します。例: `## TLS configuration {#tls-configuration}` または `## TLS configuration {/* #tls-configuration */}`。`translate-docs` 中は、見出しの表示テキストのみがモデルに送信されます — id サフィックスは最初に取り除かれ、翻訳された見出し行の **末尾**に再び付与されます (Docusaurus はタイトルの中間に配置された `{/* #id */}` を無視します)。
2. Docusaurus プロジェクトのルート (`package.json` に組み込んでいる場合は通常 `pnpm run write-heading-ids`) から `docusaurus write-heading-ids` を実行し、id のない見出しに id を追加または更新します — `{/* #… */}` 形式には `--syntax mdx-comment` を使用します。または、同じ `docs[]` / `contentPaths` で `ai-i18n-tools write-heading-ids --slug-style mdx-comment` を実行します。このコマンドは、既存の翻訳ファイル内の同じ英語 id も再配置します (翻訳されたタイトルのスラッグ化は行いません)。見出しを改名した後は、古い id が現在のタイトルに一致するよう再実行してください。

Markdown の **アンカーリンク** はこれらの安定した id を指すようにしてください。例: `[label](other.md#tls-configuration)`。ここでフラグメントは `{#…}` または `{/* #… */}` の id に一致し、英語の単語のみから推測されたスラッグではありません。このパターンを使用したコミット済みドキュメントについては、[examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) を参照してください。

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### その他のレイアウト (フラット、Starlight、VitePressなど)

Docusaurus を使用していない場合、または `{#…}` / `{/* #… */}` サフィックスの代わりに HTML アンカーが必要な場合:

1. `translate-docs` の前に、ソースの `.md` / `.mdx` で `ai-i18n-tools write-heading-ids` を実行します (通常と同じ `docs[]` / `contentPaths` です)。これにより、各見出しの前の行に明示的な HTML アンカーが挿入され、`id` の値がすべての翻訳コピーで共有されます。また、同じ英語 id が既存の翻訳ファイルにもコピーされます。見出しを改名した後は、古いアンカー id が現在のタイトルに一致するよう再実行してください。
2. Markdown の **アンカーリンク**をこれらの安定した id に向けます。例: `[label](other.md#section-id)`。ここで `section-id` はツールが書き込んだアンカーに一致させます — 英語の単語だけから推測したものではありません。

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
