import 'report.dart';

class Prediction {
  const Prediction({required this.label, required this.confidence, required this.uncertain, this.probabilities = const {}});

  final WasteCategory? label;
  final double confidence;
  final bool uncertain;
  final Map<String, double> probabilities;

  factory Prediction.fromJson(Map<String, dynamic> json) => Prediction(
        label: WasteCategory.tryParse(json['label'] as String?),
        confidence: (json['confidence'] as num).toDouble(),
        uncertain: json['uncertain'] as bool? ?? false,
        probabilities: (json['probabilities'] as Map<String, dynamic>? ?? {})
            .map((k, v) => MapEntry(k, (v as num).toDouble())),
      );
}
