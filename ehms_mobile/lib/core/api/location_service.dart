import 'dart:async';
import 'package:geolocator/geolocator.dart';

/// Location data model
class HmsLocation {
  final double latitude;
  final double longitude;
  final double? accuracy;
  final DateTime timestamp;

  HmsLocation({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() => {
    'latitude': latitude,
    'longitude': longitude,
    if (accuracy != null) 'accuracy': accuracy,
    'timestamp': timestamp.toIso8601String(),
  };
}

/// GPS location service for staff tracking and property geofencing
class LocationService {
  static LocationService? _instance;
  StreamSubscription<Position>? _positionSubscription;
  final StreamController<HmsLocation> _locationController = StreamController<HmsLocation>.broadcast();

  LocationService._();

  factory LocationService() => _instance ??= LocationService._();

  Stream<HmsLocation> get locationStream => _locationController.stream;

  /// Check if location services are enabled
  Future<bool> isLocationEnabled() async {
    return await Geolocator.isLocationServiceEnabled();
  }

  /// Check and request location permission
  Future<bool> requestPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();

    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Get current position
  Future<HmsLocation?> getCurrentLocation() async {
    try {
      final hasPermission = await requestPermission();
      if (!hasPermission) return null;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      final location = HmsLocation(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: position.timestamp,
      );

      _locationController.add(location);
      return location;
    } catch (e) {
      return null;
    }
  }

  /// Start continuous location tracking
  Future<void> startTracking({
    int intervalSeconds = 30,
    double distanceFilter = 10,
  }) async {
    final hasPermission = await requestPermission();
    if (!hasPermission) return;

    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
      timeLimit: Duration(seconds: 30),
    );

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: locationSettings,
    ).listen((position) {
      final location = HmsLocation(
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        timestamp: position.timestamp,
      );
      _locationController.add(location);
    });
  }

  /// Stop location tracking
  void stopTracking() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
  }

  /// Calculate distance between two points (in meters)
  double calculateDistance(
    double lat1, double lon1,
    double lat2, double lon2,
  ) {
    return Geolocator.distanceBetween(lat1, lon1, lat2, lon2);
  }

  /// Check if a point is within a geofence
  bool isWithinGeofence({
    required double pointLat,
    required double pointLon,
    required double centerLat,
    required double centerLon,
    required double radiusMeters,
  }) {
    final distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
    return distance <= radiusMeters;
  }

  /// Dispose
  void dispose() {
    stopTracking();
    _locationController.close();
  }
}
