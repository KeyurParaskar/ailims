package com.zendash.feature.appdrawer

import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val ALPHABET = ('A'..'Z').toList()

/**
 * Vertical A–Z strip on the right edge of the app drawer.
 *
 * Behaviour:
 *  - Tap any letter → jump to that section.
 *  - Drag up/down → continuously highlight and jump as the finger moves.
 *
 * This is the #1 missing feature from ReZ Launcher. The Nokia Z Launcher
 * had it; contacts apps have had it for years. We bring it to the drawer.
 */
@Composable
fun AlphabetStrip(
    modifier: Modifier = Modifier,
    onLetterSelected: (Char) -> Unit,
) {
    var stripHeightPx by remember { mutableIntStateOf(1) }
    var activeLetter by remember { mutableStateOf<Char?>(null) }

    Column(
        modifier = modifier
            .width(20.dp)
            .fillMaxHeight()
            .onSizeChanged { stripHeightPx = it.height }
            .pointerInput(stripHeightPx) {
                detectDragGestures(
                    onDragStart = { offset ->
                        val letter = offsetToLetter(offset.y, stripHeightPx)
                        activeLetter = letter
                        onLetterSelected(letter)
                    },
                    onDrag = { change, _ ->
                        val letter = offsetToLetter(change.position.y, stripHeightPx)
                        if (letter != activeLetter) {
                            activeLetter = letter
                            onLetterSelected(letter)
                        }
                        change.consume()
                    },
                    onDragEnd = { activeLetter = null },
                    onDragCancel = { activeLetter = null },
                )
            },
        verticalArrangement = Arrangement.SpaceEvenly,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        ALPHABET.forEach { letter ->
            val isActive = letter == activeLetter
            Text(
                text = letter.toString(),
                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                color = if (isActive)
                    MaterialTheme.colorScheme.primary
                else
                    MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                textAlign = TextAlign.Center,
            )
        }
    }
}

private fun offsetToLetter(yPx: Float, totalHeightPx: Int): Char {
    val index = ((yPx / totalHeightPx) * ALPHABET.size)
        .toInt()
        .coerceIn(0, ALPHABET.lastIndex)
    return ALPHABET[index]
}
