"""Build the 4-class training dataset (organic / paper / plastic / other) from several Kaggle sets.

Why a 4th class: a 3-class model must always answer organic, paper or plastic, so a
photo of a guitar came back as "99% paper". The `other` class teaches the model what
"not one of our waste types" looks like (glass, metal, clothes, shoes, batteries and
everyday objects from Caltech-101).

Steps:
  1. Find every source folder (see SOURCES) in the downloaded datasets under data/raw/.
  2. Sample a balanced number of images per class, spread round-robin over the sources,
     so no single dataset or sub-category dominates a class.
  3. Drop duplicates with a perceptual hash (dHash): the Kaggle sets share many photos,
     sometimes re-encoded, so a byte hash alone would let the same picture land in both
     train and test (data leakage).
  4. Re-encode every image to RGB JPEG (longest side 512 px). This also rejects broken files.
  5. Split 70 / 15 / 15 into data/processed/{train,val,test}/<class>/ with a fixed seed.
  6. Put the held-out Caltech categories (never used for training, e.g. electric_guitar)
     into data/processed/unseen/other/ to measure how well "other" generalises.

Usage:
    python scripts/prepare_dataset.py [--per-class 2500] [--seed 42]
"""

from __future__ import annotations

import argparse
import json
import random
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT_DIR = ROOT / "data" / "processed"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
SPLITS = {"train": 0.70, "val": 0.15, "test": 0.15}
MAX_SIDE = 512

# Downloaded dataset folders under data/raw/ (see dataset/README.md for links and licenses).
MOSTAFA = "garbage_classification"  # mostafaabla/garbage-classification (12 classes)
V2 = "garbage_v2"  # sumn2u/garbage-classification-v2 (10 classes)
HOUSEHOLD = "household"  # alistairking/recyclable-and-household-waste-classification (30 classes)
CALTECH = "caltech101"  # imbikramsaha/caltech-101 (101 object categories)

# target class -> group -> [(dataset, folder name)]
# Within a class, every group gets an equal share (by weight); within a group, images are
# taken round-robin from each folder, so e.g. `default` and `real_world` household photos mix.
SOURCES: dict[str, dict[str, list[tuple[str, str]]]] = {
    "organic": {
        "biological": [(MOSTAFA, "biological"), (V2, "biological")],
        "household": [(HOUSEHOLD, c) for c in ("food_waste", "coffee_grounds", "eggshells", "tea_bags")],
    },
    "paper": {
        "paper": [(MOSTAFA, "paper"), (V2, "paper")],
        "cardboard": [(MOSTAFA, "cardboard"), (V2, "cardboard")],
        "household": [
            (HOUSEHOLD, c)
            for c in ("cardboard_boxes", "cardboard_packaging", "magazines", "newspaper", "office_paper", "paper_cups")
        ],
    },
    "plastic": {
        "plastic": [(MOSTAFA, "plastic"), (V2, "plastic")],
        "household": [
            (HOUSEHOLD, c)
            for c in (
                "plastic_water_bottles", "plastic_soda_bottles", "plastic_detergent_bottles", "plastic_food_containers",
                "plastic_shopping_bags", "plastic_trash_bags", "plastic_cup_lids", "plastic_straws",
                "disposable_plastic_cutlery", "styrofoam_cups", "styrofoam_food_containers",
            )
        ],
    },
    "other": {
        # Look-alikes first: a glass bottle resembles a plastic one, cloth resembles a bag.
        "glass": [(MOSTAFA, c) for c in ("brown-glass", "green-glass", "white-glass")]
        + [(V2, "glass")]
        + [(HOUSEHOLD, c) for c in ("glass_beverage_bottles", "glass_food_jars", "glass_cosmetic_containers")],
        "metal": [(MOSTAFA, "metal"), (V2, "metal")]
        + [(HOUSEHOLD, c) for c in ("aluminum_soda_cans", "aluminum_food_cans", "steel_food_cans", "aerosol_cans")],
        "battery": [(MOSTAFA, "battery"), (V2, "battery")],
        "textile": [(MOSTAFA, "clothes"), (MOSTAFA, "shoes"), (V2, "clothes"), (V2, "shoes"), (HOUSEHOLD, "clothing"), (HOUSEHOLD, "shoes")],
        "objects": [],  # filled from Caltech-101 below
    },
}
# Share of each `other` group. Everyday objects get the biggest share because that is
# what users photograph by mistake (guitar, phone, chair...).
OTHER_WEIGHTS = {"glass": 1, "metal": 1, "battery": 1, "textile": 1, "objects": 2}

# Caltech categories that look like food/plants/paper would teach "other" the wrong thing.
CALTECH_EXCLUDE = {
    "BACKGROUND_Google", "pizza", "strawberry", "sunflower", "lotus", "water_lilly", "bonsai",
    "joshua_tree", "dollar_bill", "cup",
}
# Never seen in training: only used to test "other" on brand-new object types.
CALTECH_UNSEEN = {"electric_guitar", "cellphone", "laptop", "umbrella", "headphone", "wrench", "windsor_chair", "lamp"}


