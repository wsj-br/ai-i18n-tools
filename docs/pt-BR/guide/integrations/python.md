<a id="python"></a>
# Python

Seletor para aplicações Python. A extração, os catálogos e os formatos de chamada estão em [Aplicações Python](/pt-BR/guide/ui-strings/python). O passo a passo para uma aplicação existente de localidade única está em [Adicionar i18n a uma aplicação Python](/pt-BR/guide/add-i18n-to-python), com um [prompt do `i18n.py`](/pt-BR/guide/add-i18n-to-python#run-the-agent-prompt) e um [prompt do Django / gettext](/pt-BR/guide/add-i18n-to-python#agent-prompt-django-gettext).

Streamlit, FastAPI, Flask, Pyramid, Tkinter, PyQt, PySide e PyWebView chamam o auxiliar `i18n.py` gerado (Python 3.10 ou mais recente). O Django mantém o gettext do Django. Quatro cópias executáveis são fornecidas no repositório: `examples/python-streamlit`, `examples/python-flask`, `examples/python-fastapi` e `examples/python-gettext`. Pyramid, Django, Tkinter, Qt e PyWebView não possuem um diretório de exemplo separado.

<a id="which-template"></a>
## Qual modelo

| Framework | Template de inicialização | Catálogo | Exemplo |
| --- | --- | --- | --- |
| Streamlit | `ui-python` | JSON plano indexado pela string de origem | [python-streamlit](/pt-BR/examples#python-streamlit) |
| FastAPI | `ui-python` | JSON plano indexado pela string de origem | [python-fastapi](/pt-BR/examples#python-fastapi) |
| Flask + Jinja, JSON plano | `ui-python` | JSON plano indexado pela string de origem | [python-flask](/pt-BR/examples#python-flask) |
| Flask / Jinja gettext | `ui-python-flask` | `.po` / `.mo` em `translations/` | Use as notas do Flask abaixo |
| Pyramid | `ui-python` ou `ui-python-flask` | O mesmo que o Flask | A mesma configuração do Flask |
| Django | `ui-python-django` | `locale/<lang>/LC_MESSAGES/django.po` | Sem diretório de exemplo |
| GNU gettext existente | `ui-python-gettext` | JSON simples e `.po` / `.mo`, ou apenas gettext | [python-gettext](/pt-BR/examples#python-gettext) |
| Tkinter | `ui-python` | JSON plano indexado pela string de origem | Nenhum diretório de exemplo |
| PyQt / PySide | `ui-python` ou um modelo gettext | JSON simples e/ou `.po` | Sem diretório de exemplo |
| PyWebView / PyWebKit | Um modelo Python para o shell | Catálogos de shell, além de marcadores HTML ou um arquivo HTML por localidade | Sem diretório de exemplo |

`ui-python`, `ui-python-gettext` e `ui-python-flask` gravam `i18n.py` quando esse arquivo não existe. `ui-python-django` não. Adicione `--with-readme` para traduzir também o README do repositório: [Adicionar i18n ao seu README e aos seus documentos Markdown](/pt-BR/guide/add-i18n-to-readme).

<a id="framework-notes"></a>
## Notas sobre os frameworks

<a id="streamlit"></a>
### Streamlit

`streamlit_language_selector()` grava a localidade no estado da sessão e na string de consulta. Dê a cada widget uma `key` fixa. Detalhes: [Locale — Streamlit](/pt-BR/guide/ui-strings/python#streamlit).

<a id="fastapi"></a>
### FastAPI

Leia `?lang=` ou `Accept-Language` no middleware, chame `set_locale` e `reset_locale` em `finally` para que solicitações simultâneas mantenham sua própria localidade. Detalhes: [Locale — FastAPI](/pt-BR/guide/ui-strings/python#fastapi).

<a id="flask-and-pyramid"></a>
### Flask e Pyramid

O exemplo [python-flask](/pt-BR/examples#python-flask) usa JSON simples. `init -t ui-python-flask` é o layout gettext em `translations/` para um aplicativo que já usa catálogos no estilo Flask-Babel. De qualquer forma, defina a localidade a partir da requisição e injete `_`, `t`, `current_locale`, `ui_languages` e `direction` no contexto do template. O Pyramid usa o mesmo padrão de escopo de requisição. Detalhes: [Locale — Flask and Pyramid](/pt-BR/guide/ui-strings/python#flask).

<a id="django"></a>
### Django

Mantenha `gettext`, `ngettext` e `{% blocktrans %}`. `init -t ui-python-django` corresponde ao diretório `locale/` do Django e ao domínio `django`, e mantém o runtime do Django no lugar. Detalhes: [Locale — Django](/pt-BR/guide/ui-strings/python#django).

<a id="existing-gettext"></a>
### gettext existente

Deixe `_()`, `gettext()` e `ngettext()` no lugar. Aponte `ui.gettext` para a árvore de catálogo atual e execute `extract`, depois `translate-ui`. O exemplo [python-gettext](/pt-BR/examples#python-gettext) é apenas gettext (`flatOutput: false`). `init -t ui-python-gettext` também grava JSON simples. Detalhes: [Locale — Existing gettext](/pt-BR/guide/ui-strings/python#gettext).

<a id="tkinter-qt-and-pywebview"></a>
### Tkinter, Qt e PyWebView

Chame `t()` ou `_()` ao criar cada widget Tkinter, depois reconstrua o texto visível após `set_locale`. As chamadas `self.tr("...")` do PyQt e PySide são extraídas, e os arquivos `.ui` do Qt contribuem com elementos `<string>`, a menos que `notr="true"`. Para PyWebView ou PyWebKit, extraia o shell Python com um template acima e extraia a página HTML com marcadores `data-i18n` ou com um documento HTML por localidade. Detalhes: [Locale — Tkinter](/pt-BR/guide/ui-strings/python#tkinter), [PyQt / PySide](/pt-BR/guide/ui-strings/python#pyqt) e [PyWebView](/pt-BR/guide/ui-strings/python#pywebview).
