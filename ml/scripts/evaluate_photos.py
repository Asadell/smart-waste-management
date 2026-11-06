"""Run the exported TFLite model on folders of photos, exactly like the API does.

Uses app/model.py (same preprocessing, threshold and labels as the deployed service), so
the result is what a user would see after sending the photo from the phone.

The expected class is read from the parent folder name or the file name prefix
(organic/organik, paper/kertas, plastic/plastik, other/lainnya). Files without one are
only listed.

Examples:
    # real-world seeder photos (Pexels): waste piles must NOT become "other"
    python scripts/evaluate_photos.py ../backend/database/seeders/photos
    # sample photos + your own phone photos (e.g. gitar.jpg)
    python scripts/evaluate_photos.py ../../gambar
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import settings  # noqa: E402
from app.model import InvalidImageError, WasteClassifier  # noqa: E402

ALIASES = {
    "organic": "organic", "organik": "organic",
    "paper": "paper", "kertas": "paper",
    "plastic": "plastic", "plastik": "plastic",
    "other": "other", "lainnya": "other", "bukan": "other",
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def expected_label(path: Path) -> str | None:
    if path.parent.name.lower() in ALIASES:
        return ALIASES[path.parent.name.lower()]
    prefix = path.stem.lower().split("-")[0].split("_")[0]
    return ALIASES.get(prefix)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("folders", nargs="+", type=Path)
    args = parser.parse_args()

    model = WasteClassifier(settings.model_path, settings.labels_path, settings.confidence_threshold)
    print(f"Model classes: {model.labels} | threshold {settings.confidence_threshold}\n")

    files = sorted(p for f in args.folders for p in f.rglob("*") if p.suffix.lower() in IMAGE_EXTS)
    stats: Counter = Counter()
    for path in files:
        try:
            r = model.predict(path.read_bytes())
        except InvalidImageError:
            print(f"  ??  {path.name}: bukan gambar valid")
            continue
        want = expected_label(path)
        if r["label"] == "other":
            shown = "TIDAK DIKENALI"
        else:
            shown = r["label"] + (" (ragu)" if r["uncertain"] else "")
        mark = "  " if want is None else ("OK" if r["label"] == want else "XX")
        print(f"  {mark}  {str(path.relative_to(path.parents[1])):45s} -> {shown:16s} {r['confidence']:.0%}"
              + (f"   (harusnya {want})" if want and r["label"] != want else ""))
        if want:
            stats["total"] += 1
            stats["correct"] += r["label"] == want
            if want != "other" and r["label"] == "other":
                stats["waste_rejected"] += 1
            if want == "other" and r["label"] != "other":
                stats["other_leaked"] += 1

    if stats["total"]:
        print(f"\nBenar: {stats['correct']}/{stats['total']} ({stats['correct'] / stats['total']:.0%})")
        print(f"Sampah asli yang ditolak sebagai 'other': {stats['waste_rejected']}")
        print(f"Bukan sampah yang lolos sebagai sampah:   {stats['other_leaked']}")


if __name__ == "__main__":
    main()
