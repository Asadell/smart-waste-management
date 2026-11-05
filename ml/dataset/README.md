# Dataset

## Sumber
| | |
|---|---|
| Nama | **Garbage Classification (12 classes)** |
| Pembuat | Mostafa Mohamed (`mostafaabla`) |
| Link | https://www.kaggle.com/datasets/mostafaabla/garbage-classification |
| Lisensi | **ODbL-1.0** (Open Database License) |
| Ukuran asli | 15.150 gambar, 12 kelas |

Catatan dari pembuat dataset: sebagian gambar berasal dari dataset Kaggle lain
(*Garbage Classification* oleh `asdasdasasdas`, *Clothing dataset*), sisanya hasil web scraping.
Hak cipta foto tetap milik pemilik aslinya; dataset ini dipakai untuk keperluan riset / non-komersial.

## Mapping kelas
Model memakai 3 kelas. Folder sumber dipetakan seperti ini:

| Kelas model | Folder sumber | Gambar tersedia |
|---|---|---|
| `organic` | `biological` | 985 |
| `plastic` | `plastic` | 865 |
| `paper` | `paper` + `cardboard` | 1.050 + 891 |

Kelas lain (battery, glass, metal, clothes, shoes, trash) tidak dipakai.

## Pemrosesan (`scripts/prepare_dataset.py`)
1. **Hapus duplikat**: hash MD5 setiap file. Gambar yang identik hanya disimpan sekali, supaya gambar yang sama tidak muncul di train **dan** test (data leakage).
2. **Sampling seimbang**: 600 gambar per kelas. Kelas `paper` diambil 300 dari `paper` + 300 dari `cardboard`.
3. **Split 70/15/15** dengan seed 42.

| Kelas | Train | Val | Test | Total |
|---|---|---|---|---|
| organic | 420 | 90 | 90 | 600 |
| plastic | 420 | 90 | 90 | 600 |
| paper | 420 | 90 | 90 | 600 |
| **Total** | **1.260** | **270** | **270** | **1.800** |

Hasil detail tersimpan di `data/processed/summary.json`.

## Cara mendapatkan ulang
```bash
pip install kaggle          # token API Kaggle di ~/.kaggle/
kaggle datasets download -d mostafaabla/garbage-classification -p data/raw --unzip
python scripts/prepare_dataset.py --per-class 600 --seed 42
```
Folder `data/raw` dan `data/processed` tidak di-commit (lihat `.gitignore`).
