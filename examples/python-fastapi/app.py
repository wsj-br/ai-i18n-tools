"""FastAPI service localized with t() and _()."""

from __future__ import annotations

from fastapi import FastAPI, Request
from i18n import _, get_locale, reset_locale, set_locale, t

app = FastAPI()


@app.middleware("http")
async def locale_middleware(request: Request, call_next):
    raw = request.query_params.get("lang") or request.headers.get("accept-language", "")
    code = raw.split(",")[0].split(";")[0].strip() or "en"
    if code.lower().startswith("pt"):
        code = "pt-BR"
    elif code.lower().startswith("es"):
        code = "es"
    else:
        code = "en"
    token = set_locale(code)
    try:
        return await call_next(request)
    finally:
        reset_locale(token)


@app.get("/status")
def status() -> dict[str, str]:
    return {"message": _("Service is running"), "locale": get_locale()}


@app.get("/greeting/{name}")
def greeting(name: str) -> dict[str, str]:
    return {"message": t("Hello, {name}!", name=name)}


@app.get("/orders")
def orders(count: int = 1, order_id: int = 12) -> dict[str, str]:
    state = _("paid")
    return {
        "status": _("Order #%d status: %s") % (order_id, state),
        "items": t("{count} items", count=count),
    }
