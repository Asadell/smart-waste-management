import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/core.dart';
import 'package:swm_mobile/features/auth/auth.dart';

@RoutePage()
class EditProfilePage extends StatefulWidget {
  const EditProfilePage({super.key});

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _name = TextEditingController(text: user?.name);
    _email = TextEditingController(text: user?.email);
    _phone = TextEditingController(text: user?.phone);
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<AuthProvider>().clearErrors());
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.updateProfile(
      name: _name.text.trim(),
      email: _email.text.trim(),
      phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
    );
    if (!mounted) return;
    if (ok) {
      showSnack(context, 'Profil diperbarui');
      context.router.maybePop();
    } else if (auth.fieldErrors.isEmpty) {
      showSnack(context, auth.errorMessage ?? 'Gagal menyimpan', error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profil')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              decoration: InputDecoration(labelText: 'Nama', errorText: auth.fieldErrors['name']),
              validator: (v) => v == null || v.trim().isEmpty ? 'Nama wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: 'Email', errorText: auth.fieldErrors['email']),
              validator: (v) => v == null || !v.contains('@') ? 'Email tidak valid' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(labelText: 'No. HP', errorText: auth.fieldErrors['phone']),
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
