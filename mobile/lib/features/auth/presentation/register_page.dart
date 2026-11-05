import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:swm_mobile/core/router/router.dart';

import '../providers/providers.dart';
import 'auth_scaffold.dart';

@RoutePage()
class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<AuthProvider>().clearErrors());
  }

  @override
  void dispose() {
    for (final c in [_name, _email, _phone, _password, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    final ok = await context.read<AuthProvider>().register(
          name: _name.text.trim(),
          email: _email.text.trim(),
          phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
          password: _password.text,
        );
    if (ok && mounted) context.router.replaceAll([const HomeRoute()]);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final errors = auth.fieldErrors;
    return AuthScaffold(
      title: 'Buat Akun',
      subtitle: 'Daftar untuk mulai melaporkan sampah',
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (auth.errorMessage != null && errors.isEmpty) ErrorBanner(auth.errorMessage!),
            TextFormField(
              controller: _name,
              textInputAction: TextInputAction.next,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(labelText: 'Nama lengkap', prefixIcon: const Icon(Icons.person_outline), errorText: errors['name']),
              validator: (v) => v == null || v.trim().isEmpty ? 'Nama wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: 'Email', prefixIcon: const Icon(Icons.email_outlined), errorText: errors['email']),
              validator: (v) => v == null || !v.contains('@') ? 'Masukkan email yang valid' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: 'No. HP (opsional)', prefixIcon: const Icon(Icons.phone_outlined), errorText: errors['phone']),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _password,
              obscureText: _obscure,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(
                labelText: 'Password',
                prefixIcon: const Icon(Icons.lock_outline),
                errorText: errors['password'],
                suffixIcon: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              validator: (v) => v == null || v.length < 8 ? 'Minimal 8 karakter' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _confirm,
              obscureText: _obscure,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _submit(),
              decoration: const InputDecoration(labelText: 'Ulangi password', prefixIcon: Icon(Icons.lock_outline)),
              validator: (v) => v != _password.text ? 'Password tidak sama' : null,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: auth.isLoading ? null : _submit,
              child: auth.isLoading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : const Text('Daftar'),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Sudah punya akun?'),
                TextButton(onPressed: () => context.router.replace(const LoginRoute()), child: const Text('Masuk')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
