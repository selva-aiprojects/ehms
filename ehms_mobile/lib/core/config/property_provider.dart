import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Property selection state — tracks the active property across the app
class PropertySelection {
  final String? activePropertyId;
  final String? activePropertyName;
  final List<String> assignedPropertyIds;

  PropertySelection({
    this.activePropertyId,
    this.activePropertyName,
    this.assignedPropertyIds = const [],
  });

  bool get hasMultipleProperties => assignedPropertyIds.length > 1;
  bool get hasProperties => assignedPropertyIds.isNotEmpty;

  PropertySelection copyWith({
    String? activePropertyId,
    String? activePropertyName,
    List<String>? assignedPropertyIds,
  }) {
    return PropertySelection(
      activePropertyId: activePropertyId ?? this.activePropertyId,
      activePropertyName: activePropertyName ?? this.activePropertyName,
      assignedPropertyIds: assignedPropertyIds ?? this.assignedPropertyIds,
    );
  }
}

/// Manages which property is currently active
class PropertySelectionNotifier extends StateNotifier<PropertySelection> {
  final _storage = const FlutterSecureStorage();

  PropertySelectionNotifier() : super(PropertySelection()) {
    _load();
  }

  Future<void> _load() async {
    final saved = await _storage.read(key: 'ehms_active_property_id');
    if (saved != null) {
      state = state.copyWith(activePropertyId: saved);
    }
  }

  Future<void> selectProperty(String? propertyId, {String? name}) async {
    state = state.copyWith(
      activePropertyId: propertyId,
      activePropertyName: name,
    );
    if (propertyId != null) {
      await _storage.write(key: 'ehms_active_property_id', value: propertyId);
    } else {
      await _storage.delete(key: 'ehms_active_property_id');
    }
  }

  void setAssignedProperties(List<String> ids) {
    // If current selection is not in the list, pick the first one
    if (ids.isNotEmpty && !ids.contains(state.activePropertyId)) {
      selectProperty(ids.first);
    }
    state = state.copyWith(assignedPropertyIds: ids);
  }
}

final propertySelectionProvider = StateNotifierProvider<PropertySelectionNotifier, PropertySelection>((ref) {
  return PropertySelectionNotifier();
});
