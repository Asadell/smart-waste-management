"""Loads the TFLite model once and runs inference."""

from __future__ import annotations

import io
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

try:  # Lightweight runtime used in the Docker image.
    from ai_edge_litert.interpreter import Interpreter
except ImportError:  # Fallback for a full TensorFlow install (training environment).
    import tensorflow as tf

    Interpreter = tf.lite.Interpreter


class InvalidImageError(ValueError):
    pass


class WasteClassifier:
    def __init__(self, model_path: Path, labels_path: Path, threshold: float):
        self.threshold = threshold
        self.labels: list[str] = json.loads(Path(labels_path).read_text())
        self._interpreter = Interpreter(model_path=str(model_path))
        self._interpreter.allocate_tensors()
        self._input = self._interpreter.get_input_details()[0]
        self._output = self._interpreter.get_output_details()[0]
        _, self._height, self._width, _ = self._input["shape"]

    def preprocess(self, data: bytes) -> np.ndarray:
        """Bytes -> float32 tensor (1, H, W, 3) with values 0-255.

        Scaling to [-1, 1] happens inside the model itself.
        """
        try:
            image = Image.open(io.BytesIO(data))
            image = ImageOps.exif_transpose(image).convert("RGB")
        except (UnidentifiedImageError, OSError) as e:
            raise InvalidImageError("File bukan gambar yang valid.") from e

        image = image.resize((self._width, self._height), Image.Resampling.BILINEAR)
        return np.expand_dims(np.asarray(image, dtype=np.float32), axis=0)

    def predict(self, data: bytes) -> dict:
        self._interpreter.set_tensor(self._input["index"], self.preprocess(data))
        self._interpreter.invoke()
        probs = self._interpreter.get_tensor(self._output["index"])[0]

        best = int(np.argmax(probs))
        confidence = float(probs[best])
        return {
            "label": self.labels[best],
            "confidence": round(confidence, 4),
            "uncertain": confidence < self.threshold,
            "probabilities": {label: round(float(p), 4) for label, p in zip(self.labels, probs)},
        }
