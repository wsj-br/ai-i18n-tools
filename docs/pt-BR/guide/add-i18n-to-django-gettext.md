<a id="add-i18n-to-a-django--python-gettext-app"></a>
# Adicionar i18n a um aplicativo Django / Python gettext

Esta página é para um aplicativo Python que traduz com GNU gettext, ou um que o fará: Django, Flask com catálogos no estilo Flask-Babel, ou qualquer aplicativo que chame `gettext()`. Você mantém as chamadas gettext. ai-i18n-tools as lê, traduz as mensagens e escreve os arquivos `.po` e `.mo` compilados que seu aplicativo já carrega. Nenhum módulo auxiliar é necessário.

A maneira mais rápida é fornecer a um agente de codificação o prompt desta página. Ele configura a configuração, envolve suas strings, verifica o resultado e pode adicionar um seletor de idioma. Você instala a CLI, escolhe o provedor e inicializa o projeto você mesmo, porque isso requer sua chave de API e suas escolhas. Você também executa a tradução você mesmo, porque isso gasta dinheiro da sua conta e reescreve seus arquivos `.po` e `.mo`.

Criando um aplicativo Streamlit, FastAPI, Flask, desktop ou de script que não usa gettext hoje? Use [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) em vez disso. Ele adiciona um pequeno auxiliar `i18n.py` e escreve catálogos JSON. Não tem certeza de qual se aplica? Veja [Não é o seu caso?](#not-your-case) no final.

O fluxo:

1. [Instalar a CLI e escolher um provedor](#install-and-choose-a-provider).
2. [Inicializar o projeto](#initialise-the-project) com `init`.
3. [Executar o prompt do agente](#run-the-agent-prompt).
4. [Revisar o resultado](#review-the-result).
5. [Escolher modelos e traduzir](#translate), depois verificar um idioma.
6. [Manter traduzido](#keep-it-translated).

Prefere fazer as alterações você mesmo, ou quer saber o que o prompt faz? [Faça manualmente](#do-it-by-hand) percorre os mesmos passos um de cada vez.

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

O instalador verifica `SHA256SUMS.txt`, instala o comando como `ai-i18n-tools` e o adiciona a `PATH`. Os binários não são autenticados ou assinados com Authenticode. Etapas manuais e nomes de ativos: [Executáveis autônomos](/pt-BR/guide/installation#standalone-executables).

Verificar a instalação:

```bash
ai-i18n-tools --version
```

Em seguida, escolha um provedor e defina sua chave de API no shell que executará a tradução. Por exemplo, Cheaper Inference:

```bash
export CHEAPERINFERENCE_API_KEY=your-key-here
```

Ollama não precisa de chave. Outras predefinições: [Provedores integrados](/pt-BR/guide/providers-and-models#built-in-providers). Anote o nome do provedor, porque você o passará para `init` na próxima etapa. O agente nunca precisa da chave: ele apenas executa comandos que não fazem chamadas de modelo. Você usa a chave mais tarde, quando você [traduzir](#translate).

<a id="initialise-the-project"></a>
## Inicializar o projeto

Você executa isso uma vez, antes do prompt. Ele escreve a configuração e usa o provedor que você escolheu acima. Escolha o modelo que corresponde ao seu aplicativo:

| Seu aplicativo | Modelo | Catálogos que ele escreve |
| --- | --- | --- |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` e `.mo` |
| Flask com catálogos no estilo Flask-Babel | `ui-python-flask` | `translations/<lang>/LC_MESSAGES/messages.po` e `.mo` |
| Qualquer outro aplicativo Python que já usa GNU gettext | `ui-python-gettext` | `locales/<lang>/LC_MESSAGES/messages.po` e `.mo` |

Execute init com o nome do modelo e o provedor que você escolheu:

```bash
ai-i18n-tools init -t ui-python-django -P cheaperinference
```

Execute `init` uma vez. Ele sobrescreve `ai-i18n-tools.config.json` toda vez, então uma segunda execução descarta as edições que você fez. Se a configuração já existir e estiver personalizada, pule `init` e edite a configuração.

`ui-python-gettext` e `ui-python-flask` também escrevem um auxiliar `i18n.py` quando esse arquivo está faltando. Um aplicativo gettext não precisa dele, então exclua-o (o prompt faz isso por você). `ui-python-gettext` também escreve arquivos JSON ao lado dos catálogos gettext. Para escrever apenas catálogos gettext, defina `"flatOutput": false` no bloco `ui` (o prompt também faz isso). `ui-python-django` não escreve nem o auxiliar nem JSON, porque o Django mantém seu próprio sistema de tradução.

Em seguida, edite `sourceLocale` e `targetLocales` em `ai-i18n-tools.config.json`. `sourceLocale` é o idioma das strings em seu código. Qualquer idioma BCP-47 é válido; exemplos frequentemente usam `en`. Escreva os códigos de destino como `pt-BR`. A pasta do catálogo é `pt_BR`, o formato que gettext e Django esperam (`localeFormat` é `posix`).

<a id="run-the-agent-prompt"></a>
## Executar o prompt do agente

Abra o projeto em seu agente de codificação (Cursor, Claude Code, Copilot ou similar), inicie um novo chat e cole o prompt abaixo. O projeto já deve estar inicializado. Não há nada para editar. Se você quiser que algo seja omitido, por exemplo, nenhuma troca de idioma, diga isso na mesma mensagem.

O agente primeiro verifica se a CLI e a configuração existem e para com instruções se uma delas estiver faltando. Em seguida, ele funciona em quatro partes:

- A Parte 1 faz com que a configuração corresponda aos seus catálogos existentes e remove o `i18n.py` que alguns modelos escrevem.
- A Parte 2 envolve as strings voltadas para o usuário com as chamadas gettext que você já usa e as tags de modelo.
- A Parte 3 executa `extract` e encontra chamadas que formatam antes da pesquisa.
- A Parte 4 adiciona a troca de idioma.

Ele não instala nem inicializa nada, lê sua chave de API ou traduz. Ele não executa `makemessages` ou `compilemessages`, e deixa seus arquivos `.po` e `.mo` intocados. A tradução é a etapa após a revisão, e você a executa.

<details class="agent-prompt">
<summary>Prompt do agente: adicionar idiomas a um aplicativo Django ou gettext</summary>

````markdown
# Add languages to this gettext app

## Before you start

The user must already have installed ai-i18n-tools and initialised this
project. Check that `ai-i18n-tools --version` runs and that
`ai-i18n-tools.config.json` exists with a `ui.gettext` block. If either is
missing, stop now and tell the user to install ai-i18n-tools and run
`ai-i18n-tools init -t <template> -P <provider>`, then run this prompt again.
The template is `ui-python-django` for Django, `ui-python-flask` for
Flask-Babel catalogs, and `ui-python-gettext` for any other gettext app. Do not
install or initialise anything yourself.

## Rules

- Do not read or search the ai-i18n-tools source. This prompt is complete.
- Never read, print, or write API keys, `.env` files, or the shell environment.
- Do not run `translate-ui` or `suggest-models`. They call the translation API,
  cost money, and `translate-ui` rewrites the `.po` and `.mo` files. The user
  runs them after reviewing your work.
- Do not translate, reword, or rename source text. Do not hand-edit `.po`,
  `.mo`, `.pot`, or `strings.json`. Do not run `makemessages` or
  `compilemessages`. Do not create `i18n.py` or any other translation helper.
  Do not edit migrations or change field names.
- Do not reformat unrelated code. Run the project's formatter and linter at the
  end. Leave unrelated edits in a dirty tree alone. Delete throwaway scripts and
  do not commit them.

## Part 1 — Config

1. If init wrote an `i18n.py`, delete it. A gettext app does not use it. If the
   project uses the `ui-python-gettext` template, set `"flatOutput": false` in
   the `ui` block.
2. Make the config match the project. `ui.gettext.outputDir`, `potPath`, and
   `domain` must be where the existing catalogs live and the domain the app
   loads (Django: `django`; Flask-Babel: `messages`). Put `ui.stringsJson` and
   `ui.flatOutputDir` beside the catalogs. Set `ui.sourceRoots` to the
   application code instead of `"."`. Use one `ui` block per catalog tree when
   apps keep separate `locale/` folders.
3. Keep the existing `.po` files. `extract` reads them and keeps their
   translations.

## Part 2 — Wrap strings

Keep the gettext calls the project already uses, and wrap what is missing. The
literal is the source-language message. With the source language active, the
app must behave exactly as before.

- Python: `gettext`, `ngettext`, `pgettext`. Placeholders are `%(name)s`,
  filled after the lookup: `_("Hello, %(name)s!") % {"name": name}`. Strings that
  run at import time (models, forms, apps, settings) use the lazy form, for
  example `from django.utils.translation import gettext_lazy as _`. Never apply
  `%` to a lazy string at import time. Use `format_lazy`.
- Templates: add `{% load i18n %}` where needed. Use `{% translate "…" %}` and
  `{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}`.
  Do not switch templates to `{name}` placeholders.
- Look up first, then format. Never `_(f"…")`, `_("…" % x)`, or
  `_("…".format(…))`. The argument must be a string literal, so `_(variable)` is
  invisible.
- `extract` knows `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`,
  `pgettext`, and `self.tr`. Add every other name the code calls to
  `ui.uiExtractor.funcNames`: for example `gettext_lazy` called directly,
  `ngettext_lazy`, `pgettext_lazy`, `npgettext`, `gettext_noop`.
- Wrap text a person sees: labels, headings, messages, form and model text,
  emails, admin text. Leave identifiers, URLs, route names, field names,
  settings keys, log messages, SQL, and text that is already wrapped. A value
  that is both stored and shown (choices) keeps its stored value. Wrap the
  label.

Work in passes: wrap, run `ai-i18n-tools extract`, look for text still
unwrapped, and repeat.

## Part 3 — Check

1. `ai-i18n-tools extract` lists the new messages and keeps the entries filled
   from the existing `.po` files.
2. Run `ai-i18n-tools migrate-python-i18n` without `--write` and read
   `migrate-python-i18n-report.md`. It finds calls that format before the
   lookup. Fix each one by hand with `%(name)s` and a dict. Never use `--write`:
   it rewrites f-strings and `.format()` calls to `t(...)`, which a gettext app
   does not have. Do not commit the report.
3. Django's checks and the project's tests pass, and the source language still
   shows the original text.

## Part 4 — Language switch

Skip this part when the user asked you to leave the switch out. It changes the
layout.

Goal: the user can pick a language, the choice is remembered, and every request
after that uses it. Use the framework's own mechanism, and accept only the
languages in `sourceLocale` and `targetLocales`.

- Django: `LANGUAGE_CODE` is the source language. `LANGUAGES` lists the
  supported languages with Django's lower-case codes (`pt-br`). `LOCALE_PATHS`
  points at `gettext.outputDir`, unless each app keeps its own `locale/` folder.
  Add `django.middleware.locale.LocaleMiddleware` after `SessionMiddleware` and
  before `CommonMiddleware`. Add `path("i18n/", include("django.conf.urls.i18n"))`
  to the URLconf, and a form that posts to `set_language` with a `next` field
  and a select built from `get_available_languages`, labelled
  `{% translate "Language" %}`.
- Flask-Babel: the locale selector returns, in order, `?lang=`, a cookie that
  remembers it, the `Accept-Language` header, then the source language. Match
  case-insensitively (`pt-br` is `pt-BR`) and ignore unknown codes. Keep
  `translations/` as the translation directory. Add a menu of links that carry
  `?lang=`, and store the cookie.
- Plain gettext: build the translations object with
  `gettext.translation(domain, localedir, languages=[code], fallback=True)`,
  converting `pt-BR` to `pt_BR`. In a web app build it per request. Do not use
  `gettext.install` there, because it is global and concurrent requests would
  share a language.
- Any framework: choose the language where a request or run starts, remember
  the choice, and keep it local to that request.

## Verify and report

The tests pass. With the source language, the output is unchanged. After the
user runs `translate-ui` and restarts the server, switching shows translations.
Before that, it shows the source text.

Report the files changed, each string you skipped with a one-line reason, the
function names you added to `funcNames`, plurals left as one string, one word
with several meanings, and sentences built from translated pieces. Then list
the commands for the user, and do not run them: `ai-i18n-tools translate-ui`,
then restart the server. Remind the user to commit first, because `translate-ui`
rewrites the `.po` files.
````

</details>

<a id="review-the-result"></a>
## Revise o resultado

O agente termina com um relatório. Verifique-o antes de traduzir:

- O diff. Apenas chamadas envolvidas, tags de modelo, a configuração e a troca de idioma devem ter sido alteradas. Seus arquivos `.po` e `.mo` devem permanecer intocados até você traduzir.
- `ai-i18n-tools.config.json`: `gettext.outputDir` e `domain` apontam para os catálogos que seu aplicativo carrega, e `sourceRoots` cobre o código do aplicativo.
- `ai-i18n-tools extract` lista as novas mensagens e mantém as traduções já existentes em seus arquivos `.po`.
- A execução simulada de `migrate-python-i18n` não lista nada que precise ser corrigido.
- As verificações do Django e seus testes passam, e o aplicativo parece o mesmo no idioma de origem.
- As strings ignoradas e os casos ambíguos no relatório: plurais deixados como uma única string, uma palavra com dois significados e frases construídas a partir de partes traduzidas. Decida-os manualmente.

Confirme este estado. `translate-ui` sobrescreve seus arquivos `.po`, então você vai querer um diff limpo para revisar.

<a id="choose-models-and-translate"></a>
## Escolha os modelos e traduza

Você executa esta parte. Ele usa sua chave de API, gasta dinheiro em sua conta e sobrescreve seus arquivos `.po`, então faça commit primeiro.

A lista de modelos do `init` é um ponto de partida. Classifique os modelos de chat do provedor ativo e, quando a lista final parecer correta, grave-a no `translationModels`:

```bash
ai-i18n-tools suggest-models
ai-i18n-tools suggest-models --apply
```

`--apply` substitui apenas `translationModels`. A mesma classificação está na guia [Modelos](/pt-BR/guide/translation-dashboard/models). Em seguida, traduza:

```bash
ai-i18n-tools translate-ui
```

`translate-ui` escreve o modelo `.pot`, um `.po` por localidade de destino, e o `.mo` compilado. Deixe esses arquivos sem edição a partir de agora, porque a próxima execução os regenera. Revise o primeiro diff antes de fazer commit.

Reinicie o servidor se ele não detectar os novos arquivos `.mo`.

<a id="check-one-language"></a>
### Verificar um idioma

Mude para um idioma de destino e olhe uma página com algumas strings envolvidas. Textos que ainda mostram o idioma de origem não foram envolvidos, ou o `.mo` não foi recarregado. Textos que mostram `%(name)s` na saída perderam seu dicionário. Verifique os placeholders no arquivo `.po`.

<a id="keep-it-translated"></a>
## Mantenha traduzido

Reexecute `ai-i18n-tools sync` (ou `extract` e depois `translate-ui`) após alterar o texto de origem. O cache faz com que apenas strings novas ou alteradas sejam enviadas para o modelo. Execute-o em CI para que as traduções não fiquem defasadas. `ai-i18n-tools dashboard` abre o [Painel de Tradução](/pt-BR/guide/translation-dashboard/) para revisar as traduções.

`purge-locale` remove os `.po` e `.mo` de um local. Confirme os arquivos `.po`. Confirme os arquivos `.mo` também, a menos que sua build os compile.

Para traduzir `README.md` na mesma execução, faça o scaffold com `--with-readme` (ou adicione o bloco a uma configuração existente). Consulte [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="do-it-by-hand"></a>
## Faça manualmente

Siga estas etapas se preferir fazer as alterações por conta própria ou se quiser saber o que o prompt faz. Cada etapa corresponde a uma parte do prompt. Você ainda [instala a CLI](#install-and-choose-a-provider), [inicializa o projeto](#initialise-the-project) e [traduz](#translate) no final.

1. [Aponte a configuração para seus catálogos](#point-the-config).
2. [Envolva strings](#wrap-strings) com as chamadas gettext que você já usa.
3. [Extraia e verifique as chamadas](#extract-and-check).
4. [Troque o idioma em tempo de execução](#switch-language).

<a id="step-1-point-the-config-at-your-catalogs"></a>
## Etapa 1: Aponte a configuração para seus catálogos

O template escreve padrões sensatos. Este é o do Django:

```json
{
  "ui": {
    "sourceRoots": ["."],
    "stringsJson": "locale/strings.json",
    "flatOutputDir": "locale",
    "flatOutput": false,
    "gettext": {
      "outputDir": "locale",
      "domain": "django",
      "potPath": "locale/django.pot",
      "compileMo": true,
      "ingestExistingPo": true,
      "localeFormat": "posix"
    }
  }
}
```

Verifique quatro coisas no seu projeto:

- `gettext.outputDir` e `potPath` são onde seus catálogos já estão. Django: a pasta em `LOCALE_PATHS`, ou a pasta `locale/` dentro de um aplicativo. Flask-Babel: `translations/`.
- `gettext.domain` é o nome do arquivo que seu aplicativo carrega. Django usa `django`. Flask-Babel usa `messages`. Para gettext puro, é o domínio na sua chamada `gettext.translation(...)`.
- `sourceRoots` lista as pastas que `extract` escaneia. Restrinja-o de `"."` para o código da sua aplicação, para que testes e scripts fiquem fora do catálogo.
- `stringsJson` é o cache de extração, um arquivo que esta ferramenta possui. Mantenha-o ao lado dos catálogos. Não é um arquivo de tempo de execução. Seu aplicativo nunca o lê.

Quando cada aplicativo Django mantém sua própria pasta `locale/`, use um bloco `ui` por árvore de catálogo. `ui` aceita uma lista, e `--ui-block` executa um bloco. Os caminhos devem ser únicos entre os blocos. Veja [Configuração](/pt-BR/reference/configuration).

`ingestExistingPo` está ativado por padrão. Durante `extract`, as traduções já existentes em seus arquivos `.po` preenchem espaços vazios. Uma tradução que já está definida não é substituída. Confirme seus catálogos antes do primeiro `translate-ui`, porque ele reescreve os arquivos `.po` e compila os arquivos `.mo`. Revise esse diff.

`compileMo` escreve o `.mo` para você, então você não precisa de `compilemessages` neste fluxo de trabalho. Escolha uma ferramenta para escrever os catálogos: executar `makemessages` após `translate-ui` reescreve os mesmos arquivos `.po`.

<a id="step-2-wrap-strings"></a>
## Etapa 2: Envolva strings

`extract` registra uma string apenas quando é um literal passado para um dos nomes de função em `ui.uiExtractor.funcNames`, ou uma tag de template. Mantenha as chamadas que você tem. Adicione o que está faltando.

Código Python:

```python
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy, ngettext, pgettext

_("Welcome back")
_("Hello, %(name)s!") % {"name": name}
ngettext("%(count)d file", "%(count)d files", n) % {"count": n}
pgettext("menu", "Open")

class Article(models.Model):
    title = models.CharField(gettext_lazy("Title"), max_length=200)
```

Espaços reservados usam `%(name)s`. Passe os valores após a pesquisa com `%`, nunca antes dela. Modelos, formulários e configurações são executados quando o módulo é importado, portanto, eles usam a forma preguiçosa. Não aplique `%` a uma string preguiçosa no momento da importação. Use `format_lazy` em vez disso.

Templates (Django `{% load i18n %}`, ou Jinja no Flask):

```jinja
{% load i18n %}
<h1>{% translate "Welcome back" %}</h1>
{% blocktranslate with name=user.name %}Hello, {{ name }}!{% endblocktranslate %}
```

`{% translate %}`, `{% trans %}`, `{% blocktranslate %}` e `{% blocktrans %}` são coletados por conta própria. Uma variável de template como <code v-pre>{{ name }}</code> é armazenada como `%(name)s`. Mantenha-o nessa forma.

Nomes que `extract` não conhece são ignorados. A lista padrão é `_`, `t`, `translate`, `i18n.t`, `gettext`, `ngettext`, `pgettext` e `self.tr`. Se o código chamar `gettext_lazy("…")` diretamente, `ngettext_lazy`, `pgettext_lazy`, `npgettext` ou `gettext_noop`, adicione esses nomes a `ui.uiExtractor.funcNames`. Quando você importa a função lazy como `_`, como em `gettext_lazy as _`, o nome `_` já está coberto.

Envolva o texto que uma pessoa vê: rótulos, títulos, mensagens, texto de formulário e modelo, e-mails. Mantenha identificadores, URLs, nomes de campo, chaves de configuração, mensagens de log e migrações inalterados. Não reformule o texto original. Uma tradução ausente retorna a frase original, então o aplicativo parece o mesmo no idioma original.

Essas chamadas avaliam a formatação antes da pesquisa, então a string nunca corresponde a uma entrada de catálogo:

```python
_(f"Hello, {name}!")
_("Hello, %s!" % name)
_("Hello, {name}!".format(name=name))
```

<a id="step-3-extract-and-check-the-calls"></a>
## Passo 3: Extrair e verificar as chamadas

Execute `extract` depois que as chamadas forem encapsuladas. Ele escreve o cache de extração e preenche os espaços vazios dos seus arquivos `.po` existentes. Ele não chama um modelo.

```bash
ai-i18n-tools extract
```

Em seguida, procure por chamadas que formatam antes da pesquisa. `migrate-python-i18n` as encontra. Execute-o sem `--write`:

```bash
ai-i18n-tools migrate-python-i18n
```

Ele escreve `migrate-python-i18n-report.md`. Leia-o e corrija cada chamada listada manualmente com `%(name)s` e um dicionário. Exclua o relatório ou adicione-o ao git-ignore.

Não passe `--write` nesta página. Essa opção reescreve uma f-string ou uma chamada `.format()` em `t("…", name=name)`, uma chamada que existe apenas no auxiliar `i18n.py`. Um aplicativo gettext não tem `t`. Um relatório sem linhas significa que as chamadas encapsuladas estão seguras. Isso não significa que cada frase foi encapsulada, então leia o diff de `strings.json` e procure pelo texto que você esperava ver.

<a id="step-4-switch-language-at-runtime"></a>
## Passo 4: Trocar o idioma em tempo de execução

Seu framework escolhe o idioma. ai-i18n-tools não adiciona um menu ou um auxiliar.

<a id="django"></a>
### Django

Em `settings.py`:

```python
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("pt-br", "Português (Brasil)"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]

MIDDLEWARE = [
    # ...
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    # ...
]
```

`LocaleMiddleware` vem depois do middleware de sessão e antes de `CommonMiddleware`. `LANGUAGE_CODE` é o idioma de origem. `LANGUAGES` lista os idiomas que um visitante pode escolher. `LOCALE_PATHS` aponta para a pasta onde `gettext.outputDir` escreve, a menos que cada aplicativo mantenha sua própria pasta `locale/`.

Adicione a view de troca de idioma do Django a `urls.py`:

```python
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    # ...
]
```

Em seguida, adicione um formulário a um template:

```jinja
{% load i18n %}
{% get_current_language as CURRENT %}
{% get_available_languages as LANGUAGES %}
<form action="{% url 'set_language' %}" method="post">
  {% csrf_token %}
  <input name="next" type="hidden" value="{{ request.get_full_path }}">
  <select name="language" onchange="this.form.submit()">
    {% for code, name in LANGUAGES %}
      <option value="{{ code }}"{% if code == CURRENT %} selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>
</form>
```

A view salva a escolha em um cookie. Para colocar o idioma na URL, em vez disso, use `i18n_patterns`. Ambos são recursos padrão do Django. Consulte a documentação do Django sobre internacionalização.

<a id="plain-gettext-and-flask-babel"></a>
### gettext simples e Flask-Babel

Carregue o catálogo para o idioma desejado e chame-o. O exemplo [python-gettext](/pt-BR/examples#python-gettext) faz isso em uma ferramenta de linha de comando:

```python
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation("messages", localedir=str(LOCALEDIR), languages=[code], fallback=True)


_ = load_catalog("pt-BR").gettext
print(_("Hello"))
```

Converta `pt-BR` para `pt_BR`, o nome da pasta que `translate-ui` escreveu. Mantenha `fallback=True` para que um catálogo ausente mostre o texto de origem. Em um aplicativo web, construa o objeto de traduções por requisição e não instale um globalmente com `gettext.install`, ou requisições concorrentes compartilharão um idioma. No Flask-Babel, retorne o código da sua função seletora de localidade e mantenha `translations/` como seu diretório de tradução.

Este é o último passo manual. Continue em [Escolher modelos e traduzir](#translate).

<a id="not-your-case"></a>
## Não é o seu caso?

| Você tem | Leia |
| --- | --- |
| Um aplicativo Streamlit, FastAPI, Flask, desktop ou script sem gettext | [Adicionar i18n a um aplicativo Python](/pt-BR/guide/add-i18n-to-python) |
| Um aplicativo JS/TS | [Adicionar i18n a um aplicativo JS/TS](/pt-BR/guide/add-i18n-to-js) |
| Um site ou site de documentação | [Adicionar i18n a um site ou site de documentação](/pt-BR/guide/add-i18n-to-website) |
| Um README de repositório ou outros arquivos Markdown | [Adicionar i18n ao seu README e documentos Markdown](/pt-BR/guide/add-i18n-to-readme) |

<a id="examples"></a>
## Exemplos

| Exemplo | O que ele mostra |
| --- | --- |
| [python-gettext](/pt-BR/examples#python-gettext) | Uma ferramenta de linha de comando gettext existente; `translate-ui` atualiza `.po` e `.mo` |

Não há diretório de exemplo do Django. O exemplo `python-gettext` mostra a mesma forma de configuração com o domínio `messages`. Copie-o com `npx degit`, ou baixe `ai-i18n-tools-python-examples.zip` do GitHub Release. Comandos: [Exemplos](/pt-BR/examples#python-examples).
