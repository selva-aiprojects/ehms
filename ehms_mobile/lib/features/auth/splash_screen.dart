import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:ehms_mobile/core/auth/auth_service.dart';
import 'package:ehms_mobile/shared/theme/hms_colors.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<double> _glowAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0, 0.4, curve: Curves.easeOut)),
    );
    _glowAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: const Interval(0.3, 0.8, curve: Curves.easeInOut)),
    );

    _controller.forward();

    Future.delayed(const Duration(milliseconds: 2500), () {
      if (mounted) {
        ref.read(authProvider.notifier).checkAuth();
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              HmsColors.navyDark,
              HmsColors.navy,
              Color(0xFF2D6340),
            ],
          ),
        ),
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Stack(
              alignment: Alignment.center,
              children: [
                // Ambient glow
                Positioned(
                  top: MediaQuery.of(context).size.height * 0.15,
                  child: Container(
                    width: 350,
                    height: 350,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          HmsColors.gold.withValues(alpha: 0.15 * _glowAnim.value),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                // Main content
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Logo
                    Opacity(
                      opacity: _fadeAnim.value,
                      child: Image.asset(
                        'assets/images/hostsphere-logo.png',
                        width: 160,
                        height: 160,
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => Container(
                          width: 100,
                          height: 100,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(
                              color: HmsColors.gold.withValues(alpha: 0.3),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: HmsColors.gold.withValues(alpha: 0.2 * _glowAnim.value),
                                blurRadius: 40,
                                spreadRadius: 10,
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.apartment_rounded,
                            size: 50,
                            color: HmsColors.gold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Brand name
                    Opacity(
                      opacity: _fadeAnim.value,
                      child: const Text(
                        'HostSphere',
                        style: TextStyle(
                          fontSize: 34,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                          height: 1.1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Tagline
                    Opacity(
                      opacity: _fadeAnim.value * 0.7,
                      child: Text(
                        'Luxury Hospitality Management',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: HmsColors.gold.withValues(alpha: 0.8),
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ],
                ),

                // Loading indicator
                Positioned(
                  bottom: MediaQuery.of(context).padding.bottom + 60,
                  child: Opacity(
                    opacity: _glowAnim.value,
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: HmsColors.gold.withValues(alpha: 0.6),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
