import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

/// OpenStreetMap preview with a single marker. Tapping the map moves the
/// marker when [onTap] is provided.
class LocationMap extends StatelessWidget {
  const LocationMap({super.key, required this.point, this.onTap, this.height = 200, this.mapController});

  final LatLng point;
  final ValueChanged<LatLng>? onTap;
  final double height;
  final MapController? mapController;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: height,
        child: FlutterMap(
          mapController: mapController,
          options: MapOptions(
            initialCenter: point,
            initialZoom: 16,
            onTap: onTap == null ? null : (_, latLng) => onTap!(latLng),
            interactionOptions: InteractionOptions(
              flags: onTap == null ? InteractiveFlag.none : InteractiveFlag.all & ~InteractiveFlag.rotate,
            ),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'id.swm.swm_mobile',
            ),
            MarkerLayer(
              markers: [
                Marker(
                  point: point,
                  width: 44,
                  height: 44,
                  alignment: Alignment.topCenter,
                  child: Icon(Icons.location_pin, size: 44, color: Theme.of(context).colorScheme.error),
                ),
              ],
            ),
            const SimpleAttributionWidget(source: Text('OpenStreetMap contributors')),
          ],
        ),
      ),
    );
  }
}
