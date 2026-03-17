package com.zendash.feature.home.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import com.google.mlkit.vision.digitalink.Ink
import com.zendash.core.data.mlkit.InkRecognitionManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Full-bleed transparent gesture canvas — the primary interaction surface
 * of ZenDash Launcher.
 *
 * How it works
 * ─────────────
 * 1. The user draws anywhere on the screen. Each pointer move appends a
 *    [StrokeSegment] to [strokes], rendered immediately on a Compose Canvas.
 *
 * 2. VELOCITY-SENSITIVE WIDTH: stroke width is proportional to pointer speed.
 *    Fast swipe → [MAX_STROKE_WIDTH] dp. Slow drag → [MIN_STROKE_WIDTH] dp.
 *    This restores the behaviour from the original Nokia Z Launcher that
 *    ReZ never re-implemented (top user request).
 *
 * 3. Each stroke point is also recorded into an ML Kit [Ink.Builder]. After
 *    [RECOGNITION_DEBOUNCE_MS] of inactivity, [InkRecognitionManager.recognize]
 *    is called. The top candidates are passed to [onScribbleResult].
 *
 * 4. The ink trail fades out [FADE_DELAY_MS] after the last stroke ends.
 *
 * 5. A fast upward swipe from the bottom third of the screen triggers
 *    [onDrawerGesture] (opens the full app drawer) instead of starting a
 *    scribble. This mirrors the swipe-up-to-open behaviour users expect.
 *
 * [onScribbleResult] receives an ordered list of recognition candidates
 * (e.g. ["a", "A", "α"]) — the ViewModel picks the best match.
 */
