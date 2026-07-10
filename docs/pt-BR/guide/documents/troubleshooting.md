<a id="troubleshooting"></a>
# Solução de problemas

<a id="section-anchor-links-do-not-work-in-translated-docs"></a>
## Links âncora de seção não funcionam em documentos traduzidos

Um link como `[label](other.md#section-id)` pode abrir o arquivo traduzido correto, mas falhar ao rolar até o título pretendido — ou saltar para a seção errada. O fragmento `#…` não corresponde mais a nenhum título `id` nessa localidade.

Causas comuns:

- Os títulos de origem nunca tiveram IDs de âncora explícitas; o site gera slugs a partir do texto visível do título, que muda após a tradução.
- Você renomeou um título na origem, mas a linha `<a id="…"></a>` anterior está ausente ou ainda possui o ID antigo.
- Os links de âncora usam um fragmento `#…` adivinhado a partir de palavras em inglês, em vez do ID que `write-heading-ids` geraria.

**Correção**

1. Execute `ai-i18n-tools write-heading-ids` no seu `.md` / `.mdx` de **origem** (mesmo `docs[]` / `contentPaths` que `translate-docs`). Ele insere `<a id="slug"></a>` antes de cada título ATX, ou atualiza uma âncora existente quando o texto do título não corresponde mais ao slug atual.
2. Aponte os links de âncora para esses IDs — por exemplo, `[setup](guide.md#first-run)` onde `#first-run` corresponde à linha de âncora acima do título de destino, não a um slug inferido apenas do título em inglês.
3. Execute novamente `translate-docs` (ou `sync --force-update`) para que cada cópia em outro idioma inclua as linhas de âncora atualizadas.

Use `--dry-run` em `write-heading-ids` primeiro para visualizar as alterações. Consulte [Links âncora](/pt-BR/guide/documents/anchor-links) para o padrão completo.

<a id="image-or-asset-links-404-in-translated-docs"></a>
## Links de imagem ou ativo retornam 404 em documentos traduzidos

Um link Markdown ou `![alt](url)` funciona em inglês, mas retorna 404 em cópias traduzidas — geralmente porque o URL ainda aponta para a pasta do idioma de origem ou para um caminho estático somente em inglês.

**Correção**

1. Confirme se o layout do seu ativo corresponde ao seu `docsOutput.style` (plano vs. sistema de documentos). Consulte [Reescrita de links](/pt-BR/guide/documents/link-rewriting) e [Imagens e capturas de tela](/pt-BR/guide/images-and-screenshots/).
2. Adicione ou ajuste `docsOutput.postProcessing.regexAdjustments` para trocar segmentos de localidade ou fazer a ponte entre caminhos `/img/…` absolutos. Para layout plano, lembre-se de que o reescritor de link plano é executado **antes** de `regexAdjustments` — combine padrões com o URL já prefixado.
3. Certifique-se de que os arquivos de ativos específicos da localidade existam nos caminhos referenciados pelo Markdown reescrito (`translate-docs` reescreve URLs, mas não copia arquivos raster).
