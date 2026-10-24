<a id="add-i18n-to-a-python-app"></a>
# Adicionar i18n a um aplicativo Python

Este guia prático pega um aplicativo Python que possui um único idioma e adiciona localidades com o ai-i18n-tools. Edições seguras nos locais de chamada são aplicadas pelo `migrate-python-i18n`. Qualquer coisa que ainda precise de uma verificação é listada em um relatório.

Já usa catálogos GNU gettext, Django ou Flask? Mantenha essas chamadas. Escolha o modelo de inicialização correspondente abaixo e deixe o `extract` preencher os slots vazios do catálogo a partir dos arquivos `.po` existentes.

<a id="install"></a>
## Instalar

Use o pacote npm quando a máquina já tiver o Node.js `>=22.16.0` ([Instalação](/pt-BR/guide/installation)). Para um projeto Python, o caminho usual é o executável independente do GitHub Release — Linux (`x64`, `arm64`), macOS (`arm64`, `x64`) e Windows (`x64`). Verifique o `SHA256SUMS.txt`, execute o `chmod +x` no Unix e coloque o arquivo no `PATH`. Os binários não são assinados. Nomes de ativos e somas de verificação: [Executáveis independentes](/pt-BR/guide/installation#standalone-executables).

Defina a chave da API para o provedor que você passa para `init`. Por exemplo, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

O Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers).

<a id="pick-a-template"></a>
## Escolha um modelo

| Aplicativo hoje | Comando | O que você obtém |
| --- | --- | --- |
| Strings hard-coded, ou novas chamadas `t()` / `_()` | `ai-i18n-tools init -t ui-python -P cheaperinference` | JSON de chave em inglês simples e `i18n.py` |
| GNU gettext, e você também quer JSON simples | `ai-i18n-tools init -t ui-python-gettext -P anthropic` | JSON mais `.po` / `.mo`, e `i18n.py` |
| Catálogos Flask ou Jinja em `translations/` | `ai-i18n-tools init -t ui-python-flask -P groq` | Catálogos Gettext e `i18n.py` |
| Django `gettext` / `{% blocktrans %}` | `ai-i18n-tools init -t ui-python-django -P ollama` | `locale/<lang>/LC_MESSAGES/django.po` (sem `i18n.py`) |

Edite o `sourceLocale` e o `targetLocales`. `sourceLocale` é o idioma das strings no código-fonte (geralmente `en`). Integração com frameworks: [Integrações Python](/pt-BR/guide/integrations/python). Formatos de chamada e layout de catálogo: [Aplicativos Python](/pt-BR/guide/ui-strings/python).

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

<a id="migrate"></a>
## Migrar locais de chamada

O `migrate-python-i18n` é uma simulação (dry run) até que você passe o `--write`. Ele sempre grava o `migrate-python-i18n-report.md`. Arquivos `i18n.py` gerados são ignorados. Campos de depuração, como `{value=}` e especificações de formato aninhadas, são relatados e mantidos no lugar.

```bash
ai-i18n-tools migrate-python-i18n
ai-i18n-tools migrate-python-i18n --write
```

Leia o relatório antes do `--write` quando a simulação listar locais que exigem revisão manual. O `--report <path>` opcional altera o caminho do relatório. O `--ui-block` opcional limita a verificação a um bloco de interface.

<a id="translate"></a>
## Escolha modelos e traduza

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
## Alternar localidade em tempo de execução

`set_locale` retorna um token `ContextVar`. Redefina-o quando a solicitação ou o retorno de chamada terminar.

```python
token = set_locale(code)
try:
    text = t("Hello, {name}!", name=name)
finally:
    reset_locale(token)
```

O middleware do FastAPI e do Flask deve ser redefinido em `finally` (Flask: `teardown_request`) para que solicitações simultâneas não vazem uma localidade. Projetos Django mantêm a ativação de localidade do Django e não usam `i18n.py`. Notas por framework: [Localidade em cada framework](/pt-BR/guide/ui-strings/python#locale).

<a id="examples"></a>
## Exemplos

| Exemplo | O que mostra |
| --- | --- |
| [python-streamlit](/pt-BR/examples#python-streamlit) | Painel, `t()` / `_()`, JSON simples |
| [python-fastapi](/pt-BR/examples#python-fastapi) | Localidade com escopo de solicitação, JSON simples |
| [python-flask](/pt-BR/examples#python-flask) | Flask + Jinja, JSON simples |
| [python-gettext](/pt-BR/examples#python-gettext) | CLI gettext existente; `translate-ui` atualiza `.po` e `.mo` |

Copie um com `npx degit` ou baixe `ai-i18n-tools-python-examples.zip` do GitHub Release. Comandos: [Exemplos](/pt-BR/examples#python-examples).
