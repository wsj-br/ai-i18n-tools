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

1. `translate-docs` の前（通常の `docs[]` / `contentPaths` と同じ）に、ソース `.md` / `.mdx` に対して `ai-i18n-tools write-heading-ids` を実行します。これにより各見出しの前の行に明示的なHTMLアンカーが挿入され、すべての翻訳コピーで `id` 値が共有されます。見出しの名前を変更した後は再実行して、古くなったアンカーIDが現在のタイトルに合わせて更新されるようにします。
2. markdownの**アンカーリンク**をこれらの固定IDを指すようにしてください。例：`[label](other.md#section-id)`。ここで `section-id` はツールが書き込んだアンカーと一致している必要があります — 英語の単語から推測したものではありません。

<a id="example"></a>
## 例

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

翻訳後もリンクが機能しない場合は、[トラブルシューティング](/guide/documents/troubleshooting)を参照してください。
