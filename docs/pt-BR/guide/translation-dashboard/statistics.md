<a id="statistics"></a>
# Estatísticas

A guia **Estatísticas** mostra agregados somente leitura para o seu cache de documentação e catálogo de strings da interface do usuário. Os dados correspondem a `ai-i18n-tools statistics` na linha de comando.

Use-a para responder: *quanto foi traduzido, quais modelos foram usados e onde estão as lacunas?*

<a id="documentation-cache"></a>
## Cache de documentação

**Cartões de resumo:**

| Cartão | Significado |
| --- | --- |
| Total de segmentos | Todas as linhas de segmento de documento em cache |
| Obsoletos / Ativos | Segmentos nunca reutilizados desde a criação vs. reutilizados pelo menos uma vez |
| Arquivos rastreados / Caminhos de arquivo únicos | Contagens de arquivos no cache |
| Modelos usados | Modelos de tradução distintos |
| Entradas do glossário | Contagem de linhas no CSV do glossário do usuário (quando configurado) |

**Tabelas:**

- **Segmentos por localidade** — contagem por localidade de destino, com detalhamento de obsoletos/ativos
- **Segmentos por modelo** — contagem por modelo
- **Matriz Modelo × localidade** — tabulação cruzada completa (o mesmo que o limite `--max-columns` da CLI na saída do terminal)

<a id="ui-strings"></a>
## Strings da interface do usuário

Exibido quando `strings.json` está disponível:

| Seção | Significado |
| --- | --- |
| Contagens simples vs. plurais | Total de entradas não plurais e de grupos plurais |
| Cobertura simples por localidade | Quantas strings simples têm uma tradução por localidade |
| Completude plural por localidade | Quantos grupos plurais têm todas as formas CLDR necessárias |
| Por modelo / modelo × localidade | Mesmo layout de matriz que o cache de documentação |

<a id="no-editing-on-this-tab"></a>
## Nenhuma edição nesta guia

As estatísticas são somente para visualização. Para alterar os dados, use as outras guias do painel ou execute novamente os comandos de tradução e, em seguida, recarregue o painel.

Para saída de script, execute:

```bash
ai-i18n-tools statistics
# Optional: widen model × locale tables
# ai-i18n-tools statistics --max-columns 12
```
