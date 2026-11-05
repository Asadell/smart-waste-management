"""API tests with a stub model, so they run without the trained model or TensorFlow."""

import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app import main


class StubModel:
    labels = ["organic", "paper", "plastic"]

    def predict(self, data: bytes) -> dict:
        Image.open(io.BytesIO(data)).verify()
        return {"label": "plastic", "confidence": 0.91, "uncertain": False,
                "probabilities": {"organic": 0.04, "paper": 0.05, "plastic": 0.91}}


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(main, "WasteClassifier", lambda *a, **k: StubModel())
    with TestClient(main.app) as c:
        yield c


def jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), "green").save(buf, "JPEG")
    return buf.getvalue()


def test_health(client):
    body = client.get("/health").json()
    assert body["model_loaded"] is True
    assert body["classes"] == ["organic", "paper", "plastic"]


def test_predict_returns_label(client):
    res = client.post("/predict", files={"file": ("a.jpg", jpeg_bytes(), "image/jpeg")})
    assert res.status_code == 200
    assert res.json()["label"] == "plastic"


def test_predict_rejects_non_image(client):
    res = client.post("/predict", files={"file": ("a.txt", b"hello", "text/plain")})
    assert res.status_code == 400


def test_predict_requires_api_key_when_configured(client, monkeypatch):
    monkeypatch.setattr(main.settings, "api_key", "secret")
    res = client.post("/predict", files={"file": ("a.jpg", jpeg_bytes(), "image/jpeg")})
    assert res.status_code == 401
    res = client.post("/predict", files={"file": ("a.jpg", jpeg_bytes(), "image/jpeg")}, headers={"X-API-Key": "secret"})
    assert res.status_code == 200
