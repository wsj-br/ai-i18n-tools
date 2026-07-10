<a id="markdown-issues-static-checks"></a>
# Markdown の問題 (静的チェック)

**Markdown issues**タブには、`markdown_source_issues` SQLiteテーブルの行が一覧表示されます。各行は**事前翻訳**の検出結果です。たとえば、`translate-docs`がマスキングに使用するCommonMarkスタイルのルールと同じルールで、強調/取り消し線としてペアにならない区切り文字の連続、バックティックで開かれたが閉じられていないインラインコードスパン、または`STRONG_OUTSIDE_LINK` / `**` / `__`が`[text](url)`リンクを囲んでいる場合（太字はリンクテキスト内のみに配置）などです。

これは、ロケールごとのモデル出力と翻訳後の検証の問題 (`AST mismatch`、プレースホルダーの漏洩など) を記録する**失敗**とは**異なります**。

<a id="when-to-use-it"></a>
## 使用するタイミング

このタブは、トークンを消費する前に**ソース Markdown** を修正したい場合、特に [失敗](/ja/guide/translation-dashboard/failures) タブで品質チェックが構造に関する失敗を繰り返す場合に使用します。

<a id="how-to-use-the-tab"></a>
## タブの使用方法

1. **概要**ストリップを読みます。問題の合計行数と問題コードごとのカウントが表示されます。
2. ファイルパス (`doc-block:{index}:` プレフィックスを含むキャッシュ キーとの部分一致)、**問題コード**、または**ソースハッシュ**でフィルタリングします。
3. **ファイルパス + 行** (デフォルト) または**最新のスキャン時間**で並べ替えます。
4. 🔗 リンク ボタンは、`ai-i18n-tools dashboard` が実行されているターミナルにファイル/行のヒントをログに記録します。

ソースファイルを修正してから、翻訳を再実行します。

<a id="refreshing-rows"></a>
## 行の更新

| コマンド / イベント | 効果 |
| --- | --- |
| `ai-i18n-tools check-markdown` | 設定されたドキュメントを再スキャンします。オプションの `-p` / `--path` スコープ、`--no-cache`、`--json` |
| `translate-docs` (デフォルト) | `docs[].warnMarkdownSourceIssues` が `false` でない場合、各 Markdown ファイルの行を再スキャンして置き換えます |
| ファイルパスのすべての翻訳を削除する | そのファイルパスの Markdown の問題の行を削除します (失敗と同じクリーンアップ) |
| `cleanup` | `markdown_source_issues` テーブル全体をクリアし、`sync --force-update` を実行して行を再入力します |

<a id="common-issue-codes"></a>
## 一般的な問題コード

| コード | 意味 |
| --- | --- |
| ペアになっていない強調 / 取り消し線 | CommonMark ルールで閉じられない区切り文字の連続 |
| 閉じられていないインライン コード | バックティック スパンが開いているが閉じられていない |
| `STRONG_OUTSIDE_LINK` | 太字マーカーが Markdown リンクを囲んでいます。太字をリンク テキスト内に移動してください |

以下も参照してください: [複雑な Markdown と品質チェックの失敗](/ja/guide/documents/#complex-markdown-and-failed-quality-checks)。
