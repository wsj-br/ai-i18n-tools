<a id="json"></a>
# JSON

Projetado para projetos que mantêm o texto da UI em **arquivos JSON aninhados por localidade** (por exemplo, `src/i18n/en/translation.json`) em vez de `t("…")` no código-fonte. A CLI percorre os valores de string nesses arquivos, os traduz por meio do provedor LLM ativo e grava as saídas por localidade usando `json[].outputPathTemplate`. Ela usa o mesmo cache SQLite que `translate-docs` e `translate-svg` (`cacheDir`).

Este pipeline **não** executa `extract` — não há catálogo `strings.json`. Habilite-o com `features.translateJson` e uma ou mais entradas no `json[]` de nível superior.

<a id="per-locale-model-overrides"></a>
### Substituições de modelo por localidade

O `translate-json` resolve modelos **por localidade de destino**: primeiro `localeModels(locale)` quando configurado, depois `translationModels`. Use isso para pacotes JSON aninhados onde determinadas localidades se beneficiam de modelos dedicados — por exemplo, arquivos de tema `zh-Hans` / `zh-Hant`. Consulte [Provedores e modelos](/guide/providers-and-models#model-fallback-chain).

<a id="step-1-initialise-for-nested-json"></a>
### Etapa 1: Inicializar para JSON aninhado

```bash
npx ai-i18n-tools init -t ui-json-bundles
```

Esse modelo define `features.translateJson: true`, desativa a extração da interface e a tradução de documentos, e cria um bloco `json[]` apontando para `src/i18n/en/translation.json` com saída `src/i18n/{llocale}/translation.json`. Edite `sourceLocale`, `targetLocales`, `contentPaths` e `outputPathTemplate` conforme a estrutura do seu repositório.

<a id="step-2-configure-json"></a>
### Etapa 2: Configurar `json[]`

Cada bloco `json[]` descreve um pipeline:

- `contentPaths` — um ou mais arquivos `.json`, diretórios ou padrões glob (por exemplo, `"src/i18n/en/translation.json"` ou `"src/i18n/en/overrides/*.json"`). Os caminhos são resolvidos a partir da raiz do projeto.
- `outputPathTemplate` — obrigatório. Local onde cada arquivo de localidade de destino será escrito. Marcadores: `{locale}`, `{LOCALE}`, `{llocale}` (localidade em minúsculas, útil para pastas de rotas do Astro), `{stem}`, `{basename}`, `{extension}`, `{relativeToSourceRoot}`.
- `targetLocales` (opcional) — subconjunto apenas para este bloco; caso contrário, o `targetLocales` raiz será aplicado.
- `keyPolicy` — quais chaves JSON contêm texto traduzível versus identificadores estáveis (veja abaixo).
- `description` (opcional) — exibido nos cabeçalhos da CLI e na saída `status`.

Exemplo (múltiplos arquivos de origem, pastas de localidade em minúsculas):

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

| `mode`      | Comportamento |
|-------------|-----------|
| `allowlist` | Apenas chaves que correspondem a `translateKeys` (caminhos com ponto; padrões minimatch) são traduzidas. |
| `denylist`  | Traduz todos os valores string, exceto chaves que correspondem a `skipKeys`. |
| `both`      | Aplica primeiro `translateKeys`, depois remove correspondências de `skipKeys`. |

Os caminhos usam notação por pontos (`nav.home.label`). Um nome simples como `slug` corresponde ao último segmento da chave em qualquer profundidade.

<a id="step-3-translate-json-bundles"></a>
### Etapa 3: Traduzir pacotes JSON

```bash
npx ai-i18n-tools translate-json
```

Sinalizadores opcionais (mesmas ideias do `translate-docs`): `-l` / `--locale` para um subconjunto de destinos, `-p` / `--path` para limitar arquivos, `--dry-run`, `--force` (limpa o rastreamento de arquivos e o cache de segmentos para os arquivos correspondentes), `--force-update` (reprocessa quando o hash do arquivo corresponde; o cache de segmentos ainda se aplica), `-b` / `--batch-concurrency`, `--prompt-format` (`xml` \| `json-array` \| `json-object`).

Projetos apenas com JSON podem executar:

```bash
npx ai-i18n-tools sync --no-ui --no-svg --no-docs
```

Quando a interface ou documentos também estão habilitados, `sync` executa **translate-json após translate-docs** (a menos que `--no-json`). Pule o JSON com `--no-json`.

Verifique a cobertura por arquivo e localidade:

```bash
npx ai-i18n-tools status
```

Quando `translateJson` está ativado, `status` imprime uma seção `json[]` (✓ atualizado, ● desatualizado ou ausente).

<a id="json-vs-other-pipelines"></a>
### JSON vs outros pipelines

| Situação | Uso |
|-----------|-----|
| Strings da UI em `t("…")` / `i18n.t("…")` em JS/TS/Astro | [Strings da UI](/guide/ui-strings/) — `extract` + `translate-ui` |
| Catálogo Docusaurus `write-translations` (`{ "key": { "message": "…", "description": "…" } }`) | Documentos — `docs[].docusaurusCatalogDir` + `translate-docs`, **não** `json[]` |
| Strings de tema/navegação/barra lateral do VitePress | Documentos — `docsOutput.vitepressThemeCatalog` + `translate-docs`; **não** use `json[]` — consulte [Integração VitePress](/guide/vitepress-integration) |
| Rótulos `_meta.ts` do Nextra e dicionário de tema `.ts` | Documentos — `translate-docs` (`_meta` automático quando `style: "nextra"`, `nextraDictionaryPath` opcional); **não** use `json[]` — consulte [Integração Nextra](/guide/nextra-integration) |
| Catálogo de rótulos e substituições de UI do Fumadocs `meta.json` | Documentos — `translate-docs` (`meta.json` automático quando `style: "fumadocs"`, `fumadocsUiCatalog` opcional); **não** use `json[]` — consulte [Integração do Fumadocs](/guide/fumadocs-integration) |
| JSON de localidade aninhada autônoma (árvores `translation.json` estilo ZenBrowser) | JSON — `json[]` + `translate-json` |
| Arquivos `.svg` ilustrados com `<text>` / `<title>` / `<desc>` | `features.translateSVG` + [`svg`](/reference/configuration#svg) + `translate-svg` (opcional; não é um dos três pipelines principais) |

Referência de campo: [`json`](#json) em [Referência de configuração](/reference/configuration#json). As chaves de cache para limpeza usam `json-block:{blockIndex}:{projectRelPath}` em `file_tracking`.
