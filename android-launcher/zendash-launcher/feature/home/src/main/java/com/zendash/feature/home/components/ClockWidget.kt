package com.zendash.feature.home.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

/**
 * Top widget showing the current time and date.
 * Updates every minute via a LaunchedEffect ticker.
 */
@Composable
fun ClockWidget(
    modifier: Modifier = Modifier,
    onTap: () -> Unit = {},
    onCalendarTap: () -> Unit = {},
) {
    var now by remember { mutableStateOf(Date()) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(30_000L)   // refresh every 30s — clock stays accurate
            now = Date()
        }
    }

    val timeStr = remember(now) {
        SimpleDateFormat("h:mm a", Locale.getDefault()).format(now)
    }
    val dateStr = remember(now) {
        SimpleDateFormat("EEE, MMM d", Locale.getDefault()).format(now)
    }

    Column(modifier = modifier) {
        Text(
            text = timeStr,
            style = MaterialTheme.typography.displayMedium.copy(
                fontWeight = FontWeight.Light,
                fontSize = 56.sp,
            ),
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.clickable(onClick = onTap),
        )
        Text(
            text = dateStr,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
            modifier = Modifier
                .padding(top = 2.dp)
                .clickable(onClick = onCalendarTap),
        )
    }
}
