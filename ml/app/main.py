"""Waste classification REST API. Swagger UI: /docs"""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile, status

from .config import settings
from .model import InvalidImageError, WasteClassifier
from .schemas import ClassList, Health, Prediction

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
state: dict[str, WasteClassifier | None] = {"model": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Loaded once at startup, not per request.
    state["model"] = WasteClassifier(settings.model_path, settings.labels_path, settings.confidence_threshold)
    yield
    state["model"] = None


app = FastAPI(
    title="Smart Waste Management — ML API",
    description=(
        "Klasifikasi gambar sampah: **organic**, **paper**, **plastic**, atau **other** "
        "(bukan salah satu dari 3 jenis sampah itu, mis. gitar atau botol kaca). MobileNetV2, TFLite."
    ),
    version=settings.model_version,
    lifespan=lifespan,
)


def get_model() -> WasteClassifier:
    model = state["model"]
    if model is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Model belum dimuat.")
    return model


def verify_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if settings.api_key and x_api_key != settings.api_key:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "API key tidak valid.")


@app.get("/health", response_model=Health, tags=["meta"])
def health():
    model = state["model"]
    return Health(
        status="ok" if model else "loading",
        model_loaded=model is not None,
        model_version=settings.model_version,
        classes=model.labels if model else [],
    )


@app.get("/classes", response_model=ClassList, tags=["meta"])
def classes(model: WasteClassifier = Depends(get_model)):
    return ClassList(classes=model.labels)


@app.post(
    "/predict",
    response_model=Prediction,
    tags=["prediction"],
    dependencies=[Depends(verify_api_key)],
    responses={400: {"description": "File bukan gambar"}, 413: {"description": "File terlalu besar"}},
)
async def predict(file: UploadFile = File(..., description="Foto sampah (jpg/png/webp)"), model: WasteClassifier = Depends(get_model)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Format harus JPG, PNG, atau WEBP.")

    data = await file.read()
    if len(data) > settings.max_file_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Ukuran maksimal {settings.max_file_mb:g} MB.")

    try:
        return model.predict(data)
    except InvalidImageError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e)) from e
