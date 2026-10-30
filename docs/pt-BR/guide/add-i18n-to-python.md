<a id="add-i18n-to-a-python-app"></a>
# Adicionar i18n a um aplicativo Python

Esta página pega um aplicativo Python que tem um único idioma e adiciona localidades com ai-i18n-tools. Ela segue um caminho: o modelo `ui-python`, um pequeno auxiliar `i18n.py` e arquivos JSON de traduções. Esse caminho se encaixa em Streamlit, FastAPI, Flask, aplicativos de desktop e scripts.

A maneira mais rápida é dar a um agente de codificação o prompt desta página. Ele configura o config, envolve suas strings, verifica o resultado e pode adicionar um menu de idiomas. Você instala a CLI, escolhe o provedor e inicializa o projeto por conta própria, porque isso requer sua chave de API e suas escolhas. Você também executa a tradução por conta própria, porque ela gasta dinheiro na sua conta.

Usando Django, catálogos Flask-Babel ou GNU gettext, e quer manter essas chamadas? Use [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) em vez disso. Ele mantém `gettext` e escreve arquivos `.po` e `.mo`, sem auxiliar. Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

O fluxo:

1. [Instale o CLI e escolha um provedor](#install-and-choose-a-provider).
2. [Inicialize o projeto](#initialise-the-project) com `init`.
3. [Execute o prompt do agente](#run-the-agent-prompt).
4. [Revise o resultado](#review-the-result).
5. [Escolha modelos e traduza](#choose-models-and-translate), depois verifique um idioma.
6. [Mantenha-o traduzido](#keep-it-translated).

Prefere fazer as alterações você mesmo, ou quer saber o que o prompt faz? [Faça manualmente](#do-it-by-hand) percorre os mesmos passos um por um.

<a id="install-and-choose-a-provider"></a>
## Instalar e escolher um provedor

Você faz esta parte, não o agente. O instalador altera sua máquina, e a chave de API é um segredo que pertence ao seu shell, não a um prompt.

Use o pacote npm quando a máquina já tiver o Node.js `>=22.16.0` ([Instalação](/pt-BR/guide/installation)). Para um projeto Python, instale o executável autônomo (sem Node.js).

Linux e macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

O instalador verifica `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` e o adiciona a `PATH`. Os binários não são autenticados (notarised) nem assinados com Authenticode. Etapas manuais e nomes de ativos: [Executáveis autônomos](/pt-BR/guide/installation#standalone-executables).

Verifique a instalação:

```bash
ai-i18n-tools --version
```

Em seguida, escolha um provedor e defina sua chave de API no shell que executará a tradução. Por exemplo, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

O Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers). Anote o nome do provedor, porque você o passará para `init` na próxima etapa. O agente nunca precisa da chave: ele apenas executa comandos que não fazem chamadas de modelo. Você usa a chave mais tarde, quando [traduz](#choose-models-and-translate).

<a id="initialise-the-project"></a>
## Inicializar o projeto

Você executa isso uma vez, antes do prompt. Ele escreve o config e o auxiliar `i18n.py`, e usa o provedor que você escolheu acima.

Esta página usa um modelo, `ui-python`. Ele escreve o config, o auxiliar `i18n.py` e catálogos JSON. Ele se encaixa nestes aplicativos:

| Seu aplicativo | Observações |
| --- | --- |
| Streamlit | O menu de idiomas precisa de algumas linhas no aplicativo; veja [Adicionar um seletor de idioma](#step-4-add-a-language-switch) |
| FastAPI | A localidade é definida por solicitação |
| Flask | Catálogos JSON planos. Para catálogos Flask-Babel em `translations/`, use a [página gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Pyramid | Mesma configuração que o Flask |
| Aplicativos de desktop (Tkinter, PyQt, PySide) | Reconstrua o texto visível depois que a localidade muda |
| PyWebView | O modelo cobre o shell Python. Traduza sua página HTML separadamente |
| Ferramentas de linha de comando e scripts | O caso mais simples |

Execute init com o provedor que você escolheu (Cheaper Inference neste exemplo):

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
```

Em seguida, edite `sourceLocale` e `targetLocales` em `ai-i18n-tools.config.json`. `sourceLocale` é o idioma das strings na origem. Qualquer idioma BCP-47 é válido; exemplos frequentemente usam `en`.

Execute `init` uma vez. Ele reescreve `ai-i18n-tools.config.json` toda vez, então uma segunda execução descarta as edições que você fez. Se `i18n.py` já contém o marcador `ai-i18n-tools-i18n-py`, o projeto já está inicializado: pule esta etapa.

`init` define `ui.sourceRoots` como `"."`, então `extract` iria escanear o repositório inteiro (testes, scripts, docs). O prompt o restringe ao seu código de aplicativo (manualmente, ou seja, [Etapa 1](#place-the-helper)).

Integração do framework: [Integrações Python](/pt-BR/guide/integrations/python). Formatos de chamada e layout do catálogo: [Aplicativos Python](/pt-BR/guide/ui-strings/python).

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto no seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se você quiser que algo seja omitido, por exemplo, nenhum menu de idiomas, diga isso na mesma mensagem.

O agente primeiro verifica se a CLI, a configuração e `i18n.py` existem, e para com instruções se um deles estiver faltando. Em seguida, ele funciona em três partes:

- A Parte 1 coloca `i18n.py` e `locales/` onde o repositório mantém seu código e aponta a configuração para eles.
- A Parte 2 envolve as strings voltadas para o usuário em `t()` e `_()`, executa `extract` e verifica as chamadas envolvidas com `migrate-python-i18n`.
- A Parte 3 adiciona um menu de idioma, ou uma opção de idioma da CLI e localidade do ambiente.

Ele não instala nem inicializa nada, lê sua chave de API, nem traduz. A tradução é a etapa após a revisão, e você a executa.

````markdown
# Add languages to this Python app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs, that
`ai-i18n-tools.config.json` exists, and that an `i18n.py` containing
`ai-i18n-tools-i18n-py` exists. If any of them is missing, stop now and tell
the user to install ai-i18n-tools and run
`ai-i18n-tools init -t ui-python -P <provider>`, then run this prompt again.
Do not install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API
  and cost money. The user runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not edit `i18n.py` or
  generated files (`strings.json`, per-locale JSON, `ui-languages.json`). Do not
  add another helper module.
- Do not reformat unrelated code. Keep existing blank lines. Run the project's
  formatter and linter at the end. Leave unrelated edits in a dirty tree alone.
  Delete throwaway scripts and do not commit them.

## Part 1 — Place the helper and the catalogs

Skip this part when `i18n.py` and `locales/` already sit with the code that
uses them and the config points at them.

1. Move `i18n.py` and `locales/` together to where this repository keeps its
   code. A script: leave them at the root. A package or `src/` layout: put them
   in the package, beside the modules that import them. `i18n.py` loads
   `locales/` from its own folder, so do not edit paths inside it.
2. In `ai-i18n-tools.config.json`, point `ui.stringsJson`, `ui.flatOutputDir`,
   and `languagesManifestPath` (if it is set) at the new `locales/`. Set
   `ui.sourceRoots` to the application code instead of `"."`.
3. Update imports (`from i18n import t`, or `from mypkg.i18n import t`). If the
   app is installed or shipped (wheel, container), include `locales/*.json` as
   package data.
4. Run `ai-i18n-tools extract` and confirm the catalog is in the new place.

## Part 2 — Wrap strings

The literal in `t("…")` is the source-language sentence and the catalog key.
With the source locale active, the app must behave exactly as before. Text that
is already wrapped needs no change.

- Wrap text a person sees: labels, titles, captions, messages, errors,
  validation text, progress lines, emails. Leave SQL, regexes, file formats, log
  messages, CSS, identifiers, widget keys, status and enum codes, number and
  date formats, and prompts sent to a model.
- Call shapes: `t("Hello, {name}!", name=name)` and `_("Hello, %s!") % name`.
  Placeholders are `{name}`, `{price:,.2f}`, `{rate:.2%}`, or `{item!r}`, passed
  as keyword arguments. No dotted fields: pass `rate=row.rate`. Keep a literal
  `%` away from a printf letter such as `%d`.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`.
- The argument must be a string literal, so `t(variable)` is invisible. Use one
  `t()` per sentence or paragraph, with values as placeholders. Split only where
  the text already branches. Keep markers that the code detects outside `t()`.
- A value that is both stored and shown keeps its source-language value.
  Translate the label where it is displayed, and compare against the stored
  value.
- `t()` at module level runs once and freezes. Call it where the text is shown.
- Put the import with the project's other first-party imports.

Work in passes: list string literals that are not passed to `t` or `_` (a
throwaway script is fine), wrap the user-facing ones, then list again. Treat any
bulk rewrite as a draft and review its diff.

Then run `ai-i18n-tools extract` and `ai-i18n-tools migrate-python-i18n`
without `--write`, and read `migrate-python-i18n-report.md`. It finds calls that
format before the lookup. Apply its edits with `--write` only after reading
them, run `extract` again, and repeat until the dry run lists nothing. Fix
manual-review lines by hand. A clean report does not prove every sentence is
wrapped, so keep scanning. Do not commit the report.

## Part 3 — Language switch

Skip this part only when the program shows no text a person reads (a silent
job or a JSON-only API), or when the user asked you to leave language choice
out. A command-line program still gets this part: it has no menu, but it gets
a language option and the process locale, the same idea as the ai-i18n-tools
CLI (`-L` / `--ui-lang`, then `AI_I18N_LANG`, then a saved setting, then the
operating-system locale).

Goal: one chosen language applies to every `t()` in that run, and a screen can
remember the choice. Work out how this project's framework does it, using these
rules:

1. Choose the locale where one unit of work starts (process start, a request,
   a script rerun, window start-up, a UI event), and call `set_locale` before
   the first `t()`. That includes CLI help, usage errors, and page titles set
   before the body.
2. Choose in this order: the explicit choice (CLI option, selector, `?lang=`),
   the stored choice (settings, cookie, session), the environment, then the
   source locale. Accept only codes from `get_ui_languages()`, matched
   case-insensitively and by language (`pt-br` and `pt` become `pt-BR`).
   `set_locale` does not match. An explicit option or the app's own language
   variable that names an unavailable language warns once, then uses the source
   locale. A locale taken only from the operating system does not warn.
3. Keep the locale local to the unit of work: keep the token from `set_locale`
   and call `reset_locale(token)` in `finally` or a teardown hook. A new thread
   starts in the source locale.
4. On a screen, add a selector built from `get_ui_languages()` (each row has
   `code` and `label`), labelled `t("Language")`, on every screen that should
   switch, and store the choice. A CLI does not get a selector.
5. Make the change visible on the next command, a page reload, `st.rerun()`, or
   a function that re-applies every visible string. Each string is a
   `t("literal")` so the extractor sees it.
6. Set the text direction from `get_direction()` where the framework needs it.

Command-line programs:

- Add `--lang <code>`, `-L <code>`, and `--lang=<code>`, unless the program
  already uses those names. Read the option from the raw arguments before
  argparse builds help, so `--help` is translated too. Document the option in
  that help.
- After the option, read a language environment variable the app already owns.
  Do not read `AI_I18N_LANG`; that variable is only for the ai-i18n-tools CLI.
  With no such variable, use `LC_ALL`, then `LC_MESSAGES`, then `LANG`, and
  ignore a value of `C` or `POSIX`.
- After the environment, use a language already stored in the app's config.
  Then the host locale, then the source locale. Do not add a new config file
  just to remember the language.

Hints, to adapt rather than copy. Web apps: a middleware or before-request hook
chooses the locale, an after-request hook stores the cookie, and templates get
`t`, `_`, and the language helpers. Streamlit: set the locale at the top of the
entry script, before `st.set_page_config`, with a selectbox that has a fixed
`key`, sets `?lang=`, and calls `st.rerun()`; `streamlit_language_selector()`
sets the locale only after it is drawn. Desktop: set the saved locale before
building the window, and refresh the visible text in the selector handler.

## Verify and report

The tests pass, and none leaves a non-source locale active (`reset_locale` needs
the token from `set_locale`). `extract` writes a non-empty catalog. With the
source locale, the output is unchanged.

Report the files changed, skipped strings grouped by reason, plurals left as one
string, one word with several meanings, sentences built from translated pieces,
and any `t()` that runs at import time. Then list the commands for the user, and
do not run them: `ai-i18n-tools suggest-models` (optional),
`ai-i18n-tools translate-ui`, then restart the app.
````

<a id="review-the-result"></a>
## Revisar o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. O texto envolvido deve ser lido da mesma forma que antes, sem reformatação não relacionada. `git diff --stat` mostra o quanto mudou.
- As strings ignoradas e os casos ambíguos no relatório: plurais deixados como uma única string, uma palavra usada como valor armazenado e como legenda, e frases construídas a partir de pedaços traduzidos. Decida-os manualmente.
- `ai-i18n-tools extract` é executado sem problemas, e `strings.json` está na pasta que você espera.
- Seus testes são aprovados, e o aplicativo parece o mesmo no idioma de origem.
- Nenhum script descartável ou `migrate-python-i18n-report.md` foi deixado para trás.

As strings que o agente perdeu aparecem como texto que permanece no idioma de origem mais tarde. [Etapa 2](#wrap-strings) tem um script opcional que imprime texto que não está envolvido.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ela usa sua chave de API e gasta dinheiro em sua conta.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models 
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. Use `--max-output-price` para excluir modelos cujo preço de saída excede um limite. Se você preferir uma GUI, use `ai-i18n-tools dashboard` para selecionar os [modelos](/pt-BR/guide/translation-dashboard/models).

Em seguida, extraia e traduza:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` escreve `strings.json` e `ui-languages.json`. `translate-ui` escreve um arquivo JSON por idioma de destino. Deixe esses arquivos gerados sem edição.

`t()` procura a frase de origem no JSON de localidade. O ID em `strings.json` não é a chave de pesquisa. Um arquivo ausente ou uma chave ausente retorna a frase de origem. O auxiliar mantém o JSON carregado na memória para o processo, incluindo um mapa vazio quando o arquivo estava ausente na primeira pesquisa, então reinicie o aplicativo após `translate-ui`.

<a id="check-one-language"></a>
### Verificar um idioma

Reinicie o aplicativo, mude para um idioma de destino e abra uma página com algumas strings envolvidas. Use o menu de idioma que o agente adicionou ou defina a localidade manualmente. O texto que ainda está no idioma de origem não foi envolvido, é executado no momento da importação ou não tem entrada em `locales/<code>.json`. Verifique o JSON para a frase antes de suspeitar do código.

<a id="keep-it-translated"></a>
## Mantenha traduzido

Execute novamente `ai-i18n-tools sync` (ou `extract` e depois `translate-ui`) após alterar o texto de origem. O cache significa que apenas strings novas ou alteradas vão para o modelo. Execute-o na CI para que as traduções não se desviem. Reinicie o aplicativo após uma execução de tradução para que ele recarregue o JSON. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

Para traduzir `README.md` na mesma execução, faça o scaffold com `--with-readme` (ou adicione o bloco a uma configuração existente). Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faça isso manualmente

Siga estas etapas se preferir fazer as alterações você mesmo, ou se quiser saber o que o prompt faz. Cada etapa corresponde a uma parte do prompt. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#choose-models-and-translate) no final.

1. [Coloque o auxiliar e os catálogos](#place-the-helper) onde este repositório mantém seu código.
2. [Envolva strings](#wrap-strings) em `t()` ou `_()`.
3. [Verifique as chamadas envolvidas](#step-3-check-wrapped-calls) com `migrate-python-i18n`.
4. [Adicione um seletor de idioma](#step-4-add-a-language-switch).

<a id="step-1-place-the-helper-and-the-catalogs"></a>
## Etapa 1: Coloque o auxiliar e os catálogos

`init` escreve estes na raiz do repositório:

| Arquivo | O que é | Editar? |
| --- | --- | --- |
| `i18n.py` | O auxiliar que seu código importa (`t`, `_`, `set_locale`) | Não. É gerado |
| `locales/strings.json` | O cache de extração. O aplicativo nunca o lê | Não. É gerado pelo extrator |
| `locales/<code>.json` | As traduções que o aplicativo carrega, um arquivo por idioma | Não. `translate-ui` as escreve |
| `locales/ui-languages.json` | A lista de idiomas, para um menu de idioma | Não. É gerado pelo extrator |

`i18n.py` carrega `locales/` da pasta em que está. Mova o auxiliar e a pasta `locales/` juntos, e deixe os caminhos dentro de `i18n.py` inalterados.

| Seu repositório | Onde eles vão |
| --- | --- |
| Um script na raiz do repositório | Deixe `i18n.py` e `locales/` onde `init` os escreveu |
| Um pacote, incluindo um layout `src/` | Mova ambos para dentro do pacote, ao lado do código que os importa |

Exemplo: um pacote instalável `mypkg` sob `src/mypkg/` mantém `src/mypkg/i18n.py` e `src/mypkg/locales/`.

Atualize a configuração para o novo local:

```json
{
  "ui": {
    "sourceRoots": ["src/mypkg"],
    "stringsJson": "src/mypkg/locales/strings.json",
    "flatOutputDir": "src/mypkg/locales"
  }
}
```

`sourceRoots` é a pasta que `extract` escaneia. Mantenha-a no pacote do aplicativo para que os testes e arquivos de dados fiquem fora do catálogo. O caminho da lista de idiomas, `languagesManifestPath`, segue `flatOutputDir` quando não está definido. Se a configuração já o define, altere-o para corresponder.

Importe `t` do caminho do módulo que você escolheu: `from i18n import t` na raiz do repositório, ou `from mypkg.i18n import t` dentro de um pacote.

Quando o aplicativo é instalado ou enviado em um contêiner, o JSON de localidade precisa viajar com o pacote. Adicione-o aos dados do pacote (o padrão é relativo ao diretório do pacote):

```toml
[tool.setuptools.package-data]
mypkg = ["locales/*.json"]
```

Confirme com `ai-i18n-tools extract`. O catálogo deve aparecer na nova pasta `locales/`.

<a id="step-2-wrap-strings"></a>
## Etapa 2: Envolver strings

`extract` registra uma string apenas quando ela é um literal passado para `t()` ou `_()`. Importe-os do módulo gerado.

Primeiro, procure a entrada do catálogo e, em seguida, interpole:

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Esses executam a formatação antes de qualquer pesquisa, então o extrator os marca como inseguros. A [próxima etapa](#step-3-check-wrapped-calls) os encontra:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

Envolva o texto que uma pessoa vê: rótulos de widgets, títulos de página, legendas, erros exibidos na UI, linhas de progresso, mensagens de validação e parágrafos que incluem alguns números. Um parágrafo com números interpolados ainda é uma chamada `t()`. Os placeholders são nomes como `{name}`, `{price:,.2f}` ou `{rate:.2%}`. Passe `rate=row.rate`. Um placeholder como `{row.rate:.2%}` é rejeitado.

Deixe a redação original como está. Uma tradução ausente retorna essa frase, então o aplicativo permanece o mesmo no idioma original.

Pule o texto que o programa corresponde ou registra: SQL, regexes, cabeçalhos de arquivo, linhas de logger, CSS, chaves de widget, códigos de enum e prompts que você envia para um modelo. Quando um valor é armazenado e exibido (uma caixa de seleção cuja opção também é comparada no código), mantenha o valor armazenado no idioma original e traduza o rótulo com `format_func`.

`t()` no momento da importação é executado uma vez e mantém o idioma original até que esse módulo seja importado novamente. Chame `t()` quando o widget for construído.

<a id="find-unwrapped-strings"></a>

Trabalhe em etapas: liste literais que não são argumentos de `t()` ou `_()`, envolva os voltados para o usuário e, em seguida, liste novamente. O script abaixo é opcional. Ele imprime candidatos, incluindo f-strings e texto unido com `+`. Ele pula docstrings, SQL e texto sem espaço, então um rótulo curto como `Overview` ainda precisa ser verificado. Exclua-o quando terminar. Um script que reescreve arquivos é um rascunho: mantenha as linhas em branco existentes, coloque a nova importação com as outras importações do projeto, execute o formatador do projeto e revise o diff antes de mantê-lo.

<details>
<summary>Opcional: listar strings que não estão envolvidas</summary>

```python
"""List string literals that are not passed to t() or _().

Usage: python scan_unwrapped.py path/to/package
"""

import ast
import sys
from pathlib import Path

WRAPPERS = {"t", "_", "translate", "gettext", "ngettext", "pgettext"}
SKIP_DIRS = {".venv", "venv", "env", "site-packages", "__pycache__", "node_modules"}
SQL_START = ("SELECT ", "INSERT ", "UPDATE ", "DELETE ", "WITH ", "PRAGMA ")


class Scanner(ast.NodeVisitor):
    def __init__(self) -> None:
        self.hits: list[tuple[int, str]] = []
        self.skip: set[int] = set()

    def mark_docstring(self, body: list[ast.stmt]) -> None:
        first = body[0] if body else None
        if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
            self.skip.add(id(first.value))

    def visit_Module(self, node: ast.Module) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self.mark_docstring(node.body)
        self.generic_visit(node)

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node: ast.Call) -> None:
        func = node.func
        name = func.id if isinstance(func, ast.Name) else getattr(func, "attr", "")
        if name in WRAPPERS and node.args:
            self.skip.add(id(node.args[0]))
        self.generic_visit(node)

    def visit_BinOp(self, node: ast.BinOp) -> None:
        if id(node) in self.skip:
            return
        if not isinstance(node.op, ast.Add):
            self.generic_visit(node)
            return
        pieces: list[ast.expr] = []

        def flatten(item: ast.expr) -> None:
            if isinstance(item, ast.BinOp) and isinstance(item.op, ast.Add):
                flatten(item.left)
                flatten(item.right)
            else:
                pieces.append(item)

        flatten(node)
        texts = [p for p in pieces if isinstance(p, ast.Constant) and isinstance(p.value, str)]
        if not texts:
            self.generic_visit(node)
            return
        joined = "".join(p.value if p in texts else "{...}" for p in pieces)  # type: ignore[union-attr]
        for piece in texts:
            self.skip.add(id(piece))
        self.report(node.lineno, joined)
        for piece in pieces:
            if piece not in texts:
                self.visit(piece)

    def visit_JoinedStr(self, node: ast.JoinedStr) -> None:
        if id(node) not in self.skip:
            parts = [v.value if isinstance(v, ast.Constant) else "{...}" for v in node.values]
            self.report(node.lineno, "".join(str(p) for p in parts))
        # Never report the pieces of an f-string on their own.

    def visit_Constant(self, node: ast.Constant) -> None:
        if id(node) not in self.skip and isinstance(node.value, str):
            self.report(node.lineno, node.value)

    def report(self, line: int, text: str) -> None:
        if " " not in text.strip() or not any(ch.isalpha() for ch in text):
            return
        if text.startswith(SQL_START):
            return
        preview = " ".join(text.split())
        self.hits.append((line, preview if len(preview) <= 140 else preview[:137] + "..."))


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    for path in sorted(root.rglob("*.py")):
        if path.name == "i18n.py" or SKIP_DIRS & set(path.parts):
            continue
        scanner = Scanner()
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except SyntaxError as error:
            print(f"\n# {path}\nskipped, cannot parse with this Python: {error.msg} (line {error.lineno})")
            continue
        scanner.visit(tree)
        if scanner.hits:
            print(f"\n# {path}")
            for line, preview in scanner.hits:
                print(f"{line}: {preview}")


if __name__ == "__main__":
    main()
```

</details>

<a id="step-3-check-wrapped-calls"></a>
## Etapa 3: Verificar chamadas envolvidas

Use esta etapa quando o código contiver chamadas que formatam a string antes da consulta ao catálogo. Isso é típico de encapsulamentos mais antigos e de um "agent slip":

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

`migrate-python-i18n` as reescreve em uma consulta que acontece primeiro. Uma segunda execução não altera nada.

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
t("Hello, {name}!", name=name)
```

Strings simples como `st.write(f"Hello, {name}!")` permanecem como estão. Encapsulá-las é [Encapsular strings](#wrap-strings). Se `extract` estiver limpo e o código não tiver nenhuma das três formas acima, não há nada para reescrever.

Execute-o após `extract` e antes de `translate-ui`, para que o catálogo nunca armazene uma f-string como chave.

```bash
ai-i18n-tools extract
ai-i18n-tools migrate-python-i18n
```

O comando é uma simulação (dry run) até que você passe `--write`. Ele escreve `migrate-python-i18n-report.md`. Leia esse relatório. Quando as edições parecerem corretas:

```bash
ai-i18n-tools migrate-python-i18n --write
ai-i18n-tools extract
```

Execute a simulação novamente. Pare quando ela não listar nenhuma edição e, em seguida, execute os testes do projeto.

As linhas que o comando deixa no lugar (campos de depuração como `{value=}`, especificações de formato aninhadas) são listadas no relatório. Corrija-as manualmente e execute a simulação novamente. `i18n.py` gerado é ignorado. O relatório é um artefato de compilação: exclua-o ou adicione-o ao .gitignore.

Um relatório sem edições significa que as chamadas encapsuladas são seguras. Isso não significa que todas as frases voltadas para o usuário foram encapsuladas. A [lista de literais não encapsulados](#find-unwrapped-strings) é a verificação para isso.

O `--report <path>` opcional altera o caminho do relatório. O `--ui-block` opcional limita a varredura a um bloco de UI.

<a id="step-4-add-a-language-switch"></a>
## Passo 4: Adicionar um seletor de idioma

Todo framework precisa das mesmas quatro coisas:

1. Escolha o local no início de cada solicitação, execução de script ou evento de janela, e chame `set_locale` antes do primeiro `t()`.
2. Aceite apenas os idiomas listados em `ui-languages.json` (`get_ui_languages()`) e combine-os de forma flexível. Os navegadores enviam `pt-br`, enquanto o catálogo é `pt-BR`.
3. Ofereça um seletor construído a partir de `get_ui_languages()`.
4. Lembre-se da escolha.

Abrir `?lang=pt-BR` não faz nada até que o aplicativo o leia. O [prompt do agente](#run-the-agent-prompt) faz tudo isso para aplicativos que possuem uma interface de usuário, e ele descobre o framework por si mesmo. As seções abaixo mostram o resultado para Streamlit, FastAPI, Flask e Tkinter. Outros frameworks seguem as mesmas regras.

<a id="streamlit"></a>
### Streamlit

Um script Streamlit é executado novamente em cada interação, então o local é escolhido no topo do script em cada execução. Ordem:

1. Leia o valor do seletor da execução anterior, depois `?lang=`, depois o local armazenado.
2. Chame `set_locale` com esse código, antes de `st.set_page_config`.
3. Chame `st.set_page_config(page_title=t("…"))`.
4. Desenhe o seletor. Ao alterar, armazene o código, defina `?lang=` e `st.rerun()`.

O valor do seletor prevalece assim que o usuário escolhe. `?lang=` se aplica em uma nova visita, antes que esse valor exista. O menu vive no aplicativo, não em `i18n.py`, então seu rótulo pode ser `t("Language")`. Mostre-o em todas as telas que devem mudar, incluindo uma página de login.

<details>
<summary>Código do widget</summary>

```python
import streamlit as st
from i18n import get_locale, get_ui_languages, set_locale, t


def apply_requested_locale() -> str:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows] or [get_locale()]
    requested = (
        st.session_state.get("lang_selector")
        or st.query_params.get("lang")
        or st.session_state.get("locale")
        or get_locale()
    )
    choice = requested if requested in codes else codes[0]
    set_locale(choice)
    st.session_state["locale"] = choice
    if st.query_params.get("lang") != choice:
        st.query_params["lang"] = choice
    return choice


def render_language_selector() -> None:
    rows = [row for row in get_ui_languages() if row.get("code")]
    codes = [str(row["code"]) for row in rows]
    if len(codes) < 2:
        return
    labels = {str(row["code"]): str(row.get("label") or row["code"]) for row in rows}
    current = get_locale()
    choice = st.sidebar.selectbox(
        t("Language"),
        options=codes,
        index=codes.index(current),
        format_func=lambda code: labels.get(code, code),
        key="lang_selector",
    )
    if choice != current:
        st.session_state["locale"] = choice
        st.query_params["lang"] = choice
        set_locale(choice)
        st.rerun()


apply_requested_locale()
st.set_page_config(page_title=t("My app"))


def main() -> None:
    render_language_selector()
    st.write(t("Hello"))


main()
```

</details>

Altere `from i18n import …` para o caminho do pacote de [Colocar o auxiliar e os catálogos](#place-the-helper). Dê a cada outro widget um `key` fixo e chame `t()` quando o widget for construído. Os rótulos calculados no momento da importação permanecem no idioma de origem após uma troca. Quando um título de página for comparado posteriormente, encapsule ambos os lados: `nav.title != t("Forecast settings")`, porque `nav.title` já está traduzido.

`streamlit_language_selector()` de `i18n.py` é suficiente para um script curto cujo título é uma string simples. Ele chama `set_locale` quando o widget é desenhado, então um `page_title` traduzido acima dele permanece no idioma anterior para aquela execução, e seu rótulo permanece em inglês. Veja `examples/python-streamlit`.

<a id="fastapi-flask-and-tkinter"></a>
### FastAPI, Flask e Tkinter

<a id="choose-the-locale-for-a-request"></a>
#### Escolher o local para uma solicitação

Um aplicativo web tem três fontes para o idioma, nesta ordem: a escolha explícita do visitante (`?lang=`), o cookie que a memoriza e o cabeçalho `Accept-Language` do navegador. O idioma de origem é o fallback.

`set_locale` não valida nem normaliza o que lhe é fornecido. Um navegador que envia `pt-br` ou `pt` obteria silenciosamente o idioma de origem, porque o arquivo de catálogo é `pt-BR.json`. O módulo abaixo faz a correspondência e ignora códigos que não estão em `ui-languages.json`. Salve-o ao lado de `i18n.py` e importe-o do middleware ou hook (use o caminho do pacote quando `i18n.py` estiver dentro de um pacote).

<details>
<summary>request_locale.py</summary>

```python
"""Choose the UI language for a request. Works with any web framework."""

from __future__ import annotations

from i18n import get_ui_languages


def _codes() -> list[str]:
    return [str(row["code"]) for row in get_ui_languages() if row.get("code")]


def source_locale() -> str:
    for row in get_ui_languages():
        if row.get("isSourceLocale"):
            return str(row["code"])
    return (_codes() or ["en"])[0]


def match(candidate: str | None) -> str | None:
    """Map "pt", "pt_br" or "PT-br" onto a language listed in ui-languages.json."""
    if not candidate:
        return None
    wanted = candidate.strip().replace("_", "-").lower()
    codes = _codes()
    for code in codes:
        if code.lower() == wanted:
            return code
    for code in codes:
        if code.lower().split("-")[0] == wanted.split("-")[0]:
            return code
    return None


def from_accept_language(header: str) -> str | None:
    ranked = []
    for part in header.split(","):
        code, _, params = part.strip().partition(";")
        quality = 1.0
        if params.strip().startswith("q="):
            try:
                quality = float(params.strip()[2:])
            except ValueError:
                quality = 0.0
        if code and code != "*" and quality > 0:
            ranked.append((quality, code))
    for _quality, code in sorted(ranked, key=lambda item: -item[0]):
        found = match(code)
        if found:
            return found
    return None


def pick(query: str | None, cookie: str | None, accept_language: str = "") -> str:
    """An explicit choice (?lang=, then the cookie) beats the browser header."""
    return match(query) or match(cookie) or from_accept_language(accept_language) or source_locale()
```

</details>

<a id="fastapi"></a>
#### FastAPI

Escolha o locale no middleware HTTP. Mantenha o token de `set_locale` e redefina-o em `finally`, para que requisições concorrentes mantenham seu próprio idioma. O middleware também salva o cookie quando `?lang=` está presente e envia `Content-Language` e `Vary` para que os caches mantenham uma cópia por idioma. Rotas chamam `t()` e `_()` como de costume. Para páginas HTML, adicione os helpers ao ambiente de template uma vez.

<details>
<summary>Middleware e templates do FastAPI</summary>

```python
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = FastAPI()
templates = Jinja2Templates(directory="templates")
templates.env.globals.update(
    _=_, t=t, current_locale=get_locale, ui_languages=get_ui_languages, direction=get_direction
)


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    code = pick(
        request.query_params.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("accept-language", ""),
    )
    token = set_locale(code)
    try:
        response = await call_next(request)
        if request.query_params.get("lang"):
            response.set_cookie("lang", code, max_age=60 * 60 * 24 * 365, samesite="lax")
        response.headers["Content-Language"] = code
        response.headers.append("Vary", "Accept-Language, Cookie")
        return response
    finally:
        reset_locale(token)


@app.get("/greeting/{name}")
def greeting(name: str) -> JSONResponse:
    return JSONResponse({"message": t("Hello, {name}!", name=name), "locale": get_locale()})


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "home.html", {"name": "Ada"})
```

</details>

Uma API que retorna apenas JSON não precisa de menu. Clientes enviam `Accept-Language` ou `?lang=`. Texto construído após o retorno do middleware, como em uma tarefa em segundo plano ou enquanto uma resposta de streaming é enviada, pode ser executado após a redefinição. Construa-o antes de retornar a resposta.

<a id="flask"></a>
#### Flask

Flask tem um hook para cada tarefa. `before_request` escolhe o locale e mantém o token, `after_request` armazena o cookie, `teardown_request` redefine o locale, e um processador de contexto fornece aos templates `t`, `_`, `get_locale`, `get_ui_languages` e `get_direction`. Pyramid usa a mesma estrutura com um subscriber `NewRequest`.

<details>
<summary>Hooks do Flask</summary>

```python
from flask import Flask, g, render_template, request

from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t
from request_locale import pick

app = Flask(__name__)


@app.before_request
def choose_locale():
    g.locale = pick(
        request.args.get("lang"),
        request.cookies.get("lang"),
        request.headers.get("Accept-Language", ""),
    )
    g.locale_token = set_locale(g.locale)


@app.after_request
def remember_locale(response):
    if request.args.get("lang"):
        response.set_cookie("lang", g.locale, max_age=60 * 60 * 24 * 365, samesite="Lax")
    response.headers["Content-Language"] = g.locale
    response.vary.add("Accept-Language")
    response.vary.add("Cookie")
    return response


@app.teardown_request
def clear_locale(_error):
    token = g.pop("locale_token", None)
    if token is not None:
        reset_locale(token)


@app.context_processor
def inject_i18n():
    return {
        "_": _,
        "t": t,
        "current_locale": get_locale,
        "ui_languages": get_ui_languages,
        "direction": get_direction,
    }


@app.get("/")
def home():
    return render_template("home.html", name="Ada")
```

</details>

<a id="the-language-menu-in-a-template"></a>
#### O menu de idioma em um template

`Jinja2Templates` do FastAPI e Flask ambos renderizam isso. Um link que carrega `?lang=` mantém a página e define o cookie, para que a escolha permaneça nas páginas posteriores. O atributo `dir` usa `get_direction()` para idiomas da direita para a esquerda.

<details>
<summary>Template</summary>

```html
<!doctype html>
<html lang="{{ current_locale() }}" dir="{{ direction() }}">
  <body>
    <p>{{ t("Hello, {name}!", name=name) }}</p>
    <nav>
      {% for language in ui_languages() %}
        <a href="?lang={{ language.code }}"{% if language.code == current_locale() %} aria-current="true"{% endif %}>{{ language.label }}</a>
      {% endfor %}
    </nav>
  </body>
</html>
```

</details>

<a id="tkinter"></a>
#### Tkinter

Tkinter cria seus widgets uma vez, então uma mudança de idioma precisa atualizá-los. Escreva cada texto visível como uma função que chama `t("…")` com o literal dentro dela, registre o widget com essa função e chame `refresh()` após `set_locale`. `extract` ainda vê cada literal. Salve o código escolhido no arquivo de configurações do aplicativo e chame `set_locale` com ele antes que a janela seja construída.

<details>
<summary>Janela Tkinter com um menu de idioma</summary>

```python
import tkinter as tk
from collections.abc import Callable
from tkinter import ttk

from i18n import get_locale, get_ui_languages, set_locale, t


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self._texts: list[tuple[tk.Misc, Callable[[], str]]] = []
        rows = [row for row in get_ui_languages() if row.get("code")]
        self._codes = [str(row["code"]) for row in rows]
        labels = [str(row.get("label") or row["code"]) for row in rows]
        self.language = ttk.Combobox(self, values=labels, state="readonly")
        self.language.current(self._codes.index(get_locale()))
        self.language.bind("<<ComboboxSelected>>", self._on_language)
        self.language.pack()
        self.greeting = ttk.Label(self)
        self.greeting.pack()
        self.bind_text(self.greeting, lambda: t("Hello, {name}!", name="Ada"))
        self.refresh()

    def bind_text(self, widget: tk.Misc, text: Callable[[], str]) -> None:
        self._texts.append((widget, text))

    def refresh(self) -> None:
        self.title(t("My app"))
        for widget, text in self._texts:
            widget.configure(text=text())

    def _on_language(self, _event: object) -> None:
        set_locale(self._codes[self.language.current()])
        self.refresh()
```

</details>

Uma nova thread inicia no idioma de origem, não no da janela. Traduza na thread principal, ou chame `set_locale` no início da função da thread. Outros toolkits precisam das mesmas partes: uma função que define cada texto visível, e um manipulador de menu que chama `set_locale` e depois essa função. PyQt e PySide têm seus próprios hooks de retranslação; veja [Locale em cada framework](/pt-BR/guide/ui-strings/python#locale-in-each-framework).

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#choose-models-and-translate).

<a id="not-your-case"></a>
## Não é o seu caso?

| Você tem | Leia |
| --- | --- |
| Catálogos Django, Flask-Babel ou um aplicativo que já usa GNU gettext | [Adicionar i18n a um aplicativo Django / Python gettext](/pt-BR/guide/add-i18n-to-django-gettext) |
| Um aplicativo JS/TS | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) |
| Um site ou site de documentação | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website) |
| Um README de repositório ou outros arquivos Markdown | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |
| JSON de localidade aninhado | [JSON](/pt-BR/guide/json) |

<a id="examples"></a>
## Exemplos

| Exemplo | O que mostra |
| --- | --- |
| [python-streamlit](/pt-BR/examples#python-streamlit) | Painel, `t()` / `_()`, JSON simples |
| [python-fastapi](/pt-BR/examples#python-fastapi) | Localidade com escopo de solicitação, JSON simples |
| [python-flask](/pt-BR/examples#python-flask) | Flask + Jinja, JSON simples |

Copie um com `npx degit`, ou baixe `ai-i18n-tools-python-examples.zip` do GitHub Release. Comandos: [Exemplos](/pt-BR/examples#python-examples). Para um aplicativo que usa gettext, veja o [exemplo de gettext](/pt-BR/examples#python-gettext).
