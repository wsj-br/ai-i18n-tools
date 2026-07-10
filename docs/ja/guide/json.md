<a id="json"></a>
# JSON

UI のコピーをソースの `src/i18n/en/translation.json` ではなく、**ロケールごとにネストされた JSON ファイル** (例: `t("…")`) に保持するプロジェクト向けに設計されています。CLI はこれらのファイル内の文字列値を走査し、アクティブな LLM プロバイダーを介してそれらを翻訳し、`json[].outputPathTemplate` を使用してロケールごとの出力を書き込みます。`translate-docs` および `translate-svg` と同じ SQLite キャッシュ (`cacheDir`) を使用します。

このパイプラインは実行し**ない** `extract` — カタログ`strings.json`はありません。それを有効にするには、`features.translateJson`とトップレベルの`json[]`に1つ以上のエントリが必要です。

<a id="per-locale-model-overrides"></a>
### ロケールごとのモデルオーバーライド

`translate-json`はモデルを**ターゲットロケール**ごとに解決します: `localeModels(locale)`は最初に構成されたときに、次に`translationModels`。ネストされたJSONバンドルの特定のロケールに専用のモデルが必要な場合にこれを使用します。たとえば、`zh-Hans` / `zh-Hant`テーマファイル。詳しくは、[プロバイダーとモデル](/guide/providers-and-models#model-fallback-chain)を参照してください。

<a id="step-1-initialise-for-nested-json"></a>
### ステップ 1: ネストされたJSON向けに初期化

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

このテンプレートは `features.translateJson: true` を設定し、UI抽出およびドキュメント翻訳を無効化し、`src/i18n/en/translation.json` を指し、出力先が `src/i18n/{llocale}/translation.json` である単一の `json[]` ブロックをスキャフォールドします。リポジトリのレイアウトに合わせて `sourceLocale`、`targetLocales`、`contentPaths`、`outputPathTemplate` を編集してください。

<a id="step-2-configure-json"></a>
### ステップ 2: `json[]` の設定

各 `json[]` ブロックは1つのパイプラインを記述します:

- `contentPaths` — 1つ以上の `.json` ファイル、ディレクトリ、またはグロブ（例: `"src/i18n/en/translation.json"` または `"src/i18n/en/overrides/*.json"`）。パスはプロジェクトルートから解決されます。
- `outputPathTemplate` — 必須。各ターゲットロケールファイルの書き出し先。プレースホルダー: `{locale}`、`{LOCALE}`、`{llocale}`（小文字のロケール。Astroのルートフォルダーに便利）、`{stem}`、`{basename}`、`{extension}`、`{relativeToSourceRoot}`。
- `targetLocales`（オプション）— このブロックのみのサブセット。指定しない場合、ルートの `targetLocales` が適用されます。
- `keyPolicy` — どのJSONキーが翻訳対象の文章を保持しているか、安定した識別子かを区別します（以下参照）。
- `description`（オプション）— CLIのヘッダーおよび `status` 出力に表示されます。

例（複数のソースファイル、小文字ロケールフォルダー）:

```json
{
  "sourceLocale": "en",
  "targetLocales": ["de", "fr", "pt-BR"],
  "features": {
    "translateJson": true
  },
  "cacheDir": ".translation-cache",
  "json": [
    {
      "description": "App UI bundle",
      "contentPaths": [
        "src/i18n/en/translation.json",
        "src/i18n/en/overrides/*.json"
      ],
      "outputPathTemplate": "src/i18n/{llocale}/{basename}",
      "keyPolicy": {
        "mode": "denylist",
        "skipKeys": ["id", "slug", "href", "url", "key", "code"],
        "translateKeys": []
      }
    }
  ]
}
```

**`keyPolicy`**

| `mode`      | 動作 |
|-------------|-----------|
| `allowlist` | `translateKeys` に一致するキー（ドットパス、minimatchグロブ）のみ翻訳されます。 |
| `denylist`  | `skipKeys` に一致するキーを除き、すべての文字列値を翻訳します。 |
| `both`      | 最初に `translateKeys` を適用し、次に `skipKeys` からの一致を除外します。 |

パスにはドット表記（`nav.home.label`）を使用します。`slug` のような単独の名前は、任意の深さで最終キーのセグメントに一致します。

<a id="step-3-translate-json-bundles"></a>
### ステップ 3: JSONバンドルの翻訳

```bash
npx ai-i18n-tools translate-json
```

オプションフラグ（`translate-docs` と同じ概念）: ターゲットのサブセット用に `-l` / `--locale`、ファイルの制限用に `-p` / `--path`、`--dry-run`、`--force`（一致するファイルのファイル追跡およびセグメントキャッシュをクリア）、`--force-update`（ファイルハッシュが一致する場合に再処理。セグメントキャッシュは引き続き適用）、`-b` / `--batch-concurrency`、`--prompt-format`（`xml` \| `json-array` \| `json-object`）。

JSONのみのプロジェクトは以下を実行できます:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

UIまたはドキュメントも有効になっている場合、`sync` は **translate-docsの後にtranslate-json** を実行します（`--no-json` の場合を除く）。`--no-json` でJSONをスキップできます。

ファイルおよびロケールごとのカバレッジを確認してください:

```bash
npx ai-i18n-tools status
```

`translateJson` がオンの場合、`status` は `json[]` セクションを出力します（✓ 最新、● 古いまたは欠落）。

<a id="json-vs-other-pipelines"></a>
### JSONと他のパイプラインの比較

| 状況 | 使用法 |
|-----------|-----|
| JS/TS/Astro の `t("…")` / `i18n.t("…")` の UI 文字列 | [UI 文字列](/guide/ui-strings/) — `extract` + `translate-ui` |
| Docusaurus `write-translations`カタログ (`{ "key": { "message": "…", "description": "…" } }`) | ドキュメント — `docs[].docusaurusCatalogDir` + `translate-docs`、`json[]`は**使用しません** |
| VitePress テーマ/ナビ/サイドバー文字列 | ドキュメント — `docsOutput.vitepressThemeCatalog` + `translate-docs`; `json[]`を**使用しないで**ください — [VitePress インテグレーション](/guide/integrations/vitepress)を参照 |
| Nextra `_meta.ts` ラベルおよびテーマ辞書 `.ts` | ドキュメント — `translate-docs`（`style: "nextra"`時に`_meta`を自動、オプションで`nextraDictionaryPath`）; `json[]`を**使用しないで**ください — [Nextra インテグレーション](/guide/integrations/nextra)を参照 |
| Fumadocs `meta.json` ラベルおよび UI オーバーライドカタログ | ドキュメント — `translate-docs`（`style: "fumadocs"`時に`meta.json`を自動、オプションで`fumadocsUiCatalog`）; `json[]`を**使用しないで**ください — [Fumadocs インテグレーション](/guide/integrations/fumadocs)を参照 |
| スタンドアロンのネストされたロケールJSON (ZenBrowserスタイルの`translation.json`ツリー) | JSON — `json[]` + `translate-json` |
| `<text>` / `<title>` / `<desc>` を含む図解された `.svg` ファイル | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (オプション; 3 つの主要パイプラインのいずれでもありません) |

フィールドリファレンス: [設定リファレンス](/reference/configuration#json)の[`json`](#json)。クリーンアップのキャッシュキーは`file_tracking`で`json-block:{blockIndex}:{projectRelPath}`を使用します。
