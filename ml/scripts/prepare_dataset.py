"""Build the 3-class training dataset from the Kaggle "Garbage Classification (12 classes)" set.

Steps:
  1. Map source folders to the target classes (organic / plastic / paper).
  2. Drop exact duplicate images (MD5 of file bytes) so the same picture can
     never land in both train and test (data leakage).
  3. Sample a balanced number of images per class.
  4. Split 70 / 15 / 15 into data/processed/{train,val,test}/<class>/ with a fixed seed.

Usage:
    python scripts/prepare_dataset.py [--per-class 600] [--seed 42]
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "garbage_classification"
OUT_DIR = ROOT / "data" / "processed"

# target class -> source folders in the Kaggle dataset
CLASS_MAP: dict[str, list[str]] = {
    "organic": ["biological"],
    "plastic": ["plastic"],
    "paper": ["paper", "cardboard"],
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SPLITS = {"train": 0.70, "val": 0.15, "test": 0.15}


def md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def collect(sources: list[str], seen: set[str]) -> tuple[dict[str, list[Path]], int]:
    """Return unique images grouped by source folder, plus the number of duplicates dropped."""
    grouped: dict[str, list[Path]] = {}
    duplicates = 0
    for source in sources:
        files = sorted(p for p in (RAW_DIR / source).iterdir() if p.suffix.lower() in IMAGE_EXTS)
        unique = []
        for f in files:
            h = md5(f)
            if h in seen:
                duplicates += 1
                continue
            seen.add(h)
            unique.append(f)
        grouped[source] = unique
    return grouped, duplicates


def sample_balanced(grouped: dict[str, list[Path]], n: int, rng: random.Random) -> list[Path]:
    """Take n images, spread evenly over the source folders (e.g. paper + cardboard)."""
    per_source = n // len(grouped)
    picked: list[Path] = []
    for files in grouped.values():
        files = files[:]
        rng.shuffle(files)
        picked.extend(files[:per_source])
    return picked


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-class", type=int, default=600)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    if not RAW_DIR.exists():
        raise SystemExit(f"Raw dataset not found at {RAW_DIR}. Download it first (see dataset/README.md).")

    rng = random.Random(args.seed)
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)

    seen: set[str] = set()
    summary: dict = {"seed": args.seed, "per_class": args.per_class, "classes": {}}

    for cls, sources in CLASS_MAP.items():
        grouped, dups = collect(sources, seen)
        images = sample_balanced(grouped, args.per_class, rng)
        rng.shuffle(images)

        n = len(images)
        n_train = int(n * SPLITS["train"])
        n_val = int(n * SPLITS["val"])
        parts = {
            "train": images[:n_train],
            "val": images[n_train : n_train + n_val],
            "test": images[n_train + n_val :],
        }

        for split, files in parts.items():
            target = OUT_DIR / split / cls
            target.mkdir(parents=True, exist_ok=True)
            for f in files:
                shutil.copy2(f, target / f"{f.parent.name}_{f.name}")

        summary["classes"][cls] = {
            "sources": sources,
            "available_unique": {s: len(v) for s, v in grouped.items()},
            "duplicates_removed": dups,
            "total": n,
            **{split: len(files) for split, files in parts.items()},
        }
        print(f"{cls:8s} total={n} " + " ".join(f"{k}={len(v)}" for k, v in parts.items()) + f" dup_removed={dups}")

    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"Saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
