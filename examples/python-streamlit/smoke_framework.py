"""Framework smoke test. Requires the dependencies in requirements.txt."""

from streamlit.testing.v1 import AppTest


def main() -> None:
    app = AppTest.from_file("app.py", default_timeout=30)
    app.run()
    assert not app.exception, app.exception
    print("python-streamlit framework smoke ok")


if __name__ == "__main__":
    main()
