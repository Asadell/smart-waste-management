"""Download candidate seeder photos from Pexels, grouped by waste category.

The photos are only *candidates*: review them by eye and copy the good ones
to backend/database/seeders/photos/<category>/ (see that folder's manifest.json).

API keys are read from $PEXELS_API_KEY or ~/.pexels_keys (one key per line,
rotated when a key is rate limited). Keys are never written to the output.

Usage:
    python scripts/fetch_seed_photos.py --out /tmp/pexels-candidates [--per-query 4]
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

QUERIES = {
    "organic": ["food waste", "rotten vegetables", "compost food scraps", "fruit peel waste", "rotten fruit"],
    "plastic": ["plastic bottles waste", "plastic waste pile", "plastic bag trash", "plastic pollution", "plastic garbage"],
    "paper": ["cardboard boxes waste", "paper waste recycling", "crumpled paper trash", "old newspapers pile", "cardboard recycling"],
}


def load_keys() -> list[str]:
    if os.getenv("PEXELS_API_KEY"):
        return [os.environ["PEXELS_API_KEY"]]
    path = Path.home() / ".pexels_keys"
    if not path.exists():
        raise SystemExit("Set PEXELS_API_KEY or create ~/.pexels_keys")
    return [k.strip() for k in path.read_text().splitlines() if k.strip()]


def search(query: str, keys: list[str], per_page: int) -> list[dict]:
    url = "https://api.pexels.com/v1/search?" + urllib.parse.urlencode(
        {"query": query, "per_page": per_page, "orientation": "landscape"}
    )
    for key in keys:
        req = urllib.request.Request(url, headers={"Authorization": key, "User-Agent": "swm-seeder/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                return json.load(res)["photos"]
        except urllib.error.HTTPError as e:
            if e.code in (401, 403, 429):
                continue  # try the next key
            raise
    raise SystemExit("All Pexels keys failed (rate limited or invalid).")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--per-query", type=int, default=4)
    args = parser.parse_args()

    keys = load_keys()
    manifest = []
    seen: set[int] = set()

    for category, queries in QUERIES.items():
        folder = args.out / category
        folder.mkdir(parents=True, exist_ok=True)
        for query in queries:
            for photo in search(query, keys, args.per_query):
                if photo["id"] in seen:
                    continue
                seen.add(photo["id"])
                filename = f"pexels-{photo['id']}.jpg"
                req = urllib.request.Request(photo["src"]["large"], headers={"User-Agent": "swm-seeder/1.0"})
                with urllib.request.urlopen(req, timeout=30) as res:
                    (folder / filename).write_bytes(res.read())
                manifest.append({
                    "category": category,
                    "file": f"{category}/{filename}",
                    "pexels_id": photo["id"],
                    "photographer": photo["photographer"],
                    "photographer_url": photo["photographer_url"],
                    "url": photo["url"],
                    "alt": photo.get("alt"),
                    "query": query,
                })
        print(f"{category}: {sum(1 for m in manifest if m['category'] == category)} candidates")

    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"Saved to {args.out}")


if __name__ == "__main__":
    main()
