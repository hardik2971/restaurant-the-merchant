import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Semantic colour tokens — mirrors the admin's light / `html.dark` palette
/// (ink / cream / gold) so the app reads as the same premium brand.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.bg,
    required this.surface,
    required this.surface2,
    required this.border,
    required this.fg,
    required this.muted,
    required this.accent,
    required this.accentSoft,
    required this.gold,
    required this.success,
    required this.danger,
    required this.warn,
    required this.info,
  });

  final Color bg, surface, surface2, border, fg, muted, accent, accentSoft, gold, success, danger, warn, info;

  static const ink = Color(0xFF141210);
  static const inkSoft = Color(0xFF1D1A17);
  static const cream = Color(0xFFF7F1E8);
  static const goldBrand = Color(0xFFE0A04B);
  static const goldDeep = Color(0xFFC97F2A);
  static const goldSoft = Color(0xFFF3C98B);

  static const dark = AppColors(
    bg: Color(0xFF141210),
    surface: Color(0xFF1D1A17),
    surface2: Color(0xFF26221D),
    border: Color(0xFF322C25),
    fg: Color(0xFFF7F1E8),
    muted: Color(0xFFA3998A),
    accent: Color(0xFFE0A04B),
    accentSoft: Color(0xFF37301F),
    gold: Color(0xFFE0A04B),
    success: Color(0xFF4FBD7C),
    danger: Color(0xFFF0766B),
    warn: Color(0xFFE6A93F),
    info: Color(0xFF6AA5F5),
  );

  static const light = AppColors(
    bg: Color(0xFFF4F1EA),
    surface: Color(0xFFFFFEFB),
    surface2: Color(0xFFF8F4EC),
    border: Color(0xFFE7E0D2),
    fg: Color(0xFF17130F),
    muted: Color(0xFF877C6C),
    accent: Color(0xFFC8812A),
    accentSoft: Color(0xFFF6ECD8),
    gold: Color(0xFFE0A04B),
    success: Color(0xFF2E9E57),
    danger: Color(0xFFD9483F),
    warn: Color(0xFFCF8A1E),
    info: Color(0xFF3B7FE4),
  );

  @override
  AppColors copyWith() => this;

  @override
  AppColors lerp(ThemeExtension<AppColors>? other, double t) => t < 0.5 ? this : (other as AppColors? ?? this);
}

extension AppThemeX on BuildContext {
  AppColors get c => Theme.of(this).extension<AppColors>()!;
  TextTheme get t => Theme.of(this).textTheme;
}

/// Display face (Fraunces) for headings — the website/admin brand serif.
TextStyle display(BuildContext context, {double size = 26, FontWeight weight = FontWeight.w600, Color? color}) =>
    GoogleFonts.fraunces(fontSize: size, fontWeight: weight, color: color ?? context.c.fg, height: 1.15);

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;
  final base = ThemeData(brightness: brightness, useMaterial3: true);
  final text = GoogleFonts.manropeTextTheme(base.textTheme).apply(bodyColor: c.fg, displayColor: c.fg);
  final radius = BorderRadius.circular(16);

  return base.copyWith(
    scaffoldBackgroundColor: c.bg,
    extensions: [c],
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.goldBrand,
      brightness: brightness,
      primary: c.accent,
      onPrimary: AppColors.ink,
      surface: c.surface,
      onSurface: c.fg,
      error: c.danger,
    ),
    textTheme: text.copyWith(
      headlineMedium: GoogleFonts.fraunces(fontSize: 28, fontWeight: FontWeight.w600, color: c.fg),
      headlineSmall: GoogleFonts.fraunces(fontSize: 22, fontWeight: FontWeight.w600, color: c.fg),
      titleLarge: GoogleFonts.fraunces(fontSize: 20, fontWeight: FontWeight.w600, color: c.fg),
      titleMedium: text.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      bodyMedium: text.bodyMedium?.copyWith(color: c.fg),
      bodySmall: text.bodySmall?.copyWith(color: c.muted),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: c.bg,
      foregroundColor: c.fg,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.fraunces(fontSize: 22, fontWeight: FontWeight.w600, color: c.fg),
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: radius, side: BorderSide(color: c.border)),
    ),
    dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.goldBrand,
        foregroundColor: AppColors.ink,
        disabledBackgroundColor: c.surface2,
        minimumSize: const Size(48, 52),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700, fontSize: 15, letterSpacing: 0.2),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.fg,
        minimumSize: const Size(48, 48),
        side: BorderSide(color: c.border),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
      ),
    ),
    textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: c.accent)),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface2,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      labelStyle: TextStyle(color: c.muted),
      hintStyle: TextStyle(color: c.muted),
      border: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.border)),
      enabledBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.border)),
      focusedBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.accent, width: 1.4)),
      errorBorder: OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: c.danger)),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: c.surface2,
      selectedColor: c.accentSoft,
      side: BorderSide(color: c.border),
      labelStyle: GoogleFonts.manrope(color: c.fg, fontWeight: FontWeight.w600, fontSize: 13),
      shape: const StadiumBorder(),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.surface,
      indicatorColor: c.accentSoft,
      height: 68,
      iconTheme: WidgetStateProperty.resolveWith(
        (s) => IconThemeData(color: s.contains(WidgetState.selected) ? c.accent : c.muted),
      ),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (s) => GoogleFonts.manrope(
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
          color: s.contains(WidgetState.selected) ? c.accent : c.muted,
        ),
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: c.surface,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    ),
    dialogTheme: DialogThemeData(backgroundColor: c.surface, shape: RoundedRectangleBorder(borderRadius: radius)),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.fg,
      contentTextStyle: GoogleFonts.manrope(color: c.bg, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? AppColors.ink : c.muted),
      trackColor: WidgetStateProperty.resolveWith((s) => s.contains(WidgetState.selected) ? c.accent : c.surface2),
    ),
    tabBarTheme: TabBarThemeData(
      labelColor: c.accent,
      unselectedLabelColor: c.muted,
      indicatorColor: c.accent,
      dividerColor: c.border,
      labelStyle: GoogleFonts.manrope(fontWeight: FontWeight.w700),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: c.accent),
  );
}
