package com.carecircle.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val CareCircleLightColorScheme = lightColorScheme(
    primary = CareGreenPrimary,
    onPrimary = CareGreenOnPrimary,
    primaryContainer = CareGreenContainer,
    onPrimaryContainer = CareGreenOnContainer,
    secondary = CareGreenSecondary,
    onSecondary = CareGreenOnPrimary,
    secondaryContainer = CareGreenSecondaryContainer,
    onSecondaryContainer = CareGreenOnSecondaryContainer,
    tertiary = CareTealAccent,
    tertiaryContainer = CareTealContainer,
    background = CareBackground,
    onBackground = CareTextPrimary,
    surface = CareSurface,
    onSurface = CareTextPrimary,
    surfaceVariant = CareSurfaceVariant,
    onSurfaceVariant = CareTextSecondary,
    outline = CareBorder,
    outlineVariant = CareBorder,
    error = CareError,
    errorContainer = CareErrorContainer,
    onErrorContainer = CareOnErrorContainer
)

@Composable
fun CareCircleTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = CareCircleLightColorScheme,
        typography = CareCircleTypography,
        content = content
    )
}
