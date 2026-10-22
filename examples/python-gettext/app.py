"""Notes CLI that already uses GNU gettext.

Keep the gettext calls. ai-i18n-tools extracts them and refreshes the .po and .mo catalogs.
"""

from __future__ import annotations

import argparse
import gettext
from pathlib import Path

LOCALEDIR = Path(__file__).resolve().parent / "locales"
DOMAIN = "messages"


def load_catalog(lang: str) -> gettext.NullTranslations:
    code = lang.replace("-", "_")
    return gettext.translation(DOMAIN, localedir=str(LOCALEDIR), languages=[code], fallback=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Show a localized note.")
    parser.add_argument("--lang", default="en", help="Locale code, such as es or pt-BR")
    parser.add_argument("--name", default="Ada")
    parser.add_argument("--count", type=int, default=1)
    args = parser.parse_args()
    catalog = load_catalog(args.lang)
    _ = catalog.gettext
    ngettext = catalog.ngettext
    print(_("Notes"))
    print(_("Hello, %s!") % args.name)
    print(ngettext("1 note", "%(count)s notes", args.count) % {"count": args.count})


if __name__ == "__main__":
    main()
