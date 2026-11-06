# ML — Waste Classifier

Klasifikasi foto sampah ke **4 kelas** (**organic**, **paper**, **plastic**, **other**) dengan transfer learning
**MobileNetV2** (TensorFlow/Keras), disajikan lewat REST API **FastAPI**.

`other` artinya foto **bukan** salah satu dari 3 jenis sampah (botol kaca, kaleng, baju, sepatu, baterai, atau benda
sehari-hari seperti gitar, HP, kursi). Model versi 1 hanya punya 3 kelas, sehingga selalu memaksa jawaban: foto gitar
terbaca *"99% kertas"*. Backend Laravel mengubah hasil `other` menjadi `label: null, recognized: false`, dan aplikasi
menampilkan *"AI tidak mengenali foto ini sebagai sampah"*.

## Struktur
```
ml/
├── dataset/README.md          # sumber, lisensi, mapping kelas, jumlah per split
├── scripts/prepare_dataset.py # mapping 4 dataset → 4 kelas, dedup, sampling, split, set unseen
├── scripts/evaluate_photos.py # uji folder foto dengan kode yang sama persis seperti API
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

# Download 4 dataset (token Kaggle di ~/.kaggle/), lihat dataset/README.md
kaggle datasets download -d mostafaabla/garbage-classification -p data/raw --unzip
kaggle datasets download -d sumn2u/garbage-classification-v2 -p data/raw/garbage_v2 --unzip
kaggle datasets download -d alistairking/recyclable-and-household-waste-classification -p data/raw/household --unzip
kaggle datasets download -d imbikramsaha/caltech-101 -p data/raw/caltech101 --unzip

# GPU: arahkan TensorFlow ke library CUDA dari paket pip nvidia-* (tanpa ini GPU tidak terdeteksi)
export LD_LIBRARY_PATH=$(python -c "import nvidia,os,glob; print(':'.join(glob.glob(os.path.join(nvidia.__path__[0],'*','lib'))))")

python scripts/prepare_dataset.py --per-class 2500
jupyter-execute --inplace notebooks/training.ipynb

# Uji foto dunia nyata dengan kode API (app/model.py)
python scripts/evaluate_photos.py ../backend/database/seeders/photos
```
Bisa juga dijalankan di Kaggle Notebook / Google Colab (GPU gratis): upload folder `data/processed`, lalu jalankan semua cell.

**Pendekatan**
- Input 224×224. Augmentasi (flip, rotasi, geser, zoom, brightness, kontras) dan preprocessing MobileNetV2 ada
  **di dalam model**, jadi API cukup mengirim RGB 0–255. Augmentasi dibuat mirip variasi foto HP (miring, objek tidak di tengah, terang/gelap).
- Tahap 1: base dibekukan, latih head (GAP → Dropout 0.3 → Dense softmax 4 kelas), LR 1e-3, 12 epoch.
- Tahap 2: fine-tune 60 layer terakhir (BatchNorm tetap beku), LR 1e-5, sampai 15 epoch.
- Callback: EarlyStopping, ReduceLROnPlateau, ModelCheckpoint. Dataset di-cache ke disk (`data/cache/`), bukan RAM.
- Notebook menyimpan `reports/metrics.json`, `classification_report.txt`, `confusion_matrix.png`, `training_curves.png`.

**Kelas `other` dan uji `unseen`**
- `other` diisi 5 kelompok seimbang: kaca, logam, baterai, tekstil (baju/sepatu), dan 84 jenis benda Caltech-101
  (porsi 2×). Benda "mirip" sengaja dimasukkan (botol kaca vs botol plastik, kain vs kantong) supaya model tidak mudah tertipu.
- 8 jenis benda Caltech **tidak pernah** dipakai training (`electric_guitar`, `cellphone`, `laptop`, `umbrella`,
  `headphone`, `wrench`, `windsor_chair`, `lamp`) dan disimpan di `data/processed/unseen/` untuk mengukur apakah
  model benar-benar paham "bukan sampah", bukan sekadar menghafal.

