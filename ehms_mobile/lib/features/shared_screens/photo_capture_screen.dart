import 'package:flutter/material.dart';
import 'package:ehms_mobile/core/api/camera_service.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';

/// Photo capture screen for inspections, damage reports, room status
class PhotoCaptureScreen extends StatefulWidget {
  final String? category; // 'inspection', 'damage', 'room_status', 'general'
  final String? roomId;
  final int maxPhotos;

  const PhotoCaptureScreen({
    super.key,
    this.category,
    this.roomId,
    this.maxPhotos = 10,
  });

  @override
  State<PhotoCaptureScreen> createState() => _PhotoCaptureScreenState();
}

class _PhotoCaptureScreenState extends State<PhotoCaptureScreen> {
  final CameraService _camera = CameraService();
  final List<CapturedPhoto> _photos = [];
  bool _isCapturing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),
            // Photo preview grid
            Expanded(child: _buildPreviewGrid()),
            // Capture controls
            _buildControls(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close, color: Colors.white, size: 24),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  _getTitle(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '${_photos.length}/${widget.maxPhotos} photos',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          if (_photos.isNotEmpty)
            TextButton(
              onPressed: _submitPhotos,
              child: Text(
                'Done (${_photos.length})',
                style: const TextStyle(
                  color: HmsColors.gold,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPreviewGrid() {
    if (_photos.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.camera_alt_outlined,
              size: 64,
              color: Colors.white.withValues(alpha: 0.2),
            ),
            const SizedBox(height: 16),
            Text(
              'Tap to capture',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.5),
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _getHint(),
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.3),
                fontSize: 13,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
        ),
        itemCount: _photos.length,
        itemBuilder: (context, index) {
          final photo = _photos[index];
          return Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: DecorationImage(
                    image: FileImage(photo.file),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              // Remove button
              Positioned(
                top: 4,
                right: 4,
                child: GestureDetector(
                  onTap: () => setState(() => _photos.removeAt(index)),
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close, color: Colors.white, size: 14),
                  ),
                ),
              ),
              // Category badge
              if (photo.caption != null)
                Positioned(
                  bottom: 4,
                  left: 4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: HmsColors.gold,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      photo.caption!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildControls() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Gallery button
          GestureDetector(
            onTap: _pickFromGallery,
            child: Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
              ),
              child: Icon(
                Icons.photo_library,
                color: Colors.white.withValues(alpha: 0.8),
                size: 26,
              ),
            ),
          ),
          // Capture button
          GestureDetector(
            onTap: _isCapturing ? null : _takePhoto,
            child: AnimatedContainer(
              duration: HmsDurations.fast,
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: _isCapturing ? [] : [
                  BoxShadow(
                    color: HmsColors.gold.withValues(alpha: 0.4),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Container(
                margin: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isCapturing ? Colors.white.withValues(alpha: 0.3) : Colors.white,
                ),
                child: _isCapturing
                    ? const Padding(
                        padding: EdgeInsets.all(20),
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : null,
              ),
            ),
          ),
          // Multi-capture toggle
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.burst_mode, color: Colors.white.withValues(alpha: 0.8), size: 22),
                Text(
                  'Burst',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 8,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _takePhoto() async {
    if (_photos.length >= widget.maxPhotos) return;

    setState(() => _isCapturing = true);

    final photo = await _camera.takePhoto(category: widget.category);

    if (photo != null && mounted) {
      setState(() {
        _photos.add(photo);
        _isCapturing = false;
      });
    } else if (mounted) {
      setState(() => _isCapturing = false);
    }
  }

  Future<void> _pickFromGallery() async {
    if (_photos.length >= widget.maxPhotos) return;

    final photos = await _camera.pickMultiple(
      category: widget.category,
      maxImages: widget.maxPhotos - _photos.length,
    );

    if (photos.isNotEmpty && mounted) {
      setState(() => _photos.addAll(photos));
    }
  }

  void _submitPhotos() {
    Navigator.pop(context, _photos);
  }

  String _getTitle() {
    switch (widget.category) {
      case 'inspection':
        return 'Room Inspection';
      case 'damage':
        return 'Damage Report';
      case 'room_status':
        return 'Room Status Photos';
      default:
        return 'Capture Photos';
    }
  }

  String _getHint() {
    switch (widget.category) {
      case 'inspection':
        return 'Take photos of each area:\nBed, Bathroom, Amenities, Overall';
      case 'damage':
        return 'Capture clear photos of any damage\nwith close-up and wide shots';
      case 'room_status':
        return 'Document current room status\nbefore and after cleaning';
      default:
        return 'Use the camera button below to start';
    }
  }
}
