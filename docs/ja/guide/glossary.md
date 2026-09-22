<a id="glossary"></a>
# 用語集

用語集により、翻訳全体で製品用語の一貫性が確保されます。ユーザーは1つ以上の言語に対して用語の訳語を定義でき、AIモデルは最適な訳を推測するのではなく、この定義済みの訳語を使用します。また、製品名などの特定の用語について、他言語への翻訳時にそのまま保持するよう指定するためにも使用できます。

モデルには2種類のガイダンスが送信されます。

- `glossary.userGlossary`内の**用語行**（一部のパイプラインでは、`glossary.uiGlossary`からの既存のUI翻訳も含む）。行は、そのソース用語が翻訳対象のテキストに出現する場合にのみ含まれます。
- `glossary.contextFiles`内の**プロジェクトコンテキストファイル**。完全なブリーフは、すべてのUI、ドキュメント、JSON、SVG、および校正プロンプトに注入されます。そのセクションは[以下](#project-context-files)にあります。

<a id="how-the-glossary-works"></a>
## 用語集の仕組み

<a id="where-terms-come-from"></a>
### 用語の取得元

| ソース | 構成 | 使用先 |
| --- | --- | --- |
| UIカタログ | `glossary.uiGlossary` — 通常は`ui.stringsJson`と同じパス | `translate-docs`、`translate-json`、`translate-svg` |
| ユーザーCSV | `glossary.userGlossary` | `translate-ui`、`proofread-ui`、`translate-docs`、`translate-json`、`translate-svg` |

`uiGlossary`は`strings.json`にすでに保存されている翻訳をヒントとして再利用するため、ドキュメント、JSON、およびSVGはUIと整合性が保たれます。`translate-ui`と`proofread-ui`は`uiGlossary`を読み取りません。これらはユーザーCSVからのヒントのみを取得するため、不適切なUI翻訳が優先用語としてフィードバックされることはありません。

ユーザーCSVはUIカタログよりも優先されます。`locale`が特定のコードである行は、そのロケールの`*`行とUIカタログ翻訳の両方を置き換えます。`locale`が`*`の場合は、UIカタログからの翻訳をまだ持たないすべての`targetLocales`エントリに同じ翻訳を適用します。

簡潔なUIラベル略語（`Alm.`のような末尾のドット、または`Size` → `Tam`のような短い単一トークン圧縮）は、UI翻訳で引き続き使用できます。ドキュメントプロンプトはこれらをスキップするため、モデルがmarkdownやMDXで<code v-pre>{{…}}</code>トークンを勝手に生成する方向に誘導されることはありません。

<a id="when-a-term-is-sent"></a>
### 用語が送信されるタイミング

マッチングは大文字と小文字を区別せず、単語の境界（空白または句読点）で停止します。長い用語が優先され、重複するマッチは破棄されます。用語が現在のバッチにマッチすると、プロンプトは`"dashboard" → "Tableau"`のようなヒントを受け取ります。その行に**コンテキスト**ノートがある場合、そのノートはそのマッチに対してのみ追加されます。

**コンテキスト**は、ソース言語の使用法ガイダンス（用語の意味や使用方法）です。これは翻訳ではありません。**コンテキスト**ノート、または`glossary.contextFiles`のコンテンツを変更すると、次回の実行時に対象ロケールのキャッシュされた翻訳が更新されます。`--force`は必要ありません。優先**翻訳**のみを変更した場合、`--force`または`--force-update`を渡すまで既存のキャッシュが保持されます。ダッシュボードで編集した行は`user-edited`のままです。

<a id="force"></a>
### 強制

**強制**が`true`、`yes`、または`1`の場合、ソース用語はモデルがそれを参照する前にテキストから削除され、その後優先翻訳が書き戻されます。文言は提案ではなく正確なものです。同じ単語境界と最長マッチのルールが適用されます。モデルが翻訳を優先しつつも語形変化させる可能性がある場合は、**強制**を空（または`false`）にしておきます。

<a id="generate-a-glossary"></a>
## 用語集の生成

`glossary-generate`は、標準ヘッダーを持つ空のCSVを書き込みます。構成からは`glossary.userGlossary`を使用し、そのキーが設定されていない場合は`glossary-user.csv`を使用します。すでに存在するファイルの上書きは拒否されます（終了コード**1**）。

```bash
ai-i18n-tools glossary-generate
# or: ai-i18n-tools glossary-generate -o i18n/glossary.csv
```

構成でファイルを指定します。

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv"
  }
}
```

ダッシュボードから直接CSV用語集ファイルを作成することもできます。[用語集](/ja/guide/translation-dashboard/glossary)タブで最初に**追加**操作を行うと、`glossary.userGlossary`が指定されており、かつファイルがまだ存在しない場合にファイルが作成されます。`glossary.autoAddUserEditedToGlossary`が`true`（デフォルト）の場合、ダッシュボードでUI文字列を修正すると、次回の`translate-ui`の実行時にその変更内容がCSVに追加されます。ダッシュボードはCSV用語集のエディターとしても機能し、UI内で行の追加、編集、またはフィルタリングが行えます。

<a id="csv-columns"></a>
## CSV列

ヘッダー行：

```text
Original language string,locale,Translation,Force,Context
```

`en`または`English`は`Original language string`の代わりに受け入れられます。`Notes`は`Context`の代わりに受け入れられます。

| 列 | 意味 |
| --- | --- |
| **元の言語の文字列** | ソースロケールでのソース用語またはフレーズ |
| **ロケール** | ターゲットロケールコード、またはすべてのターゲットに対する`*` |
| **翻訳** | 推奨される翻訳 |
| **強制** | この表記を必須とする場合は`true`、`yes`、または`1`を指定。それ以外の場合はヒント |
| **コンテキスト** | オプションのソース言語による説明。この用語が一致した場合にのみ送信されます |

<a id="examples"></a>
## 例

各ロケールに対する1つの製品用語、強制適用されるドイツ語のラベル、そしてモデルが文字通り解釈してしまう可能性のある単語を説明するフランス語の行：

```csv
"Original language string","locale","Translation","Force","Context"
"dashboard","*","Tableau","false","The analytics home, not a vehicle panel"
"Save","de","Speichern","true",""
"workspace","fr","espace de travail","false","A user's project container, not an office"
```

プロジェクトブリーフと組み合わせた場合：

```json
{
  "glossary": {
    "uiGlossary": "src/locales/strings.json",
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"],
    "contextMaxChars": 12000
  }
}
```

フィールドリファレンス：[設定の`glossary`](/ja/reference/configuration#glossary)。コマンドリファレンス：[`glossary-generate`](/ja/reference/cli-commands/tools#glossary-generate)。

<a id="project-context-files"></a>
## プロジェクトコンテキストファイル

`glossary.contextFiles`は、単一のCSV行には属さないプロダクトレベルのガイダンス用です。プロダクトの内容、対象ユーザー、トーン、誤訳しやすい用語などが含まれます。設定でcwd相対の1つ以上の`.md` / `.txt`ファイルを指定します。これらは記載順に連結され、すべてのUI、ドキュメント、JSON、SVG、および校正プロンプトに注入されます。

```json
{
  "glossary": {
    "userGlossary": "i18n/glossary.csv",
    "contextFiles": ["i18n/product-context.md"]
  }
}
```

ブリーフは**ソースロケール**で記述し、`glossary.contextMaxChars`（デフォルト`12000`）を大幅に下回るように保ち、そのファイルも翻訳したい場合を除いて`docs[].contentPaths`の外に保存してください。[設定の`glossary`](/ja/reference/configuration#glossary)を参照してください。

<a id="generate-a-context-file-with-an-ai-agent"></a>
### AIエージェントを使用してコンテキストファイルを生成する

エージェント（Cursor、Claude Code、Copilotなど）にリポジトリを読み取らせてブリーフを記述させます。次のようなプロンプトを貼り付けてください。

```text
Create a translation-context Markdown file for this repository at i18n/product-context.md.

