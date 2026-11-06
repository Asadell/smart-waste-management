import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/core/router/router.dart';
import 'package:swm_mobile/features/dashboard/dashboard.dart';

import '../data/data.dart';
import '../providers/providers.dart';
import 'widgets/widgets.dart';

@RoutePage()
class CreateReportPage extends StatefulWidget {
  const CreateReportPage({super.key});

  @override
  State<CreateReportPage> createState() => _CreateReportPageState();
}

class _CreateReportPageState extends State<CreateReportPage> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _picker = ImagePicker();
  final _location = LocationService();

  File? _photo;
  WasteCategory? _category;
  bool _categoryTouched = false;

  LatLng? _point;
  String? _address;
  bool _locating = false;
  LocationException? _locationError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PredictProvider>().reset();
      _locate();
    });
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  // ---- photo + AI ----

  Future<void> _pickPhoto(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, maxWidth: 1600, maxHeight: 1600, imageQuality: 80);
    if (picked == null || !mounted) return;

    setState(() {
      _photo = File(picked.path);
      _categoryTouched = false;
    });

    final prediction = await context.read<PredictProvider>().predict(picked.path);
    if (!mounted || prediction == null) return;
    // Prefill with the AI guess unless it is uncertain or the user already chose.
    if (!prediction.uncertain && !_categoryTouched && prediction.label != null) {
      setState(() => _category = prediction.label);
    }
  }

  void _choosePhotoSource() {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Ambil foto'),
              onTap: () {
                Navigator.pop(ctx);
                _pickPhoto(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Pilih dari galeri'),
              onTap: () {
                Navigator.pop(ctx);
                _pickPhoto(ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  // ---- GPS ----

  Future<void> _locate() async {
    setState(() {
      _locating = true;
      _locationError = null;
    });
    try {
      final pos = await _location.currentPosition();
      await _setPoint(LatLng(pos.latitude, pos.longitude));
    } on LocationException catch (e) {
      if (mounted) setState(() => _locationError = e);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _setPoint(LatLng point) async {
    setState(() {
      _point = point;
      _address = null;
    });
    final address = await _location.addressFor(point.latitude, point.longitude);
    if (mounted && _point == point) setState(() => _address = address);
  }

  // ---- submit ----

  Future<void> _submit() async {
    final formValid = _formKey.currentState!.validate();
    if (_photo == null) return showSnack(context, 'Tambahkan foto sampah terlebih dahulu', error: true);
    if (_point == null) return showSnack(context, 'Lokasi belum tersedia', error: true);
    if (_category == null) return showSnack(context, 'Pilih kategori sampah', error: true);
    if (!formValid) return;

    final predict = context.read<PredictProvider>();
    final reports = context.read<ReportProvider>();
    final dashboard = context.read<DashboardProvider>();

    try {
      final report = await reports.create(
        NewReport(
          photoPath: _photo!.path,
          title: _title.text.trim(),
          description: _description.text.trim().isEmpty ? null : _description.text.trim(),
          latitude: _point!.latitude,
          longitude: _point!.longitude,
          address: _address,
          category: _category!,
          prediction: predict.prediction,
        ),
      );
      if (!mounted) return;
      dashboard.load();
      showSnack(context, 'Laporan berhasil dikirim');
      context.router.replace(ReportDetailRoute(id: report.id));
    } on ApiException catch (e) {
      // Form data stays in place so the user can simply retry.
      if (mounted) showSnack(context, e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final submitting = context.select<ReportProvider, bool>((p) => p.isSubmitting);
    return Scaffold(
      appBar: AppBar(title: const Text('Buat Laporan')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          children: [
            _Section(title: 'Foto sampah', child: _PhotoPicker(photo: _photo, onTap: _choosePhotoSource)),
            if (_photo != null) ...[
              const SizedBox(height: 12),
              const _AiPanel(),
            ],
            _Section(
              title: 'Kategori',
              child: Wrap(
                spacing: 8,
                children: [
                  for (final c in WasteCategory.values)
                    ChoiceChip(
                      avatar: Icon(c.icon, size: 18, color: _category == c ? null : c.color),
                      label: Text(c.label),
                      selected: _category == c,
                      onSelected: (_) => setState(() {
                        _category = c;
                        _categoryTouched = true;
                      }),
                    ),
                ],
              ),
            ),
            _Section(
              title: 'Lokasi',
              trailing: TextButton.icon(
                onPressed: _locating ? null : _locate,
                icon: const Icon(Icons.my_location, size: 18),
                label: const Text('Lokasi saya'),
              ),
              child: _buildLocation(),
            ),
            _Section(
              title: 'Detail laporan',
              child: Column(
                children: [
                  TextFormField(
                    controller: _title,
                    maxLength: 150,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(labelText: 'Judul', hintText: 'cth. Sampah plastik menumpuk di trotoar'),
                    validator: (v) => v == null || v.trim().length < 5 ? 'Judul minimal 5 karakter' : null,
                  ),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _description,
                    maxLines: 4,
                    maxLength: 2000,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(labelText: 'Deskripsi (opsional)', alignLabelWithHint: true),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: submitting ? null : _submit,
              icon: submitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : const Icon(Icons.send),
              label: Text(submitting ? 'Mengirim...' : 'Kirim laporan'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocation() {
    if (_locating && _point == null) {
      return const SizedBox(height: 120, child: Center(child: CircularProgressIndicator()));
    }
    if (_point == null) {
      final error = _locationError;
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Icon(Icons.location_off_outlined, size: 36),
              const SizedBox(height: 8),
              Text(error?.message ?? 'Lokasi belum diambil', textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  OutlinedButton(onPressed: _locate, child: const Text('Coba lagi')),
                  if (error?.canOpenSettings ?? false)
                    OutlinedButton(onPressed: _location.openSettings, child: const Text('Buka pengaturan')),
                  if (error?.isServiceDisabled ?? false)
                    OutlinedButton(onPressed: () => _location.openSettings(location: true), child: const Text('Aktifkan GPS')),
                ],
              ),
            ],
          ),
        ),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LocationMap(key: ValueKey(_point), point: _point!, onTap: _setPoint),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.place_outlined, size: 18),
            const SizedBox(width: 6),
            Expanded(
              child: Text(_address ?? '${_point!.latitude.toStringAsFixed(5)}, ${_point!.longitude.toStringAsFixed(5)}'),
            ),
          ],
        ),
        Text('Ketuk peta untuk memindahkan titik lokasi.', style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.trailing});

  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(title, style: Theme.of(context).textTheme.titleMedium),
              const Spacer(),
              ?trailing,
            ],
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _PhotoPicker extends StatelessWidget {
  const _PhotoPicker({required this.photo, required this.onTap});

  final File? photo;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        height: 220,
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withValues(alpha: 0.5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: scheme.outlineVariant),
        ),
        child: photo == null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_a_photo_outlined, size: 48, color: scheme.primary),
                  const SizedBox(height: 8),
                  const Text('Ambil atau pilih foto'),
                  Text('AI akan mendeteksi jenis sampah otomatis', style: Theme.of(context).textTheme.bodySmall),
                ],
              )
            : Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.file(photo!, fit: BoxFit.cover)),
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: FilledButton.tonalIcon(
                      onPressed: onTap,
                      style: FilledButton.styleFrom(minimumSize: const Size(0, 36)),
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Ganti'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Shows the AI detection state for the selected photo.
class _AiPanel extends StatelessWidget {
  const _AiPanel();

  @override
  Widget build(BuildContext context) {
    final predict = context.watch<PredictProvider>();
    final theme = Theme.of(context);

    final (IconData icon, Color color, Widget content) = switch (predict.state) {
      PredictState.loading => (
          Icons.auto_awesome,
          theme.colorScheme.primary,
          const Row(children: [
            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 10),
            Text('AI sedang menganalisis foto...'),
          ]),
        ),
      PredictState.result when predict.prediction!.label == null => (
          Icons.image_not_supported_outlined,
          Colors.orange.shade800,
          const Text(
            'AI tidak mengenali foto ini sebagai sampah organik, kertas, atau plastik. '
            'Pastikan sampahnya terlihat jelas, atau pilih kategori sendiri.',
          ),
        ),
      PredictState.result when predict.prediction!.uncertain => (
          Icons.help_outline,
          Colors.orange.shade800,
          Text(
            'AI tidak yakin (${formatPercent(predict.prediction!.confidence)}). '
            'Mungkin foto kurang jelas atau bukan sampah. Silakan pilih kategori sendiri.',
          ),
        ),
      PredictState.result => (
          Icons.auto_awesome,
          predict.prediction!.label?.color ?? theme.colorScheme.primary,
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Terdeteksi: ${predict.prediction!.label?.label ?? '-'}',
                style: theme.textTheme.titleSmall?.copyWith(color: predict.prediction!.label?.color),
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: predict.prediction!.confidence,
                  minHeight: 6,
                  color: predict.prediction!.label?.color,
                ),
              ),
              const SizedBox(height: 4),
              Text('Keyakinan ${formatPercent(predict.prediction!.confidence)} · kategori bisa diubah di bawah',
                  style: theme.textTheme.bodySmall),
            ],
          ),
        ),
      PredictState.error => (Icons.cloud_off_outlined, theme.colorScheme.error, Text(predict.errorMessage ?? 'Deteksi gagal')),
      PredictState.idle => (Icons.auto_awesome, theme.colorScheme.outline, const Text('Pilih foto untuk deteksi AI')),
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(child: content),
        ],
      ),
    );
  }
}
