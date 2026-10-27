<a id="python"></a>
# Aplicações Python

O `ai-i18n-tools` extrai strings de IU de arquivos Python e de arquivos `.ui` do Jinja, Django e Qt e, em seguida, grava em JSON simples com chaves baseadas na string do idioma de origem, em catálogos GNU gettext ou em ambos. O `sourceLocale` pode ser qualquer idioma. O auxiliar de tempo de execução é um `i18n.py` da biblioteca padrão (Python 3.10 ou mais recente). Streamlit, Tkinter, PyQt, PySide, PyWebView, Flask, Pyramid e FastAPI chamam esse auxiliar. O Django usa o próprio gettext do Django.

Como adicionar localidades a um aplicativo de idioma único existente: [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python), incluindo o [prompt do `i18n.py`](/pt-BR/guide/add-i18n-to-python#agent-prompt-i18n-py) e o [prompt do Django / gettext](/pt-BR/guide/add-i18n-to-python#agent-prompt-django-gettext). Seletor de framework: [Integrações com Python](/pt-BR/guide/integrations/python). Lista de funções: [Runtime do Python (`i18n.py`)](/pt-BR/reference/programmatic-api#python-runtime).

Cópias executáveis residem em `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` e `examples/python-gettext`. São projetos Python. Os três primeiros utilizam um virtualenv e `pip install -r requirements.txt`. O `python-gettext` utiliza apenas a biblioteca padrão. Eles não são pacotes npm. O arquivo de lançamento `ai-i18n-tools-python-examples.zip` contém os mesmos quatro diretórios. O tarball npm e o executável independente não contêm.

<a id="init"></a>
## Scaffold

```bash
ai-i18n-tools init -t ui-python -P cheaperinference
ai-i18n-tools init -t ui-python-gettext -P anthropic
ai-i18n-tools init -t ui-python-flask -P groq
ai-i18n-tools init -t ui-python-django -P ollama
```

O `ui-python` grava JSON simples e `i18n.py`. O `ui-python-gettext` grava JSON e `.po` / `.mo`. O `ui-python-flask` grava catálogos gettext em `translations/` e `i18n.py`. O `ui-python-django` grava `locale/<lang>/LC_MESSAGES/django.po` e não grava `i18n.py`.

Traduza também o README do repositório: adicione `--with-readme` ao comando `init` acima. Consulte [Adicionar i18n ao seu README e aos seus documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

As raízes de verificação ignoram `node_modules`, `.git`, `.venv`, `venv`, `env`, `site-packages`, `__pycache__`, `.tox`, `.nox`, `.pytest_cache`, `.mypy_cache`, `.ruff_cache` e `.eggs`.

<a id="calls"></a>
## Chamadas que traduzem

Procure primeiro a entrada do catálogo e, em seguida, interpole.

Portável:

```python
t("Hello, {name}!", name=name)
t("Total: {price:,.2f}", price=price)
_("Hello, %s!") % name
_("Total: {price:,.2f}").format(price=price)
```

No Python 3.14, o auxiliar também aceita uma string de modelo:

```python
translate(t"Hello, {name}!")
```

`translate` é um alias de `t`. Argumentos de palavra-chave substituem valores obtidos da string de modelo.

Gettext nativo, ainda seguro porque o modelo é o argumento:

```python
_("Hello, %s!") % name
ngettext("1 file", "{count} files", count, count=count)
pgettext("menu", "Open")
```

Estes são avaliados antes de qualquer consulta ao catálogo, portanto, o extrator os marca como inseguros e o `migrate-python-i18n` os reescreve:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

O `migrate-python-i18n` é uma simulação (dry run) até que você passe `--write`. Ele grava `migrate-python-i18n-report.md`. Campos de depuração como `{value=}` e especificações de formato aninhadas são relatados e mantidos no lugar.

`{% trans %}` e `{% blocktrans %}` tornam-se espaços reservados `%(name)s` do gettext. O Jinja remove e colapsa espaços em branco. O Django mantém espaços em branco internos, a menos que a tag diga `trimmed`.

<a id="catalogs"></a>
## Catálogos

As chaves do JSON simples são a string do idioma de origem, o texto em `sourceLocale`. Esse idioma pode ser qualquer idioma. Um contexto usa `context` + U+0004 + essa string de origem. Os espaços para plural permanecem `{md5}_one`, `{md5}_other` e as outras formas do CLDR que o `translate-ui` já grava. O auxiliar gera o hash do singular sem espaços em branco com MD5 e lê os 8 primeiros caracteres hexadecimais.

Arquivos Gettext usam `msgctxt` para contexto e `msgid` / `msgid_plural` para plurais. O `ui.gettext.compileMo` grava o `.mo` ao lado do `.po`. O `purge-locale` exclui o `.po` e `.mo` daquele local. Quando `flatOutput` é falso, ele deixa os arquivos JSON simples intactos, pois não foram gravados.

O `t(..., plurals=True)` com um local de origem em inglês e uma fonte de plural explícita ignora o modelo e armazena `one` / `other` a partir das strings de origem.

<a id="locale"></a>
## Localidade em cada framework

`set_locale` retorna um token `ContextVar`. Redefina-o em `finally`, incluindo middleware FastAPI e Flask, para que solicitações simultâneas não vazem uma localidade.

- <a id="streamlit"></a>**Streamlit.** `streamlit_language_selector(sidebar=True, key="lang_selector")` escreve `st.session_state.locale` e `st.query_params["lang"]`. Dê a cada widget um `key` fixo. Consulte `examples/python-streamlit`.
- <a id="fastapi"></a>**FastAPI.** Leia `?lang=` ou `Accept-Language` no middleware, chame `set_locale` e `reset_locale` em `finally`. As rotas chamam `t()` e `_()`. Consulte `examples/python-fastapi`.
- <a id="flask"></a>**Flask e Pyramid.** Defina a localidade a partir da requisição e injete `_`, `t`, `current_locale`, `ui_languages` e `direction` no contexto do template. Consulte `examples/python-flask`.
- <a id="gettext"></a>**gettext existente.** Mantenha `_()`, `gettext()` e `ngettext()` no lugar. Aponte `ui.gettext` para a árvore `locales/` atual e execute `extract` e, em seguida, `translate-ui`. Consulte `examples/python-gettext`.
- <a id="django"></a>**Django.** Use `gettext`, `ngettext` e `{% blocktrans %}`. O `ui-python-django` do template de inicialização corresponde ao diretório `locale/` e ao domínio `django` do Django.
- <a id="tkinter"></a>**Tkinter.** Chame `t()` ou `_()` ao criar cada widget, depois reconstrua o texto visível após `set_locale`.
- <a id="pyqt"></a>**PyQt / PySide.** `self.tr("...")` é extraído. Um arquivo `.ui` contribui com elementos `<string>`, a menos que `notr="true"`. O atributo `comment` torna-se o contexto do gettext.
- <a id="pywebview"></a>**PyWebView / PyWebKit.** Extraia o shell Python com os templates Python acima. Extraia a página HTML com marcadores `data-i18n` ou com um documento HTML por localidade.
