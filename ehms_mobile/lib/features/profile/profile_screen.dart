import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:ehms_mobile/core/auth/auth_service.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';

/// User Profile Screen — view and edit profile
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameCtrl;
  late TextEditingController _lastNameCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  bool _isEditing = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    _firstNameCtrl = TextEditingController(text: user?.firstName ?? '');
    _lastNameCtrl = TextEditingController(text: user?.lastName ?? '');
    _emailCtrl = TextEditingController(text: user?.email ?? '');
    _phoneCtrl = TextEditingController(text: user?.phone ?? '');
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user != null) {
        final updated = user.copyWith(
          firstName: _firstNameCtrl.text.trim(),
          lastName: _lastNameCtrl.text.trim(),
          phone: _phoneCtrl.text.trim(),
        );
        ref.read(authProvider.notifier).updateUser(updated);
      }
      setState(() {
        _isEditing = false;
        _isSaving = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('Profile updated'), backgroundColor: HmsColors.success),
        );
      }
    } catch (e) {
      setState(() => _isSaving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Update failed: $e'), backgroundColor: HmsColors.danger),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Back + title
              Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Theme.of(context).cardTheme.color,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: HmsColors.border(context)),
                      ),
                      child: Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: HmsColors.textSecondary(context)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text('My Profile', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                  const Spacer(),
                  if (_isEditing)
                    TextButton(
                      onPressed: () => setState(() {
                        _isEditing = false;
                        final user = ref.read(currentUserProvider);
                        _firstNameCtrl.text = user?.firstName ?? '';
                        _lastNameCtrl.text = user?.lastName ?? '';
                        _emailCtrl.text = user?.email ?? '';
                        _phoneCtrl.text = user?.phone ?? '';
                      }),
                      child: const Text('Cancel'),
                    )
                  else
                    IconButton(
                      onPressed: () => setState(() => _isEditing = true),
                      icon: Icon(Icons.edit_rounded, color: HmsColors.gold),
                    ),
                ],
              ),
              const SizedBox(height: 28),

              // Avatar
              Center(
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        gradient: HmsColors.primaryGradient,
                        shape: BoxShape.circle,
                        boxShadow: HmsShadows.gold,
                      ),
                      child: Center(
                        child: Text(
                          user?.initials ?? 'U',
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    if (_isEditing)
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: HmsColors.gold,
                          shape: BoxShape.circle,
                          border: Border.all(color: Theme.of(context).scaffoldBackgroundColor, width: 3),
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Center(
                child: Text(
                  user?.fullName ?? 'User',
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: HmsColors.gold.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(HmsRadius.full),
                  ),
                  child: Text(
                    (user?.roleName ?? 'user').replaceAll('_', ' '),
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: HmsColors.gold),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Form fields
              _buildField('First Name', _firstNameCtrl, _isEditing),
              const SizedBox(height: 16),
              _buildField('Last Name', _lastNameCtrl, _isEditing),
              const SizedBox(height: 16),
              _buildField('Email', _emailCtrl, false),
              const SizedBox(height: 16),
              _buildField('Phone', _phoneCtrl, _isEditing),
              const SizedBox(height: 16),

              // Role badge
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: HmsColors.surfaceMutedFor(context),
                  borderRadius: BorderRadius.circular(HmsRadius.lg),
                  border: Border.all(color: HmsColors.border(context), width: 0.5),
                ),
                child: Row(
                  children: [
                    Icon(Icons.shield_rounded, size: 20, color: HmsColors.navy),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Role', style: TextStyle(fontSize: 11, color: HmsColors.textTertiary(context), fontWeight: FontWeight.w500)),
                          Text(
                            (user?.roleName ?? 'unknown').replaceAll('_', ' '),
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: HmsColors.textSecondary(context)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Assigned properties
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: HmsColors.surfaceMutedFor(context),
                  borderRadius: BorderRadius.circular(HmsRadius.lg),
                  border: Border.all(color: HmsColors.border(context), width: 0.5),
                ),
                child: Row(
                  children: [
                    Icon(Icons.business_rounded, size: 20, color: HmsColors.gold),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Assigned Properties', style: TextStyle(fontSize: 11, color: HmsColors.textTertiary(context), fontWeight: FontWeight.w500)),
                          const SizedBox(height: 2),
                          Text(
                            '${user?.assignedPropertyIds.length ?? 0} properties',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: HmsColors.textSecondary(context)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Save button
              if (_isEditing)
                SizedBox(
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _saveProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: HmsColors.gold,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(HmsRadius.lg)),
                    ),
                    child: _isSaving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl, bool enabled) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: HmsColors.textSecondary(context))),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          enabled: enabled,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w500,
            color: enabled ? Theme.of(context).textTheme.bodyLarge?.color : HmsColors.textMuted,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: enabled ? null : HmsColors.surfaceMutedFor(context),
            border: enabled
                ? const OutlineInputBorder()
                : InputBorder.none,
          ),
          validator: label == 'First Name'
              ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
              : null,
        ),
      ],
    );
  }
}
