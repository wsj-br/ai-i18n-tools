<a id="add-i18n-to-a-python-app"></a>
# Adicionar i18n a um aplicativo Python

Este passo a passo pega uma aplicação Python que tem um único idioma e adiciona locales com o ai-i18n-tools. Strings literais voltadas para o usuário são envolvidas manualmente ou com os prompts em [Envolver strings](#wrap-strings). O `migrate-python-i18n` apenas corrige chamadas inseguras que já estão envolvidas. Tudo o que ainda precisa ser verificado é listado em um relatório.

Já usa catálogos GNU gettext, Django ou Flask? Mantenha essas chamadas. Escolha o modelo de inicialização correspondente abaixo e deixe o `extract` preencher os slots vazios do catálogo a partir dos arquivos `.po` existentes.

As etapas:

1. [Instale](#install) a CLI e defina a chave de API.
2. [Escolha um modelo](#pick-a-template) e execute o `init`.
3. [Envolva as strings](#wrap-strings) em `t()` ou `_()`.
4. [Migre os locais de chamada](#migrate) que já estão envolvidos de forma insegura.
5. [Escolha os modelos e traduza](#translate).
6. [Alterne o locale em tempo de execução](#switch-locale).
7. [Mantenha tudo traduzido](#keep-it-translated).

Não tem certeza se este é o seu caso? Consulte [Não é o seu caso?](#not-your-case) no final.

<a id="install"></a>
## Instalar

Use o pacote npm quando a máquina já tiver o Node.js `>=22.16.0` ([Instalação](/pt-BR/guide/installation)). Para um projeto Python, instale o executável autônomo (sem Node.js).

Linux e macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.sh | bash
```

Windows (PowerShell):

```powershell
irm https://raw.githubusercontent.com/wsj-br/ai-i18n-tools/main/install.ps1 | iex
```

O instalador verifica o `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` e o adiciona ao `PATH`. Os binários não são notarizados nem assinados com Authenticode. Para ver as etapas manuais e os nomes dos ativos, consulte: [Executáveis autônomos](/pt-BR/guide/installation#standalone-executables).

Defina a chave da API para o provedor que você passa para `init`. Por exemplo, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

O Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Escolha um modelo

| App hoje | Comando | O que você obtém |
| --- | --- | --- |
| Strings hard-coded ou novas chamadas `t()` / `_()` | `ai-i18n-tools init -t ui-python -P cheaperinference` | JSON plano com chaves baseadas na string do idioma de origem e `i18n.py` |
| GNU gettext, e você também quer JSON simples | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON mais `.po` / `.mo`, e `i18n.py` |
| Catálogos Flask ou Jinja em `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Catálogos Gettext e `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (sem `i18n.py`) |

Edite `sourceLocale` e `targetLocales`. `sourceLocale` é o idioma das strings na origem. Qualquer idioma BCP-47 é válido; os exemplos geralmente usam `en`. Conexão com o framework: [Integrações Python](/pt-BR/guide/integrations/python). Formatos de chamada e layout do catálogo: [Aplicações Python](/pt-BR/guide/ui-strings/python).

<a id="wrap-strings"></a>
## Envolva as strings

Procure primeiro a entrada do catálogo e, em seguida, interpole. Importe o `t` e o `_` do `i18n.py` gerado (o Django mantém o `gettext` e o `ngettext`).

```python
t("Hello, {name}!", name=name)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

Estes são avaliados antes de qualquer consulta ao catálogo. O extrator os marca como inseguros, e o `migrate-python-i18n` os reescreve:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="agent-prompt-i18n-py"></a>

<a id="agent-prompt-i18npy-helper"></a>

Use isto para Streamlit, FastAPI, Flask com JSON plano, Tkinter, Qt e um shell PyWebView. Copie para um agente de codificação. Um projeto Django ou que já usa gettext deve, em vez disso, usar o [próximo prompt](#agent-prompt-django-gettext).

<details class="agent-prompt">
<summary>Prompt do agente: assistente i18n.py</summary>

````markdown
# Wrap user-facing Python strings with i18n.py

## Context

ai-i18n-tools extracts only string literals passed to `t()` or `_()` (and the
other names in `ui.uiExtractor.funcNames`). The literal is the source-language
sentence and the catalog key. After this edit the app must behave the same when
the active locale is the source locale. Do not translate any string.

Call shapes: https://wsj-br.github.io/ai-i18n-tools/guide/ui-strings/python

## Scope

Read `ui.sourceRoots` in `ai-i18n-tools.config.json` and edit Python (and Jinja
templates) under those roots. Skip class names, URLs and routes, import paths,
ids, enum and error codes, object keys used as identifiers, log field names,
regexes, comments, and text that is already wrapped. Do not edit the generated
`i18n.py`.

## Call shape

Import `t` and `_` from the generated `i18n.py`. Placeholders are `{name}` or
`{price:,.2f}`, passed as keyword arguments. `_("…") % x` and `_("…").format(…)`
are safe because the lookup happens first.

Never `_(f"…")`, `_("…" % x)`, or `_("…".format(…))`. If one slips in,
`migrate-python-i18n` can rewrite it later.

Before:

```python
st.write(f"Hello, {name}!")
```

After:

```python
st.write(t("Hello, {name}!", name=name))
```

Framework notes:

- Streamlit widgets keep a fixed `key=`.
- Tkinter text is rebuilt after `set_locale`.
- Qt uses `self.tr("…")` (already in the default function list).
- Jinja uses `{% trans %}` / `{% blocktrans %}` rather than an f-string inside
  the template.
- FastAPI and Flask middleware pair `set_locale` with `reset_locale` in
  `finally`.

## Order

1. `ai-i18n-tools init -t ui-python` (or `ui-python-gettext` / `ui-python-flask`
   if you also want `.po` files) so `i18n.py` exists.
2. Wrap call sites.
3. Run `ai-i18n-tools extract`. Then `ai-i18n-tools migrate-python-i18n` (dry
   run) and read the report.

## Do not

- Do not translate, rename, or reword the source text.
- Do not introduce semantic keys.
- Do not create a second helper besides `i18n.py`.
- Do not hand-edit `strings.json`, flat locale JSON, `.po` / `.mo`, or
  `ui-languages.json`.
- Do not change behaviour, layout, or test selectors.

## Verify

- `ai-i18n-tools extract` writes a non-empty catalog.
- The project's tests pass.
- The source locale still shows the original sentences. One target locale shows
  translations after `translate-ui`.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
and any ambiguous case left for a human (the same word with different meanings,
concatenated sentences, or plurals).
````

</details>

<a id="agent-prompt-django-gettext"></a>

<a id="agent-prompt-django-and-native-gettext"></a>

Use isto quando a aplicação já chamar o Django ou o GNU gettext, ou quando você quiser permanecer com os catálogos `.po`. Não adicione `i18n.py`.

Os templates de inicialização reconhecem exatamente estes nomes de chamada: `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` e `self.tr`. As variantes lazy e noop não estão nessa lista. Adicione os nomes que o projeto realmente chama (geralmente `gettext_lazy`, `ngettext_lazy`, `pgettext_lazy` e `gettext_noop`) a `ui.uiExtractor.funcNames`, senão o `extract` os ignorará. O `ngettext_lazy` é lido como singular mais plural, e o `pgettext_lazy` como contexto mais mensagem, somente depois que o nome é listado. `{% trans %}` e `{% blocktrans %}` nos templates são coletados por conta própria.

<details class="agent-prompt">
<summary>Prompt do agente: Django e gettext nativo</summary>

````markdown
# Wrap user-facing strings with Django / gettext

## Context

ai-i18n-tools extracts string literals passed to gettext calls whose names are
listed in `ui.uiExtractor.funcNames`, plus `{% trans %}` and `{% blocktrans %}`
in templates. The literal is the source-language message. Existing `.po` files
stay; `extract` fills empty catalog slots from them when
`ui.gettext.ingestExistingPo` is on (the default). Do not translate any string.
Do not create `i18n.py`.

## Scope

Edit Python modules, Django templates, and forms under `ui.sourceRoots`. Skip
URLs, import paths, ids, field names used as identifiers, `verbose_name` keys
that are already lazy-wrapped, comments, and migrations that must not change. Do
not wrap strings inside `help_text` that are already `gettext_lazy` calls.

## Call shape

Init with `ui-python-django` (Django `locale/` and the `django` domain) or
`ui-python-gettext` (existing GNU catalogs). Use `gettext`, `ngettext`,
`pgettext`, and `{% blocktrans %}` / `{% trans %}`. Placeholders are `%(name)s`.

Module-level model, form, and settings strings use the lazy form. Add every lazy
or noop name you call to `ui.uiExtractor.funcNames` (for example `gettext_lazy`,
`ngettext_lazy`, `pgettext_lazy`, and `gettext_noop`). The default list does not
include them.

Before:

```python
verbose_name = "Display name"
```

After:

```python
from django.utils.translation import gettext_lazy as _

verbose_name = _("Display name")
```

Template:

```django
{% blocktrans with name=user.name %}Hello, {{ name }}{% endblocktrans %}
```

The extractor stores that message with a `%(name)s` placeholder. Do not switch
Django templates to `{name}` or to i18next `{{name}}` inside a Python `t()`
call.

## Order

1. Pick `ui-python-django` or `ui-python-gettext`. Confirm `funcNames` includes
   every gettext function the code calls.
2. Wrap call sites. Keep existing `.po` files.
3. Run `ai-i18n-tools extract`.

## Do not

- Do not translate, rename, or reword msgid text.
- Do not add `i18n.py` or a flat-JSON `t()` helper next to Django's gettext.
- Do not hand-edit generated `.po`, `.mo`, `strings.json`, or
  `ui-languages.json`.
- Do not change model field names, migrations, or test selectors.

## Verify

- `ai-i18n-tools extract` lists the new messages and does not drop existing
  msgid entries that `ingestExistingPo` already filled.
- Django checks and the project's tests pass.
- The source locale still shows the original copy.

## Report back

List files changed, each string you deliberately skipped with a one-line reason,
function names you added to `funcNames`, and any ambiguous case left for a
human.
````

</details>

<a id="migrate"></a>

<a id="migrate-call-sites"></a>
## Migrar locais de chamada

O `migrate-python-i18n` é uma simulação (dry run) até que você passe o `--write`. Ele sempre grava o `migrate-python-i18n-report.md`. Arquivos `i18n.py` gerados são ignorados. Campos de depuração, como `{value=}` e especificações de formato aninhadas, são relatados e mantidos no lugar.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Leia o relatório antes do `--write` quando a simulação listar locais que exigem revisão manual. O `--report <path>` opcional altera o caminho do relatório. O `--ui-block` opcional limita a verificação a um bloco de interface.

<a id="translate"></a>

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. A mesma classificação está na guia [Models](/pt-BR/guide/translation-dashboard/models). Em seguida, extraia e traduza:

```bash
ai-i18n-tools extract
ai-i18n-tools translate-ui
```

`extract` grava `strings.json` e `ui-languages.json`. `translate-ui` preenche os arquivos JSON simples e, quando `ui.gettext` está definido, os catálogos `.po` / `.mo`. Não edite manualmente esses catálogos gerados.

<a id="switch-locale"></a>

<a id="switch-locale-at-runtime"></a>
## Alterne a localidade em tempo de execução

`set_locale` retorna um token `ContextVar`. Redefina-o quando a solicitação ou o retorno de chamada terminar.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

O middleware do FastAPI e do Flask deve ser redefinido em `finally` (Flask: `teardown_request`) para que solicitações simultâneas não vazem uma localidade. Projetos Django mantêm a ativação de localidade do Django e não usam `i18n.py`. Notas por framework: [Localidade em cada framework](/pt-BR/guide/ui-strings/python#locale).

<a id="keep-it-translated"></a>
## Mantenha traduzido

Reexecute `ai-i18n-tools sync` (ou `extract` e depois `translate-ui`) após alterar o texto de origem. O cache faz com que apenas strings novas ou alteradas sejam enviadas para o modelo. Execute-o em CI para que as traduções não fiquem defasadas. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

Para traduzir `README.md` na mesma execução, faça o scaffold com `--with-readme` (ou adicione o bloco a uma configuração existente). Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="not-your-case"></a>
## Não é o seu caso?

| Você tem | Leia |
| --- | --- |
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
| [python-gettext](/pt-BR/examples#python-gettext) | CLI gettext existente; `translate-ui` atualiza `.po` e `.mo` |

Copie um com `npx degit` ou baixe `ai-i18n-tools-python-examples.zip` do GitHub Release. Comandos: [Exemplos](/pt-BR/examples#python-examples).