@dataclass
class Picker:
    """Round-robin sampler that skips near-duplicate images (dHash)."""

    seen: set[int] = field(default_factory=set)
    rejected: int = 0
    duplicates: int = 0

    def accept(self, path: Path) -> bool:
        """True if the image is readable and not a near-duplicate of one already picked."""
        im = open_rgb(path)
        if im is None:
            self.rejected += 1
            return False
        h = dhash(im)
        if h in self.seen:
            self.duplicates += 1
            return False
        self.seen.add(h)
        return True

    def take(self, folders: list[list[Path]], n: int) -> list[Path]:
        """Take up to n unique images, one folder at a time in turn."""
        iters = [iter(files) for files in folders if files]
        picked: list[Path] = []
        while iters and len(picked) < n:
            for it in list(iters):
                for path in it:
                    if self.accept(path):
                        picked.append(path)
                        break
                else:
                    iters.remove(it)
                if len(picked) >= n:
                    break
        return picked


def open_rgb(path: Path) -> Image.Image | None:
    try:
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
            return im
    except (UnidentifiedImageError, OSError, ValueError):
        return None


def dhash(im: Image.Image, size: int = 8) -> int:
    small = im.convert("L").resize((size + 1, size), Image.Resampling.LANCZOS)
    px = list(small.getdata())
    bits = 0
    for row in range(size):
        for col in range(size):
            bits = (bits << 1) | (px[row * (size + 1) + col] > px[row * (size + 1) + col + 1])
    return bits


def find_dirs(dataset: str, name: str) -> list[Path]:
    """All folders called `name` inside data/raw/<dataset>, ignoring case.

    If a dataset ships the same images twice (e.g. `original/` and a resized copy),
    only folders under a path containing "original" are kept.
    """
    base = RAW / dataset
    if not base.exists():
        return []
    hits = [p for p in base.rglob("*") if p.is_dir() and p.name.lower() == name.lower()]
    originals = [p for p in hits if "original" in str(p.relative_to(base)).lower()]
    return originals or hits


def images_in(folder: Path, rng: random.Random) -> list[Path]:
    files = sorted(p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXTS)
    rng.shuffle(files)
    return files


def caltech_categories() -> list[Path]:
    roots = [p for p in (RAW / CALTECH).rglob("*") if p.is_dir() and (p / "electric_guitar").is_dir()]
    if not roots:
        return []
    return sorted(p for p in roots[0].iterdir() if p.is_dir())


def save(path: Path, target: Path) -> None:
    im = open_rgb(path)
    assert im is not None, path  # already checked by Picker.accept
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target, "JPEG", quality=92)


def out_name(path: Path) -> str:
    rel = path.relative_to(RAW)
    return "_".join(rel.with_suffix("").parts[-3:]).replace(" ", "-") + ".jpg"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-class", type=int, default=2500)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    rng = random.Random(args.seed)
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)

    missing = [d for d in (MOSTAFA, V2, HOUSEHOLD, CALTECH) if not (RAW / d).exists()]
    if missing:
        print(f"WARNING: dataset folder(s) not found in {RAW}: {missing}. Continuing with what is available.")

    caltech = caltech_categories()
    SOURCES["other"]["objects"] = [(CALTECH, p.name) for p in caltech if p.name not in CALTECH_EXCLUDE | CALTECH_UNSEEN]

    picker = Picker()
    summary: dict = {"seed": args.seed, "per_class": args.per_class, "classes": {}}

    for cls, groups in SOURCES.items():
        weights = {g: (OTHER_WEIGHTS[g] if cls == "other" else 1) for g in groups}
        total_w = sum(weights.values())
        images: list[Path] = []
        group_info = {}
        for group, folders in groups.items():
            dirs = [d for ds, name in folders for d in find_dirs(ds, name)]
            files = [images_in(d, rng) for d in dirs]
            quota = round(args.per_class * weights[group] / total_w)
            got = picker.take(files, quota)
            images.extend(got)
            group_info[group] = {"folders": len(dirs), "available": sum(map(len, files)), "used": len(got)}
        # Top up from any group with spare images if a group could not fill its quota.
        if len(images) < args.per_class:
            dirs = [d for folders in groups.values() for ds, name in folders for d in find_dirs(ds, name)]
            used = set(images)
            spare = [[f for f in images_in(d, rng) if f not in used] for d in dirs]
            images.extend(picker.take(spare, args.per_class - len(images)))

        rng.shuffle(images)
        n = len(images)
        n_train, n_val = int(n * SPLITS["train"]), int(n * SPLITS["val"])
        parts = {"train": images[:n_train], "val": images[n_train : n_train + n_val], "test": images[n_train + n_val :]}
        for split, items in parts.items():
            for path in items:
                save(path, OUT_DIR / split / cls / out_name(path))

        summary["classes"][cls] = {"groups": group_info, "total": n, **{s: len(v) for s, v in parts.items()}}
        print(f"{cls:8s} total={n} " + " ".join(f"{k}={len(v)}" for k, v in parts.items()))
        for g, info in group_info.items():
            print(f"    {g:11s} folders={info['folders']:3d} available={info['available']:6d} used={info['used']}")

    # Held-out object types: everything from those Caltech categories, never in train/val/test.
    unseen = {}
    for p in caltech:
        if p.name in CALTECH_UNSEEN:
            got = picker.take([images_in(p, rng)], 10_000)
            for path in got:
                save(path, OUT_DIR / "unseen" / "other" / out_name(path))
            unseen[p.name] = len(got)
    summary["unseen_other"] = unseen
    summary["duplicates_removed"] = picker.duplicates
    summary["unreadable_skipped"] = picker.rejected
    print(f"unseen   {sum(unseen.values())} images from {sorted(unseen)}")
    print(f"duplicates removed={picker.duplicates} unreadable={picker.rejected}")

    (OUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"Saved to {OUT_DIR}")


if __name__ == "__main__":
    main()
