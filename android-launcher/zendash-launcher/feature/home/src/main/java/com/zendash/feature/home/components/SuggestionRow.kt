package com.zendash.feature.home.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.model.AppSuggestion

/**
 * Horizontal scrollable row of contextually suggested apps.
 * Each chip shows the app icon + truncated label.
 *
 * Suggestions are ranked by [GetContextualSuggestionsUseCase] using
 * time-of-day, day-of-week, overall usage frequency, and recency.
 */
@Composable
fun SuggestionRow(
    suggestions: List<AppSuggestion>,
    modifier: Modifier = Modifier,
    onAppClick: (AppInfo) -> Unit,
) {
    if (suggestions.isEmpty()) return

    LazyRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp),
    ) {
        items(suggestions, key = { it.app.packageName }) { suggestion ->
            SuggestionChip(
                suggestion = suggestion,
                onClick = { onAppClick(suggestion.app) },
            )
        }
    }
}

@Composable
private fun SuggestionChip(
    suggestion: AppSuggestion,
    onClick: () -> Unit,
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        tonalElevation = 2.dp,
        modifier = Modifier
            .width(72.dp)
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick),
    ) {
        Column(
            modifier = Modifier.padding(vertical = 8.dp, horizontal = 4.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            AsyncImage(
                model = suggestion.app.icon,
                contentDescription = suggestion.app.label,
                modifier = Modifier.size(44.dp),
            )
            Text(
                text = suggestion.app.label,
                style = MaterialTheme.typography.labelSmall,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
            )
        }
    }
}
