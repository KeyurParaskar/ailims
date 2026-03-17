package com.zendash.feature.home.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/**
 * A gently pulsing hint shown on the home screen until the user draws their
 * first scribble. Disappears permanently after the first stroke is detected.
 *
 * The pulse animation is subtle — it should feel like a breathing indicator,
 * not a flashing notification.
 */
@Composable
fun ScribbleHint(modifier: Modifier = Modifier) {
    val infiniteTransition = rememberInfiniteTransition(label = "hint_pulse")
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(1_800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulseAlpha",
    )

    Text(
        text = "Draw a letter to search",
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onBackground.copy(alpha = pulseAlpha),
        textAlign = TextAlign.Center,
        modifier = modifier
            .padding(horizontal = 32.dp),
    )
}