@Composable
fun ScribbleCanvas(
    modifier: Modifier = Modifier,
    strokeColor: Color = Color.White,
    inkManager: InkRecognitionManager,
    onScribbleResult: (List<String>) -> Unit,
    onDrawerGesture: () -> Unit,
) {
    val scope = rememberCoroutineScope()

    val strokes = remember { mutableStateListOf<StrokeSegment>() }
    val velocityTracker = remember { VelocityTracker() }
    var alpha by remember { mutableFloatStateOf(1f) }

    // ML Kit Ink builder — accumulates all strokes in the current gesture
    var inkBuilder by remember { mutableStateOf(Ink.builder()) }
    var strokeBuilder by remember { mutableStateOf<Ink.Stroke.Builder?>(null) }

    // Debounce jobs
    var recognitionJob by remember { mutableStateOf<Job?>(null) }
    var fadeJob by remember { mutableStateOf<Job?>(null) }

    // Prepare ML Kit model on first composition (downloads if needed)
    LaunchedEffect(Unit) {
        runCatching { inkManager.prepare("en-US") }
    }

    // Animated alpha for smooth dissolve (Compose animation)
    val animatedAlpha by animateFloatAsState(
        targetValue = alpha,
        animationSpec = tween(durationMillis = 300),
        label = "inkAlpha",
    )

    fun resetInk() {
        strokes.clear()
        alpha = 1f
        inkBuilder = Ink.builder()
        strokeBuilder = null
    }

    fun scheduleRecognition() {
        recognitionJob?.cancel()
        recognitionJob = scope.launch {
            delay(RECOGNITION_DEBOUNCE_MS)
            val ink = inkBuilder.build()
            if (ink.strokes.isEmpty()) return@launch
            val candidates = runCatching { inkManager.recognize(ink) }.getOrDefault(emptyList())
            if (candidates.isNotEmpty()) onScribbleResult(candidates)
        }
    }

    fun scheduleFade() {
        fadeJob?.cancel()
        fadeJob = scope.launch {
            delay(FADE_DELAY_MS)
            alpha = 0f
            delay(350)   // wait for the animation to finish before clearing
            strokes.clear()
            alpha = 1f
        }
    }

    Box(modifier = modifier) {
        // Drag detector — captures scribble strokes
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { startOffset ->
                            // Cancel pending fade; start fresh stroke
                            fadeJob?.cancel()
                            recognitionJob?.cancel()
                            velocityTracker.resetTracking()

                            // Check for drawer gesture: fast upward swipe from bottom 30%
                            // We check velocity in onDragEnd instead, so just record start.
                            strokeBuilder = Ink.Stroke.builder()
                            strokeBuilder!!.addPoint(
                                Ink.Point.create(startOffset.x, startOffset.y)
                            )
                        },
                        onDrag = { change, _ ->
                            val pos = change.position
                            velocityTracker.addPosition(change.uptimeMillis, pos)

                            val velocity = velocityTracker.calculateVelocity()
                            val speed = kotlin.math.sqrt(
                                velocity.x * velocity.x + velocity.y * velocity.y
                            )

                            // Map speed → stroke width (the Nokia Z Launcher feature)
                            val strokeWidth = lerp(
                                MIN_STROKE_WIDTH,
                                MAX_STROKE_WIDTH,
                                (speed / MAX_SPEED).coerceIn(0f, 1f),
                            )

                            strokes.add(
                                StrokeSegment(
                                    from = change.previousPosition,
                                    to = pos,
                                    width = strokeWidth,
                                )
                            )

                            // Record point with timestamp for ML Kit timing model
                            strokeBuilder?.addPoint(
                                Ink.Point.create(pos.x, pos.y, change.uptimeMillis)
                            )

                            change.consume()
                        },
                        onDragEnd = {
                            val velocity = velocityTracker.calculateVelocity()

                            // Detect swipe-up drawer gesture:
                            // fast upward swipe (vy < 0, speed > threshold) from bottom third
                            val lastY = strokes.lastOrNull()?.to?.y ?: Float.MAX_VALUE
                            val screenHeight = size.height.toFloat()
                            val isFromBottomThird = lastY > screenHeight * 0.66f
                            val isUpwardSwipe = velocity.y < -DRAWER_SWIPE_THRESHOLD

                            if (isFromBottomThird && isUpwardSwipe) {
                                resetInk()
                                onDrawerGesture()
                                return@detectDragGestures
                            }

                            // Finalise the ML Kit stroke and schedule recognition
                            strokeBuilder?.let { sb ->
                                inkBuilder.addStroke(sb.build())
                            }
                            strokeBuilder = null

                            scheduleRecognition()
                            scheduleFade()
                        },
                        onDragCancel = {
                            strokeBuilder = null
                            scheduleFade()
                        },
                    )
                }
        ) {
            strokes.forEach { seg ->
                drawLine(
                    color = strokeColor.copy(alpha = animatedAlpha),
                    start = seg.from,
                    end = seg.to,
                    strokeWidth = seg.width,
                    cap = StrokeCap.Round,
                )
            }
        }
    }
}

// ── Model ──────────────────────────────────────────────────────────────────

data class StrokeSegment(
    val from: Offset,
    val to: Offset,
    val width: Float,
)

// ── Helpers ────────────────────────────────────────────────────────────────

private fun lerp(min: Float, max: Float, t: Float) = min + (max - min) * t

// ── Constants ──────────────────────────────────────────────────────────────

/** Minimum stroke width (slow drawing). */
private const val MIN_STROKE_WIDTH = 4f

/** Maximum stroke width (fast drawing — approx thumb width). */
private const val MAX_STROKE_WIDTH = 28f

/** Pointer speed in px/s at which the stroke hits [MAX_STROKE_WIDTH]. */
private const val MAX_SPEED = 7_000f

/** Debounce before sending ink to ML Kit (ms). Balances speed vs accuracy. */
private const val RECOGNITION_DEBOUNCE_MS = 300L

/** How long after the last stroke before the trail starts fading (ms). */
private const val FADE_DELAY_MS = 900L

/** Minimum vertical velocity (px/s, upward = negative) to trigger drawer. */
private const val DRAWER_SWIPE_THRESHOLD = 2_500f
