package com.zendash.core.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// ── AMOLED / Dark ──────────────────────────────────────────────────────────

private val AmoledBlack = Color(0xFF000000)
private val SurfaceDark = Color(0xFF111111)
private val OnSurfaceDark = Color(0xFFE0E0E0)
private val PrimaryDark = Color(0xFF90CAF9)  // Material Blue 200

private val DarkColorScheme = darkColorScheme(
    background = AmoledBlack,
    surface = SurfaceDark,
    onBackground = OnSurfaceDark,
    onSurface = OnSurfaceDark,
    primary = PrimaryDark,
)

// ── Light ──────────────────────────────────────────────────────────────────

private val LightColorScheme = lightColorScheme(
    background = Color(0xFFF5F5F5),
    surface = Color.White,
    primary = Color(0xFF1565C0),
)

/**
 * Root theme for ZenDash Launcher.
 *
 * The app defaults to DARK / AMOLED. Light mode is offered as an
 * accessibility and preference option in Settings. AMOLED pure-black
 * saves battery on OLED panels — the dominant panel type on flagships.
 */
@Composable
fun ZenDashTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colors,
        typography = ZenDashTypography,
        content = content,
    )
}
