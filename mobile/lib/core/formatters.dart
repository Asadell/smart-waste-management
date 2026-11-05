import 'package:intl/intl.dart';

final _date = DateFormat('d MMM yyyy', 'id_ID');
final _dateTime = DateFormat('d MMM yyyy, HH:mm', 'id_ID');

String formatDate(DateTime d) => _date.format(d);
String formatDateTime(DateTime d) => _dateTime.format(d);
String formatPercent(double v) => '${(v * 100).toStringAsFixed(0)}%';
