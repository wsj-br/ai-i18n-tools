# Teste para uma tradução somente em markdown (sem pipeline de strings de interface)

## Alternativas à tradução

1. **Reformular…** — clique em **Reformular…** acima da saída para obter outra tradução completa da mesma entrada com palavras diferentes. Você pode armazenar até **cinco** versões e alternar entre elas no menu suspenso de versões. **Reformular…** é desativado quando você atinge cinco versões.
2. **Alternativas de palavras** — selecione uma ou mais palavras na saída (se você selecionar apenas parte de uma palavra, o aplicativo expande a seleção para palavras completas), depois clique com o botão direito. Uma lista curta de alternativas aparece no cursor; clique em uma para substituir a seleção. Se você tiver menos de cinco versões, a saída editada é salva como uma nova versão; com cinco versões, apenas a **versão 5** é atualizada. Você deve selecionar texto antes de clicar com o botão direito; clicar com o botão direito sem seleção não faz nada. Pressione **Esc** ou clique fora da lista para cancelar sem alterar a saída.
3. **Custos** — cada clique em **Reformular…** e cada solicitação de alternativa de palavra usa novamente o modelo e pode aumentar o custo de uso (o mesmo que uma execução normal de tradução).

## Formatação de texto
O tradutor deve manter toda a formatação embutida sem alterar a marcação:

- **Texto em negrito** indica importância e deve permanecer em negrito após a tradução.
- _Texto em itálico_ é usado para ênfase ou títulos; o significado deve ser preservado.
- ~~Tachado~~ marca conteúdo obsoleto ou removido.
- `inline code` é **nunca** traduzido — identificadores, nomes de funções e caminhos de arquivos devem permanecer inalterados.
- Um [hiperlink](https://github.com/wsj-br/ai-i18n-tools) mantém sua URL original; apenas o rótulo do link é traduzido.

## Código difícil de traduzir dentro de formatação

isto é um código dentro de negrito: **`code`** - não deve ser traduzido
isto é um código dentro de itálico: *`code`* - não deve ser traduzido
isto é um código dentro de tachado: ~~`code`~~ - não deve ser traduzido
isto é um código dentro de um hiperlink: [**`code`**](https://github.com/wsj-br/ai-i18n-tools) - não deve ser traduzido
isto é um código dentro de negrito e itálico: **_`code`_** - não deve ser traduzido
isto é um código dentro de negrito e tachado: **~~`code`~~** - não deve ser traduzido
isto é um código dentro de itálico e tachado: *~~`code`~~* - não deve ser traduzido
isto é um código dentro de negrito, itálico e tachado: **_~~`code`~~_** - não deve ser traduzido

Aqui está um **longo** parágrafo projetado para testar formatação mista *embutida* e de código. Ao usar `async/await`, erros devem ser tratados corretamente—nunca escreva `catch (e) {}`. Sempre destaque variáveis críticas com **`importantFlag`**, e ao escrever configuração, use _`configKey`_ com cuidado. Algumas funções, como **`runProcess()`**, exigem atenção especial aos detalhes, enquanto _processar_ os dados em um loop como `for (const item of items) { ... }` garante que nada seja perdido. Lembre-se, eficiência importa: tente otimizar seu código, por exemplo, substituindo chamadas **síncronas** por **`Promise.all()`** sempre que possível para processamento concorrente. Se você codificar valores como _`42`_, certifique-se de documentar o motivo. E no caso de precisar de ênfase em itálico com código, use _`dynamicStyle`_—ou até mesmo **_`criticalPath`_**—para deixar claro! Sempre que referenciar caminhos de arquivos, use `./src/main.ts`, mas destaque os críticos como **`./src/important.ts`** para ênfase. Em resumo, *bom código* combina clareza, correção e **`efficiency`** em cada etapa.

## Tabelas
Tabelas são uma fonte comum de erros de tradução. Cada célula é traduzida individualmente; separadores de coluna e sintaxe de alinhamento são preservados.

| Recurso                | Status         | **Notas**                                                        |
|------------------------|----------------|------------------------------------------------------------------|
| Tradução Markdown      | ✅ Estável      | Segmentos armazenados em cache no SQLite                         |
| Extração de strings de interface | ✅ Estável      | Lê chamadas `t("…")`                                             |
| Strings de interface no plural | ✅ Estável      | `t("…", { plurals: true, count })`; catálogo + sufixos JSON planos |
| Tradução de rótulos JSON | ✅ Estável      | JSON da barra lateral/navegação do Docusaurus                    |
| Tradução de texto SVG | ✅ Estável | Preserva a estrutura SVG |
| Aplicação de glossário | ✅ Estável | Glossário CSV por projeto |
| Concorrência em lote | ✅ Configurável | chave **`batchConcurrency`** |

## Texto regular

Quando o verão chega à cidade, as manhãs cedo são preenchidas com os sons de caminhões de entrega e o canto distante dos pássaros. O ar é denso com a promessa de calor, mas as ruas permanecem frescas à sombra das árvores altas e antigas que margeiam cada avenida. Os moradores trocam acenos ao passar, suas rotinas coreografadas para evitar o forte brilho do meio-dia, reunindo-se em vez disso para um café em lojas de esquina que já viram gerações chegarem e partirem.

Nos fins de semana, a praça do mercado se transforma em um mosaico de cores e aromas. Vendedores organizam seus produtos em pilhas cuidadosas: tomates brilhantes ao lado de ervas perfumadas, mel brilhando em potes de vidro. Risos flutuam sobre o barulho de cestas e bicicletas enquanto crianças correm entre as barracas, sempre atraídas pela banca de flores com girassóis erguendo-se acima de todas as cabeças.

À noite, as luzes acendem-se uma a uma nas janelas dos apartamentos, e a cidade retoma um ritmo mais calmo. Conversas ecoam dos terraços, descendo até os pátios onde vizinhos compartilham histórias e animais de estimação descansam preguiçosamente. À medida que o céu escurece, o suave zumbido da vida noturna se instala — um lembrete gentil de que, assim como o dia desvanece suavemente na noite, todo fim promete um novo começo.