## Hasil
Training di RTX 3050 6 GB (TensorFlow 2.21): **±9,5 menit**, 27 epoch (12 head + 15 fine-tune).

| Metrik | Nilai |
|---|---|
| Accuracy test set, model Keras (1.474 gambar, 4 kelas) | **91,32%** |
| Accuracy test set, model TFLite lewat `app/model.py` (sama dengan API) | **90,23%** (1.330/1.474) |
| Macro F1 | 0,9138 |
| Benda `unseen` dijawab `other` (488 gambar) | **87,7%** |
| Foto gitar (`electric_guitar`, tidak pernah dilihat) dijawab `other` | **96%** Keras · **74/75** TFLite |
| Ukuran model | `.keras` 24 MB · `.tflite` 2,4 MB (dynamic range quantization) |

| Kelas | Precision | Recall | F1 |
|---|---|---|---|
| organic | 0,9527 | 0,9253 | 0,9388 |
| other | 0,8759 | 0,9202 | 0,8975 |
| paper | 0,9301 | 0,9227 | 0,9264 |
| plastic | 0,8997 | 0,8853 | 0,8925 |

Per jenis benda `unseen` → `other`: headphone 100%, windsor_chair 100%, electric_guitar 96%, wrench 90%, lamp 87%,
laptop 80%, umbrella 80%, cellphone 76%. Benda yang lolos kebanyakan terbaca `paper` (laptop/payung berwarna polos).

Test set versi 2 lebih sulit daripada versi 1 (97,04% pada 3 kelas dengan foto studio): ada kelas ke-4 dan
foto `real_world` dari dataset Household. Kesalahan terbanyak: **plastic → other** (29), biasanya kantong/wadah
plastik yang mirip kaca atau kain.

### Uji foto dunia nyata
24 foto Pexels yang dipakai seeder (tumpukan sampah di lokasi nyata, sumber berbeda dari dataset):
**18/24 = 75%**, sama dengan model versi 1, tetapi kini dengan kemampuan menolak benda non-sampah.
4 foto sampah asli ikut ditolak sebagai `other`: 2 foto kertas remuk kecil di samping tempat sampah **besi**,
tumpukan kardus di balik **pagar besi**, dan kulit wortel di mangkuk gelap. Objek non-sampah yang dominan di foto
mendorong jawaban ke `other`. Pada kasus ini user tetap bisa memilih kategori sendiri.
Tidak ada benda non-sampah yang lolos sebagai sampah pada uji ini. Langkah berikutnya untuk produksi: menambah foto
"di lapangan" ke training set.

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
# {"label":"plastic","confidence":0.94,"uncertain":false,"probabilities":{"organic":0.02,"other":0.01,"paper":0.03,"plastic":0.94}}
```
- `label: "other"` bila foto bukan organik/kertas/plastik. Backend meneruskannya ke app sebagai `label: null, recognized: false`.
- `uncertain: true` bila confidence < `CONFIDENCE_THRESHOLD` (default 0.6). Client lalu meminta user memilih kategori sendiri.
- Validasi: hanya JPG/PNG/WEBP, maks `MAX_FILE_MB` (default 10).
- Bila `API_KEY` di-set, request wajib membawa header `X-API-Key` (dipakai backend Laravel).

| Env | Default |
|---|---|
| `MODEL_PATH` | `models/waste_classifier.tflite` |
| `LABELS_PATH` | `models/labels.json` |
| `CONFIDENCE_THRESHOLD` | `0.6` |
| `MODEL_VERSION` | `2.0.0` |
| `MAX_FILE_MB` | `10` |
| `API_KEY` | kosong (tanpa auth) |

Image Docker memakai runtime **TFLite (`ai-edge-litert`)**, bukan TensorFlow penuh, jadi ringan di RAM VPS.

## Test
```bash
python -m pytest   # memakai stub model, tidak butuh file model maupun TensorFlow
```