This file is injected verbatim into every ai-i18n-tools translation prompt (UI strings, docs, JSON, SVG, proofread). It must stay in the source language of the project (do not translate it). Translators already receive a glossary of preferred term mappings; this file should explain meaning, audience, and register — not duplicate every glossary row.

Requirements:
- Concise: aim for 1–4 KB, hard limit 8000 characters. No full manuals, README dumps, or changelog history.
- Source-language only. Short headings, bullet lists, and a few example sentences are enough.
- No secrets, API keys, credentials, personal data, internal URLs, or unpublished commercial figures.
- Do not invent product facts. If something is unclear, omit it or mark it as unknown.
- Do not put this file under a path that is also listed in docs[].contentPaths.

Cover, in this order:
1. Product in one paragraph: what it is, who uses it, and the default tone (formal / informal / technical).
2. Domain and disambiguation: terms that look ordinary in English but have a product-specific meaning (for example “dashboard” as an analytics home, not a vehicle panel).
3. Features or areas that change register (billing vs. onboarding vs. admin).
4. Things translators must preserve exactly: brand names, CLI flags, config keys, code identifiers, placeholder tokens.
5. Locale notes only when they affect meaning for every target (for example “use formal you”). Do not list per-locale translations here.

Write only the Markdown file. Afterward, remind me to add it to glossary.contextFiles in ai-i18n-tools.config.json if it is not already listed.
```

次回の`sync` / `translate-*`実行前にファイルを確認してください。ファイルを変更すると、その実行で各ロケールのキャッシュされた翻訳が無効化されるため、品質が良好になったらブリーフを安定させてください。
