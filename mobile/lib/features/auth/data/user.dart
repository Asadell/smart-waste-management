class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatarUrl,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? avatarUrl;

  bool get isAdmin => role == 'admin';

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
  }

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as int,
        name: json['name'] as String,
        email: json['email'] as String,
        role: json['role'] as String,
        phone: json['phone'] as String?,
        avatarUrl: json['avatar_url'] as String?,
      );
}
