"""Concurrent FastAPI smoke test. Requires fastapi and httpx."""

from concurrent.futures import ThreadPoolExecutor

from fastapi.testclient import TestClient

from app import app


def main() -> None:
    client = TestClient(app)

    def fetch(lang: str) -> str:
        response = client.get(f"/greeting/Ada?lang={lang}")
        assert response.status_code == 200
        message = response.json()["message"]
        assert isinstance(message, str) and "Ada" in message
        return message

    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(fetch, ["es", "pt-BR"]))
    print("python-fastapi framework smoke ok")


if __name__ == "__main__":
    main()
