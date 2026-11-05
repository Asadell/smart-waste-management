import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Settings:
    model_path: Path = Path(os.getenv("MODEL_PATH", ROOT / "models" / "waste_classifier.tflite"))
    labels_path: Path = Path(os.getenv("LABELS_PATH", ROOT / "models" / "labels.json"))
    model_version: str = os.getenv("MODEL_VERSION", "1.0.0")
    # Below this confidence the prediction is flagged as uncertain (e.g. the photo is not waste).
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.6"))
    max_file_mb: float = float(os.getenv("MAX_FILE_MB", "10"))
    # Optional shared secret so only the Laravel backend can call the service.
    api_key: str | None = os.getenv("API_KEY") or None


settings = Settings()
