package com.zendash.feature.appdrawer

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.launch

/**
 * Full app drawer — alphabetical list with an A–Z quick-filter strip.
 *
 * The alphabet strip on the right is one of the top feature requests
 * that ReZ Launcher never implemented. Tapping any letter jumps directly
 * to that section, making navigation much faster than scrolling.
 *
 * The scribble canvas also stays active in this screen — you can keep
 * drawing letters to narrow the search even in the app drawer.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun AppDrawerScreen(
    onBack: () -> Unit,
    viewModel: AppDrawerViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    // Map letter → first index in the grouped list
    val letterIndexMap = remember(uiState.groupedApps) {
        buildLetterIndexMap(uiState.groupedApps)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) {
        Row(modifier = Modifier.fillMaxSize()) {

            // ── Main app list ─────────────────────────────
            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(vertical = 8.dp),
            ) {
                // Back button row
                item {
                    IconButton(onClick = onBack, modifier = Modifier.padding(8.dp)) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }

                uiState.groupedApps.forEach { (letter, apps) ->
                    // Sticky section header — letter divider (like Contacts)
                    stickyHeader(key = "header_$letter") {
                        Text(
                            text = letter.toString(),
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(MaterialTheme.colorScheme.background)
                                .padding(horizontal = 20.dp, vertical = 4.dp),
                        )
                    }

                    items(apps, key = { it.packageName }) { app ->
                        AppListItem(
                            app = app,
                            onClick = { viewModel.launchApp(app) },
                            onLongPress = { viewModel.pinApp(app) },
                        )
                    }
                }
            }

            // ── Alphabet strip (A–Z) ──────────────────────
            // THIS IS THE KEY MISSING FEATURE FROM REZ LAUNCHER
            AlphabetStrip(
                modifier = Modifier
                    .fillMaxHeight()
                    .padding(end = 4.dp),
                onLetterSelected = { letter ->
                    val index = letterIndexMap[letter] ?: return@AlphabetStrip
                    scope.launch { listState.animateScrollToItem(index) }
                }
            )
        }
    }
}

/** Builds a map of letter → flat list index (accounting for headers and items). */
private fun buildLetterIndexMap(
    grouped: Map<Char, List<com.zendash.core.domain.model.AppInfo>>
): Map<Char, Int> {
    val map = mutableMapOf<Char, Int>()
    var index = 1 // offset for the back-button item
    grouped.forEach { (letter, apps) ->
        map[letter] = index   // header row
        index += 1 + apps.size  // header + items
    }
    return map
}
