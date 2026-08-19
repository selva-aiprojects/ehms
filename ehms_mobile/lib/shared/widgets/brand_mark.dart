import 'package:flutter/material.dart';

class BrandMark extends StatelessWidget {
  final double size;
  final bool showWordmark;
  final bool light;

  const BrandMark({
    super.key,
    this.size = 72,
    this.showWordmark = false,
    this.light = false,
  });

  @override
  Widget build(BuildContext context) {
    final mark = Image.asset(
      'assets/images/favicon.png',
      width: size,
      height: size,
      fit: BoxFit.contain,
    );

    if (!showWordmark) return mark;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'HostSphere',
              style: TextStyle(
                color: light ? Colors.white : const Color(0xFF17241B),
                fontSize: size * 0.34,
                fontWeight: FontWeight.w800,
                height: 1,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              'HOSPITALITY OPERATIONS',
              style: TextStyle(
                color: light ? Colors.white70 : const Color(0xFF84978C),
                fontSize: size * 0.12,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.1,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
