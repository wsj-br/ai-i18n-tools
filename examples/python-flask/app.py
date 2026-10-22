"""Flask shop localized with t() and _()."""

from __future__ import annotations

from flask import Flask, g, render_template, request
from i18n import _, get_direction, get_locale, get_ui_languages, reset_locale, set_locale, t


def create_app() -> Flask:
    app = Flask(__name__)

    @app.before_request
    def _pick_locale():
        code = request.args.get("lang") or request.accept_languages.best_match(
            ["en", "es", "pt-BR"]
        )
        g.locale_token = set_locale(code or "en")

    @app.teardown_request
    def _reset_locale(_exc):
        token = getattr(g, "locale_token", None)
        if token is not None:
            reset_locale(token)

    @app.context_processor
    def _inject():
        return {
            "_": _,
            "t": t,
            "current_locale": get_locale,
            "ui_languages": get_ui_languages,
            "direction": get_direction,
        }

    @app.get("/")
    def index():
        name = "Ada"
        kind = "notebook"
        count = 3
        return render_template(
            "index.html",
            name=name,
            kind=kind,
            count=count,
            selected=_("Items selected: %s") % kind,
        )

    return app


if __name__ == "__main__":
    create_app().run(debug=False)
