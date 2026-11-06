# Dataset

Model versi 2 memakai **4 kelas**: `organic`, `paper`, `plastic`, dan `other` (bukan salah satu dari 3 jenis sampah itu).
Gambar diambil dari 4 dataset Kaggle.

## Sumber
| Folder `data/raw/` | Dataset | Link | Lisensi | Isi |
|---|---|---|---|---|
| `garbage_classification` | **Garbage Classification (12 classes)**, Mostafa Mohamed | https://www.kaggle.com/datasets/mostafaabla/garbage-classification | ODbL-1.0 | 15.150 gambar, 12 kelas |
| `garbage_v2` | **Garbage Dataset (v2)**, `sumn2u` | https://www.kaggle.com/datasets/sumn2u/garbage-classification-v2 | MIT | 10 kelas (`original/` dipakai, salinan `standardized_*` diabaikan) |
| `household` | **Recyclable and Household Waste Classification**, Alistair King | https://www.kaggle.com/datasets/alistairking/recyclable-and-household-waste-classification | MIT | 15.000 gambar, 30 jenis × 500 (`default` = foto studio, `real_world` = foto di lingkungan nyata) |
| `caltech101` | **Caltech-101**, `imbikramsaha` (mirror dari Caltech) | https://www.kaggle.com/datasets/imbikramsaha/caltech-101 | CC0-1.0 (di Kaggle) | 9.144 gambar, 101 jenis benda |

Catatan: sebagian gambar dataset sampah berasal dari web scraping atau dataset lain. Hak cipta foto tetap milik
pemilik aslinya; dataset ini dipakai untuk keperluan riset / non-komersial.

## Mapping kelas
| Kelas model | Sumber |
|---|---|
| `organic` | `biological` (12 kelas, v2) · Household: `food_waste`, `coffee_grounds`, `eggshells`, `tea_bags` |
| `paper` | `paper`, `cardboard` (12 kelas, v2) · Household: `cardboard_boxes`, `cardboard_packaging`, `magazines`, `newspaper`, `office_paper`, `paper_cups` |
| `plastic` | `plastic` (12 kelas, v2) · Household: `plastic_*` (8 jenis), `disposable_plastic_cutlery`, `styrofoam_cups`, `styrofoam_food_containers` |
| `other` | **kaca** (`*-glass`, `glass`, `glass_*`) · **logam** (`metal`, kaleng aluminium/baja, `aerosol_cans`) · **baterai** · **tekstil** (`clothes`, `shoes`, `clothing`) · **benda sehari-hari**: 84 jenis Caltech-101 |

Tidak dipakai: kelas `trash` (campuran, ambigu), dan jenis Caltech yang mirip makanan/tanaman/kertas
(`pizza`, `strawberry`, `sunflower`, `lotus`, `water_lilly`, `bonsai`, `joshua_tree`, `dollar_bill`, `cup`, `BACKGROUND_Google`).

**Set `unseen`** (hanya untuk uji, tidak pernah dipakai training): 8 jenis Caltech-101, yaitu `electric_guitar`, `cellphone`,
`laptop`, `umbrella`, `headphone`, `wrench`, `windsor_chair`, `lamp` (488 gambar). Dipakai untuk mengukur apakah
model menjawab `other` untuk benda yang benar-benar baru.

## Pemrosesan (`scripts/prepare_dataset.py`)
1. **Sampling seimbang**: target 2.500 gambar per kelas. Di dalam satu kelas, tiap kelompok sumber mendapat porsi sama
   (untuk `other`: kaca, logam, baterai, tekstil masing-masing 1 bagian, benda Caltech 2 bagian), dan gambar diambil
   bergiliran dari tiap folder supaya foto `default` dan `real_world` tercampur.
2. **Hapus duplikat** dengan perceptual hash (dHash 64-bit): dataset Kaggle banyak berbagi foto yang sama, kadang
   sudah di-encode ulang, sehingga hash byte (MD5) saja tidak cukup. Mencegah foto yang sama ada di train **dan** test.
   Hasil: **3.710 duplikat dibuang**.
3. **Re-encode** semua gambar ke JPEG RGB, sisi terpanjang 512 px (sekaligus menolak file rusak: 0 file).
4. **Split 70/15/15** dengan seed 42.

| Kelas | Train | Val | Test | Total |
|---|---|---|---|---|
| organic | 1.617 | 346 | 348 | 2.311* |
| paper | 1.750 | 375 | 375 | 2.500 |
| plastic | 1.750 | 375 | 375 | 2.500 |
| other | 1.750 | 375 | 376 | 2.501 |
| **Total** | **6.867** | **1.471** | **1.474** | **9.812** |
| unseen (uji saja) | | | | 488 |

\* `organic` kurang dari 2.500 karena setelah duplikat dibuang, gambar unik yang tersedia memang hanya sebanyak itu.

Hasil detail per kelompok sumber tersimpan di `data/processed/summary.json`.

## Cara mendapatkan ulang
```bash
pip install kaggle          # token API Kaggle di ~/.kaggle/
kaggle datasets download -d mostafaabla/garbage-classification -p data/raw --unzip
kaggle datasets download -d sumn2u/garbage-classification-v2 -p data/raw/garbage_v2 --unzip
kaggle datasets download -d alistairking/recyclable-and-household-waste-classification -p data/raw/household --unzip
kaggle datasets download -d imbikramsaha/caltech-101 -p data/raw/caltech101 --unzip
python scripts/prepare_dataset.py --per-class 2500 --seed 42
```
Folder `data/raw`, `data/processed`, dan `data/cache` tidak di-commit (lihat `.gitignore`).
