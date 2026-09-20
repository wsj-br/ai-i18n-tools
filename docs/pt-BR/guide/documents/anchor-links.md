<a id="anchor-links"></a>
# Links âncora

Quando `docsOutput.style = "flat"`, a saída reescreve **caminhos relativos** entre páginas para cada localidade (`guide.md` → `guide.de.md`). **Links âncora** — a forma inline usual do markdown com um `#` após o caminho — saltam para uma seção dentro do arquivo de destino:

```markdown
Read the [installation checklist](setup.md#first-run) before you deploy.
```

Aqui, o destino do link é `setup.md`, e `#first-run` é a âncora: deve rolar até o título correto dentro desse arquivo.

<a id="why-anchor-links-need-attention"></a>
## Por que os links âncora precisam de atenção

- `rewriteRelativeLinks` corrige o **nome do arquivo** para cada localidade (`setup.md` → `setup.de.md`).
- Muitos renderizadores derivam o slug `#` do **texto visível do título**. Após a tradução, os títulos diferem por localidade, então um slug gerado automaticamente pode mudar enquanto o link reescrito ainda pode dizer `#first-run` — ou seu âncora em inglês `#…` não corresponde mais ao slug que o renderizador cria a partir do título traduzido.
- Resultado: os leitores chegam ao **arquivo** certo, mas na **linha errada**, ou o navegador não encontra um título correspondente.

<a id="what-to-do"></a>
## O que fazer

<a id="docusaurus-sites-preferred"></a>
### Sites Docusaurus (preferencial)

Na documentação do [Docusaurus](/pt-BR/guide/integrations/docusaurus) (`docsOutput.style = "docusaurus"`), prefira os IDs de cabeçalho nativos do Docusaurus em vez de âncoras HTML de `ai-i18n-tools write-heading-ids`:

1. Adicione um ID explícito na linha do cabeçalho com o sufixo clássico `{#…}` do Docusaurus (CommonMark) ou o comentário MDX `{/* #… */}` (preferencial para `.mdx`), por exemplo, `## TLS configuration {#tls-configuration}` ou `## TLS configuration {/* #tls-configuration */}`. Durante a `translate-docs`, apenas o texto visível do cabeçalho é enviado ao modelo — o sufixo do ID é removido primeiro e recolocado no **final** da linha do cabeçalho traduzido (o Docusaurus ignora um `{/* #id */}` que caia no meio do título).
2. Execute `docusaurus write-heading-ids` a partir da raiz do seu projeto Docusaurus (geralmente `pnpm run write-heading-ids` quando configurado em `package.json`) para adicionar ou atualizar IDs em cabeçalhos que não os possuem — use `--syntax mdx-comment` para o formato `{/* #… */}`. Alternativamente, execute `ai-i18n-tools write-heading-ids --slug-style mdx-comment` no mesmo `docs[]` / `contentPaths`. Esse comando também reposiciona os mesmos IDs em inglês em arquivos traduzidos existentes (ele não gera o slug do título traduzido). Execute novamente após renomear os cabeçalhos para que os IDs desatualizados correspondam aos títulos atuais.

Aponte seus **links de âncora** markdown para esses IDs estáveis, por exemplo, `[label](other.md#tls-configuration)`, onde o fragmento corresponde ao ID `{#…}` ou `{/* #… */}` — não um slug adivinhado apenas a partir de palavras em inglês. Veja [examples/docusaurus-docs](https://github.com/wsj-br/ai-i18n-tools/tree/main/examples/docusaurus-docs/) para documentos confirmados que usam este padrão.

<a id="other-layouts-flat-starlight-vitepress-etc"></a>
### Outros layouts (flat, Starlight, VitePress, etc.)

Quando você não estiver no Docusaurus, ou precisar de âncoras HTML em vez de sufixos `{#…}` / `{/* #… */}`:

1. Execute `ai-i18n-tools write-heading-ids` em seu `.md` / `.mdx` de origem antes de `translate-docs` (o mesmo `docs[]` / `contentPaths` de sempre). Ele insere âncoras HTML explícitas na linha antes de cada cabeçalho para que os valores `id` sejam compartilhados por cada cópia traduzida, e ele copia esses mesmos IDs em inglês para arquivos traduzidos existentes. Execute-o novamente após renomear os cabeçalhos para que os IDs de âncora desatualizados sejam atualizados para corresponder ao título atual.
2. Aponte seus **links de âncora** markdown para esses IDs estáveis, por exemplo, `[label](other.md#section-id)`, onde `section-id` corresponde à âncora que a ferramenta escreveu — não uma suposição apenas a partir de palavras em inglês.

<a id="example"></a>
## Exemplo

<a id="docusaurus------suffix"></a>
### Sufixo Docusaurus `{#…}` / `{/* #… */}`

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` (fonte em inglês, clássico):

```markdown
## TLS configuration {#tls-configuration}

Your CA and cert steps…
```

Ou formato de comentário preferido do MDX:

```markdown
## TLS configuration {/* #tls-configuration */}

Your CA and cert steps…
```

Após `translate-docs`, o fragmento do link permanece `#tls-configuration` em todos os locais; apenas o texto do cabeçalho e o rótulo do link mudam:

```markdown
Siehe [TLS-Einrichtung](security.md#tls-configuration) für die Zertifikatsschritte.
```

<a id="html-anchors-write-heading-ids"></a>
### Âncoras HTML (`write-heading-ids`)

`docs/overview.md`:

```markdown
See [TLS setup](security.md#tls-configuration) for certificate steps.
```

`docs/security.md` após `write-heading-ids` (simplificado):

```markdown
<a id="tls-configuration"></a>

---

# TLS configuration

Your CA and cert steps…
```

Após `translate-docs`, caminhos de arquivos e âncoras `#…` permanecem alinhados em todos os arquivos de localidade, por exemplo:

```markdown
Siehe [TLS-Einrichtung](security.de.md#tls-configuration) für die Zertifikatsschritte.
```

A âncora `#tls-configuration` é a mesma em todas as localidades porque o `id` é fixo na fonte; apenas o **texto** do título e o **rótulo** do link são traduzidos.

Se os links ainda falharem após a tradução, consulte [Solução de problemas](/pt-BR/guide/documents/troubleshooting).
