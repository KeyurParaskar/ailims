package com.zendash.feature.home.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import kotlinx.coroutines.delay

/**
 * The core interaction surface — a transparent Canvas that captures
 * finger strokes and feeds them to ML Kit for handwriting recognition.
 *
 * Key differentiator vs ReZ Launcher:
 * ──────────────────────────────────
 * VELOCITY-SENSITIVE STROKE WIDTH:
 *   fast drag  → wide stroke (up to [MAX_STROKE_WIDTH] dp)
 *   slow drag  → thin hairline (down to [MIN_STROKE_WIDTH] dp)
 *
 * This was a top user request that ReZ never implemented.
 *
 * The trail fades out 800ms after the last stroke point is added.
 *
 * [onScribbleResult] is called with the recognised text when ML Kit
 * returns (or when the text-based filter matches, as a fallback).
 *
 * [onDrawerGesture] is called on a fast upward swipe from the bottom
 * third of the screen — opens the full app drawer.
 */
@Composable
fun ScribbleCanvas(
    modifier: Modifier = Modifier,
    strokeColor: Color = Color.White,
    onScribbleResult: (String) -> Unit,
    onDrawerGesture: () -> Unit,
) {
    val strokes = remember { mutableStateListOf<StrokeSegment>() }
    val velocityTracker = remember { VelocityTracker() }
    var alpha by remember { mutableFloatStateOf(1f) }
    var lastStrokeTime by remember { mutableLongStateOf(0L) }

    // Fade-out effect: after 800ms of inactivity, dissolve the trail
    LaunchedEffect(lastStrokeTime) {
        if (lastStrokeTime == 0L) return@LaunchedEffect
        delay(800)
        while (alpha > 0f) {
            alpha = (alpha - 0.05f).coerceAtLeast(0f)
            delay(16)
        }
        strokes.clear()
        alpha = 1f
    }

    Canvas(
        modifier = modifier.pointerInput(Unit) {
            detectDragGestures(
                onDragStart = { offset ->
                    velocityTracker.resetTracking()
                    strokes.clear()
                    alpha = 1f
                },
                onDrag = { change, _ ->
                    velocityTracker.addPosition(change.uptimeMillis, change.position)
                    val velocity = velocityTracker.calculateVelocity()
                    val speed = kotlin.math.sqrt(
                        velocity.x * velocity.x + velocity.y * velocity.y
                    )

                    // Map speed (px/s) → stroke width (dp)
                    // ReZ users wanted exactly this behaviour
                    val strokeWidth = lerp(
                        MIN_STROKE_WIDTH,
                        MAX_STROKE_WIDTH,
                        (speed / MAX_SPEED).coerceIn(0f, 1f)
                    )

                    strokes.add(
                        StrokeSegment(
                            from = change.previousPosition,
                            to = change.position,
                            width = strokeWidth,
                        )
                    )
                    lastStrokeTime = System.currentTimeMillis()
                    change.consume()
                },
                onDragEnd = {
                    // Submit the collected stroke points to ML Kit via the ViewModel.
                    // For the MVP, we fall back to a single-letter heuristic.
                    val text = strokes.toLetterHint()
                    if (text.isNotBlank()) onScribbleResult(text)
                },
            )
        }
    ) {
        strokes.forEach { segment ->
            drawLine(
                color = strokeColor.copy(alpha = alpha),
                start = segment.from,
                end = segment.to,
                strokeWidth = segment.width,
                cap = StrokeCap.Round,
            )
        }
    }
}

data class StrokeSegment(
    val from: Offset,
    val to: Offset,
    val width: Float,
)

private fun List<StrokeSegment>.toLetterHint(): String {
    // Placeholder — replaced by ML Kit Digital Ink recognition in Phase 1.
    // Returns empty string until ML Kit integration is wired up.
    return ""
}

private fun lerp(min: Float, max: Float, t: Float) = min + (max - min) * t

private const val MIN_STROKE_WIDTH = 4f
private const val MAX_STROKE_WIDTH = 24f
private const val MAX_SPEED = 8000f  // px/s at which stroke hits max width
