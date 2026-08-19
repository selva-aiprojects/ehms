import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:ehms_mobile/core/auth/auth_service.dart';
import 'package:ehms_mobile/core/auth/auth_models.dart';
import 'package:ehms_mobile/core/config/settings_provider.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';
import 'package:ehms_mobile/shared/theme/hms_constants.dart';

/// Settings — Profile, Preferences, About
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.read(currentUserProvider);
    final settings = ref.watch(settingsProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Profile card
            GestureDetector(
              onTap: () => context.push('/profile'),
              child: _buildProfileCard(context, user),
            ),
            const SizedBox(height: 24),

            // Settings sections
            _buildSection(context, 'Account', [
              _settingItem(Icons.person_outline, 'Edit Profile', () => context.push('/profile')),
              _settingItem(Icons.lock_outline, 'Change Password', () => _showChangePasswordDialog(context)),
              _settingItem(Icons.fingerprint, 'Biometric Login', () {}, trailing: Switch(
                value: settings.biometricEnabled,
                onChanged: (_) => ref.read(settingsProvider.notifier).toggleBiometric(),
                activeThumbColor: HmsColors.gold,
              )),
            ]),
            const SizedBox(height: 16),

            _buildSection(context, 'Preferences', [
              _settingItem(Icons.dark_mode_outlined, 'Dark Mode', () {}, trailing: Switch(
                value: settings.isDarkMode,
                onChanged: (_) => ref.read(settingsProvider.notifier).toggleTheme(),
                activeThumbColor: HmsColors.gold,
              )),
              _settingItem(Icons.notifications_outlined, 'Push Notifications', () {}, trailing: Switch(
                value: settings.notificationsEnabled,
                onChanged: (_) => ref.read(settingsProvider.notifier).toggleNotifications(),
                activeThumbColor: HmsColors.gold,
              )),
              _settingItem(Icons.language, 'Language', () => _showLanguagePicker(context)),
              _settingItem(Icons.access_time, 'Timezone', () => _showTimezonePicker(context)),
            ]),
            const SizedBox(height: 16),

            _buildSection(context, 'About', [
              _settingItem(Icons.info_outline, 'App Version', () {}, trailing: Text(
                '1.0.0',
                style: TextStyle(fontSize: 12, color: HmsColors.textFaint),
              )),
              _settingItem(Icons.description, 'Terms of Service', () => _launchUrl('https://ehms.cybelinx.com/terms')),
              _settingItem(Icons.privacy_tip_outlined, 'Privacy Policy', () => _launchUrl('https://ehms.cybelinx.com/privacy')),
            ]),
            const SizedBox(height: 24),

            // Logout
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () async {
                  await ref.read(authProvider.notifier).logout();
                },
                icon: const Icon(Icons.logout, color: HmsColors.danger),
                label: const Text(
                  'Sign Out',
                  style: TextStyle(color: HmsColors.danger, fontWeight: FontWeight.w600),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: HmsColors.danger),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(HmsRadius.md),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _showChangePasswordDialog(BuildContext context) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        decoration: BoxDecoration(
          color: Theme.of(ctx).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: HmsColors.borderLight, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Change Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            TextField(controller: currentCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Current Password')),
            const SizedBox(height: 12),
            TextField(controller: newCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'New Password')),
            const SizedBox(height: 12),
            TextField(controller: confirmCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm Password')),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: const Text('Password updated'), backgroundColor: HmsColors.success),
                  );
                },
                style: ElevatedButton.styleFrom(backgroundColor: HmsColors.gold, foregroundColor: Colors.white),
                child: const Text('Update Password', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLanguagePicker(BuildContext context) {
    final languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(ctx).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: HmsColors.borderLight, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Select Language', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            ...languages.map((lang) => ListTile(
              title: Text(lang, style: const TextStyle(fontWeight: FontWeight.w500)),
              trailing: lang == 'English' ? Icon(Icons.check, color: HmsColors.gold) : null,
              onTap: () => Navigator.pop(ctx),
            )),
          ],
        ),
      ),
    );
  }

  void _showTimezonePicker(BuildContext context) {
    final timezones = ['Asia/Kolkata (IST)', 'Asia/Dubai (GST)', 'Asia/Singapore (SGT)', 'Europe/London (GMT)', 'America/New_York (EST)'];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Theme.of(ctx).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: HmsColors.borderLight, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Select Timezone', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            ...timezones.map((tz) => ListTile(
              title: Text(tz, style: const TextStyle(fontWeight: FontWeight.w500)),
              trailing: tz.contains('Kolkata') ? Icon(Icons.check, color: HmsColors.gold) : null,
              onTap: () => Navigator.pop(ctx),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileCard(BuildContext context, UserData? user) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: HmsColors.navyGradient,
        borderRadius: BorderRadius.circular(HmsRadius.xxl),
        boxShadow: [
          BoxShadow(
            color: HmsColors.navy.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                user?.initials ?? 'U',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.fullName ?? 'User',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.email ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withValues(alpha: 0.7),
                  ),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(HmsRadius.full),
                  ),
                  child: Text(
                    _roleLabel(user?.roleName),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Colors.white.withValues(alpha: 0.9),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: Colors.white.withValues(alpha: 0.5),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: HmsColors.textFaint,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: HmsColors.surface(context),
            borderRadius: BorderRadius.circular(HmsRadius.lg),
            border: Border.all(color: HmsColors.border(context), width: 0.5),
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final isLast = entry.key == items.length - 1;
              return Column(
                children: [
                  entry.value,
                  if (!isLast)
                    Divider(height: 1, indent: 52, color: HmsColors.border(context).withValues(alpha: 0.5)),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _settingItem(
    IconData icon,
    String label,
    VoidCallback onTap, {
    Widget? trailing,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: HmsColors.textMuted),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: HmsColors.textDark,
                ),
              ),
            ),
            if (trailing != null)
              trailing
            else
              Icon(Icons.chevron_right, size: 18, color: HmsColors.textFaint),
          ],
        ),
      ),
    );
  }

  String _roleLabel(String? role) {
    const labels = {
      'super_admin': 'Super Admin',
      'executive': 'Executive',
      'property_manager': 'Property Manager',
      'front_desk': 'Front Desk',
      'housekeeping_supervisor': 'HK Supervisor',
      'housekeeping_staff': 'HK Staff',
      'maintenance_staff': 'Maintenance',
      'maintenance_supervisor': 'Maintenance Supervisor',
      'hr_manager': 'HR Manager',
      'finance_manager': 'Finance Manager',
    };
    return labels[role] ?? role ?? 'User';
  }
}
