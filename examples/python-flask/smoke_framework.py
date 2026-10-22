"""Flask test-client smoke test. Requires Flask from requirements.txt."""

from app import create_app


def main() -> None:
    client = create_app().test_client()
    response = client.get("/?lang=es")
    page = response.get_data(as_text=True)
    assert response.status_code == 200
    assert "<h1>" in page
    assert "Ada" in page
    print("python-flask framework smoke ok")


if __name__ == "__main__":
    main()
