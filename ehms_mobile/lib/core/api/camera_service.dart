import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

/// Photo capture result
class CapturedPhoto {
  final File file;
  final String? caption;
  final String? category;
  final DateTime capturedAt;

  CapturedPhoto({
    required this.file,
    this.caption,
    this.category,
    required this.capturedAt,
  });
}

/// Camera service for room photos, damage reports, inspections
class CameraService {
  final ImagePicker _picker = ImagePicker();

  /// Request camera permission
  Future<bool> requestCameraPermission() async {
    final status = await Permission.camera.status;
    if (status.isGranted) return true;

    final result = await Permission.camera.request();
    return result.isGranted;
  }

  /// Request gallery permission
  Future<bool> requestGalleryPermission() async {
    final status = await Permission.photos.status;
    if (status.isGranted) return true;

    final result = await Permission.photos.request();
    return result.isGranted;
  }

  /// Take a photo with camera
  Future<CapturedPhoto?> takePhoto({String? category}) async {
    final hasPermission = await requestCameraPermission();
    if (!hasPermission) return null;

    final xFile = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
      preferredCameraDevice: CameraDevice.rear,
    );

    if (xFile == null) return null;

    return CapturedPhoto(
      file: File(xFile.path),
      category: category,
      capturedAt: DateTime.now(),
    );
  }

  /// Pick image from gallery
  Future<CapturedPhoto?> pickFromGallery({String? category}) async {
    final hasPermission = await requestGalleryPermission();
    if (!hasPermission) return null;

    final xFile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );

    if (xFile == null) return null;

    return CapturedPhoto(
      file: File(xFile.path),
      category: category,
      capturedAt: DateTime.now(),
    );
  }

  /// Pick multiple images from gallery
  Future<List<CapturedPhoto>> pickMultiple({String? category, int maxImages = 5}) async {
    final hasPermission = await requestGalleryPermission();
    if (!hasPermission) return [];

    final xFiles = await _picker.pickMultiImage(
      maxWidth: 2048,
      maxHeight: 2048,
      imageQuality: 85,
    );

    return xFiles.take(maxImages).map((xFile) => CapturedPhoto(
      file: File(xFile.path),
      category: category,
      capturedAt: DateTime.now(),
    )).toList();
  }

  /// Show source selection dialog and capture
  Future<CapturedPhoto?> captureWithSource({String? category}) async {
    // This would typically be called from a UI context
    // Returns null if user cancels
    return takePhoto(category: category);
  }
}
