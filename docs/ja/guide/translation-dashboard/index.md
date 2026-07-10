<a id="translation-dashboard"></a>
# 翻訳ダッシュボード

翻訳ダッシュボードは、プロジェクトの翻訳データを検査および編集するためのローカルWeb UIです。次の3つのストアから読み取ります。

- **SQLiteキャッシュ** (`cacheDir`) — ドキュメントセグメントの翻訳、失敗記録、Markdownの問題スキャン
- **`strings.json`** — UI文字列カタログ（プレーン文字列と複数形グループ）
- **ユーザー用語集CSV** (`glossary.userGlossary`) — `translate-ui`と`proofread-ui`の用語のヒント

翻訳実行後にこれを使用して、SQLiteやJSONを手動で掘り下げることなく、問題を見つけたり、不正な出力を上書きしたり、キャッシュのカバレッジを確認したりできます。

<a id="start-the-dashboard"></a>
## ダッシュボードを起動する

```bash
ai-i18n-tools dashboard
# Optional: choose port, do not auto-open browser
# ai-i18n-tools dashboard -p 8765 --no-open
```

デフォルトのリッスンポートは **8675** です。そのポートが使用できない場合、サーバーは次のポートを試行します（最大1000回の試行）し、使用したポートをログに出力します。非推奨のエイリアス `editor` は引き続き機能しますが警告を出力します。代わりに `dashboard` を使用してください。

ダッシュボードUIはCLIと同じロケール解決を使用します: `-L` / `--ui-lang` → `AI_I18N_LANG` → config `uiLanguage` → OSロケール。[ツールUI言語](/ja/guide/tool-ui-language)を参照してください。

![Translation Dashboard showing the Documentation tab with filters and cached segment rows](/translation-dashboard.png)

<a id="which-tab-should-i-use"></a>
## どのタブを使用すればよいですか？

| 実行したいこと | タブ | ガイド |
| --- | --- | --- |
| 翻訳に失敗したドキュメントセグメントを修正する | **失敗** | [失敗](/ja/guide/translation-dashboard/failures) |
| 翻訳する前にソースMarkdownを修正する | **Markdownの問題** | [Markdownの問題](/ja/guide/translation-dashboard/markdown-issues) |
| キャッシュされたドキュメント翻訳を上書きする | **ドキュメント** | [ドキュメントキャッシュ](/ja/guide/translation-dashboard/documentation-cache) |
| UIラベルを修正する | **UI文字列** | [UI文字列と複数形](/ja/guide/translation-dashboard/ui-strings) |
| 複数形を修正する (`one`、`other`、…) | **UI複数形** | [UI文字列と複数形](/ja/guide/translation-dashboard/ui-strings) |
| UI翻訳の用語をロックする | **用語集** | [用語集](/ja/guide/translation-dashboard/glossary) |
| キャッシュのカバレッジとモデルの使用状況を確認する | **統計** | [統計](/ja/guide/translation-dashboard/statistics) |

<a id="after-you-edit"></a>
## 編集後

| 編集したもの… | 次に実行する… | 避けるべきこと… |
| --- | --- | --- |
| ドキュメントキャッシュ行 | `sync --force-update` または `translate-docs --force-update` | — |
| UI文字列または複数形 | プレーンな `sync` または `translate-ui` | `--force` (`user-edited`行を上書きします) |
| 用語集行 | 次の `translate-ui` または `proofread-ui` | — |

**ドキュメント (SQLite キャッシュ)** — 手動編集はキャッシュ内でモデル `user-edited` でタグ付けされます。変更されていないソースに対して `translate-docs` または `sync` を再実行すると、キャッシュされた翻訳が再利用されます (LLM 呼び出しなし)。ディスク上のマークダウンをキャッシュから更新するには、`sync --force-update` または `translate-docs --force-update` を実行します。キャッシュをバイパスして LLM から再翻訳したい場合 (手動修正を上書きする場合) にのみ `--force` を使用してください。

**UI 文字列 (`strings.json`)** — 手動編集は `models[locale]` 内で `user-edited` でタグ付けされます。`translate-ui` または `sync` を再実行すると、すでに翻訳があるエントリはスキップされます。手動修正を再翻訳して上書きするには、UI コマンドで `--force` を使用します。

<a id="tips"></a>
## ヒント

- **ログリンクボタン** (表の行の 🔗) は、`ai-i18n-tools dashboard` が実行されている**ターミナル**にファイル:行のヒントを出力します。これは、ブラウザからエディタにジャンプするのに便利です。VS Code 派生 IDE (Cursor、Antigravity など) を使用している場合、ターミナルウィンドウのファイル:行リンクを `CTRL` クリックすると、指定された行でファイルを開くことができます。
- **閉じる** (タブバーの右上) は、ダッシュボードサーバーを正常にシャットダウンします。
- ブラウザタブが開いている間にサーバーが停止すると、オーバーレイが表示されます。再接続するには `ai-i18n-tools dashboard` を再起動するか、ダッシュボードでの作業が終了した場合はウィンドウを閉じます。
