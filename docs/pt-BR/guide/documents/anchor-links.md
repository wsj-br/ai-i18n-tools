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

1. Execute `ai-i18n-tools write-heading-ids` no seu código-fonte `.md` / `.mdx` antes de `translate-docs` (mesmo `docs[]` / `contentPaths` de costume). Ele insere âncoras HTML explícitas na linha anterior a cada título, de modo que os valores `id` sejam compartilhados por todas as cópias traduzidas. Execute novamente após renomear títulos para que IDs de âncora obsoletos sejam atualizados e correspondam ao título atual.
2. Aponte seus **links âncora** do markdown para esses IDs estáveis, por exemplo, `[label](other.md#section-id)`, onde `section-id` corresponde à âncora escrita pela ferramenta — não apenas uma suposição baseada em palavras em inglês.

<a id="example"></a>
## Exemplo

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

Se os links ainda falharem após a tradução, consulte [Solução de problemas](/guide/documents/troubleshooting).
