# ML — Waste Classifier

Klasifikasi foto sampah ke 3 kelas (**organic**, **paper**, **plastic**) dengan transfer learning
**MobileNetV2** (TensorFlow/Keras), disajikan lewat REST API **FastAPI**.

## Struktur
```
ml/
├── dataset/README.md          # sumber, lisensi, mapping kelas, jumlah per split
├── scripts/prepare_dataset.py # mapping + dedup + sampling + split
├── notebooks/training.ipynb   # training, evaluasi, export model
├── models/                    # waste_classifier.keras, .tflite, labels.json (hasil notebook)
├── reports/                   # accuracy, confusion matrix, classification report, kurva
├── app/                       # FastAPI (main.py, model.py, schemas.py, config.py)
├── tests/                     # test API dengan stub model
├── requirements.txt           # dependency serving
└── requirements-train.txt     # dependency training
```

## Training
Butuh Python 3.10–3.12 (TensorFlow belum mendukung 3.13+).
```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-train.txt
python scripts/prepare_dataset.py
jupyter nbconvert --to notebook --execute --inplace notebooks/training.ipynb
```
Bisa juga dijalankan di Kaggle Notebook / Google Colab (GPU gratis): upload folder `data/processed`, lalu jalankan semua cell.

**Pendekatan**
- Input 224×224. Augmentasi (flip, rotasi, zoom, brightness) dan preprocessing MobileNetV2 ada **di dalam model**, jadi API cukup mengirim RGB 0–255.
- Tahap 1: base dibekukan, latih head (GAP → Dropout 0.3 → Dense softmax), LR 1e-3.
- Tahap 2: fine-tune 30 layer terakhir (BatchNorm tetap beku), LR 1e-5.
- Callback: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint.
- Notebook menyimpan `reports/metrics.json`, `classification_report.txt`, `confusion_matrix.png`, `training_curves.png`.

## Hasil
Training di RTX 3050 6 GB (TensorFlow 2.21): **2 menit 19 detik**, berhenti di epoch 19 (EarlyStopping).

| Metrik (test set, 270 gambar) | Nilai |
|---|---|
| Accuracy model Keras | **97,04%** (262/270) |
| Accuracy model TFLite (lewat `app/model.py`, sama dengan API) | **97,78%** (264/270) |
| Macro F1 | 0,9704 |
| Ukuran model | `.keras` 21 MB · `.tflite` 2,4 MB (dynamic range quantization) |

| Kelas | Precision | Recall | F1 |
|---|---|---|---|
| organic | 1,0000 | 1,0000 | 1,0000 |
| paper | 0,9659 | 0,9444 | 0,9551 |
| plastic | 0,9457 | 0,9667 | 0,9560 |

Confusion matrix (`reports/confusion_matrix.png`): organic sempurna; semua kesalahan ada di **paper ↔ plastic**
(5 paper → plastic, 3 plastic → paper), karena kemasan/kantong plastik dan kertas mengkilap memang mirip secara visual.
Kurva train vs val (`reports/training_curves.png`) rapat, tanpa overfitting berarti.

### Uji foto dunia nyata
Model juga dicoba pada 24 foto Pexels yang dipakai seeder (sumber berbeda dari dataset, belum pernah dilihat model):
**18/24 = 75%**. Penurunan dari 97% ini karena *domain shift*: dataset Kaggle kebanyakan berisi satu objek dengan
latar bersih, sedangkan foto laporan berisi tumpukan sampah di lokasi nyata (sungai, lahan kosong, tumpukan campur).
Sebagian prediksi yang meragukan sudah tertangkap oleh threshold `uncertain` (confidence < 0,6), sehingga user diminta memilih
kategori sendiri. Untuk produksi sungguhan, langkah berikutnya adalah menambah data foto "di lapangan" ke training set.

## REST API
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Swagger: http://localhost:8000/docs
```

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/health` | status, versi model, daftar kelas |
| GET | `/classes` | daftar kelas |
| POST | `/predict` | `multipart/form-data` field `file` |

```bash
curl -F "file=@botol.jpg" http://localhost:8000/predict
# {"label":"plastic","confidence":0.94,"uncertain":false,"probabilities":{"organic":0.02,"paper":0.04,"plastic":0.94}}
```
- `uncertain: true` bila confidence < `CONFIDENCE_THRESHOLD` (default 0.6), misalnya foto bukan sampah. Client lalu meminta user memilih kategori sendiri.
- Validasi: hanya JPG/PNG/WEBP, maks `MAX_FILE_MB` (default 10).
- Bila `API_KEY` di-set, request wajib membawa header `X-API-Key` (dipakai backend Laravel).

| Env | Default |
|---|---|
| `MODEL_PATH` | `models/waste_classifier.tflite` |
| `LABELS_PATH` | `models/labels.json` |
| `CONFIDENCE_THRESHOLD` | `0.6` |
| `MAX_FILE_MB` | `10` |
| `API_KEY` | kosong (tanpa auth) |

Image Docker memakai runtime **TFLite (`ai-edge-litert`)**, bukan TensorFlow penuh, jadi ringan di RAM VPS.

## Test
```bash
pytest   # memakai stub model, tidak butuh file model maupun TensorFlow
```
