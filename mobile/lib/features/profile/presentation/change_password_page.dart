import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/features/auth/auth.dart';

@RoutePage()
class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<AuthProvider>().clearErrors());
  }

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.changePassword(_current.text, _next.text);
    if (!mounted) return;
    if (ok) {
      showSnack(context, 'Password berhasil diganti');
      context.router.maybePop();
    } else if (auth.fieldErrors.isEmpty) {
      showSnack(context, auth.errorMessage ?? 'Gagal mengganti password', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Ganti Password')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _current,
              obscureText: true,
              decoration: InputDecoration(labelText: 'Password lama', errorText: auth.fieldErrors['current_password']),
              validator: (v) => v == null || v.isEmpty ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _next,
              obscureText: true,
              decoration: InputDecoration(labelText: 'Password baru', errorText: auth.fieldErrors['password']),
              validator: (v) => v == null || v.length < 8 ? 'Minimal 8 karakter' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirm,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Ulangi password baru'),
              validator: (v) => v != _next.text ? 'Password tidak sama' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: auth.isLoading ? null : _save,
              child: auth.isLoading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : const Text('Simpan'),
            ),
          ],
        ),
      ),
    );
  }
}
