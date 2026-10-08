import 'package:flutter/material.dart';
import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/session.dart';
import '../../core/theme.dart';
import '../../widgets/common.dart';

/// Animated brand splash: logo reveal + gold rule, while the saved session is
/// restored. Then → the role's app, or the role picker.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _anim = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..forward();

  @override
  void initState() {
    super.initState();
    FlutterNativeSplash.remove();
    _boot();
  }

  Future<void> _boot() async {
    await Future.wait([
      ref.read(sessionProvider.notifier).restore(),
      Future<void>.delayed(const Duration(milliseconds: 2200)),
    ]);
    if (!mounted) return;
    final s = ref.read(sessionProvider);
    context.go(s.signedIn ? s.role!.home : '/welcome');
  }

  @override
  void dispose() {
    _anim.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final fade = CurvedAnimation(parent: _anim, curve: const Interval(0, 0.6, curve: Curves.easeOut));
    final rule = CurvedAnimation(parent: _anim, curve: const Interval(0.45, 1, curve: Curves.easeInOutCubic));
    return Scaffold(
      backgroundColor: AppColors.ink,
      body: Container(
        decoration: const BoxDecoration(
          gradient: RadialGradient(center: Alignment(0, -0.2), radius: 1.1, colors: [Color(0xFF2A2219), AppColors.ink]),
        ),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            FadeTransition(
              opacity: fade,
              child: ScaleTransition(
                scale: Tween(begin: 0.92, end: 1.0).animate(fade),
                child: const BrandLogo(height: 120, forceLight: true),
              ),
            ),
            const SizedBox(height: 28),
            AnimatedBuilder(
              animation: rule,
              builder: (_, _) => Container(
                width: 140 * rule.value,
                height: 1.5,
                color: AppColors.goldBrand,
              ),
            ),
            const SizedBox(height: 18),
            FadeTransition(
              opacity: rule,
              child: const Text(
                'BOSTON · FINE DINING',
                style: TextStyle(color: AppColors.goldSoft, letterSpacing: 4, fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
