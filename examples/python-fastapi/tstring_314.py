"""Python 3.14 template-string check. This file is not imported on older Pythons."""

from i18n import reset_locale, set_locale, translate


def main() -> None:
    name = "Ada"
    token = set_locale("es")
    try:
        text = translate(t"Hello, {name}!")
        assert isinstance(text, str) and "Ada" in text, text
    finally:
        reset_locale(token)
    print("python-fastapi t-string ok")


if __name__ == "__main__":
    main()
