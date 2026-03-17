package com.zendash.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.zendash.feature.home.components.ClockWidget
import com.zendash.feature.home.components.ScribbleCanvas
import com.zendash.feature.home.components.SuggestionRow
import com.zendash.feature.home.components.ScribbleResultCard
import com.zendash.feature.home.components.AppDock

/**
 * The main home screen — the face of ZenDash Launcher.
 *
 * Layout (top to bottom):
 *  1. [ClockWidget]       — time, date, next calendar event, media controls
 *  2. [SuggestionRow]     — top 4–6 contextual app suggestions
 *  3. [ScribbleCanvas]    — full-bleed gesture drawing area (core interaction)
 *  4. [ScribbleResultCard]— slides up when ML Kit has results
 *  5. [AppDock]           — up to 5 pinned apps at the bottom
 *
 * All system insets are consumed here so the layout works on OEM gesture nav
 * bars (Xiaomi, Samsung One UI, stock Android) — fixing the ReZ bug.
 */
@Composable
fun HomeScreen(
    onOpenAppDrawer: () -> Unit,
    onOpenSettings: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            // Consume window insets to handle OEM gesture nav correctly
            .windowInsetsPadding(WindowInsets.safeDrawing)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // 1. Clock / Calendar / Media widget
            ClockWidget(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                onTap = { /* open clock app */ },
                onCalendarTap = { /* open calendar */ },
            )

            // 2. Contextual app suggestions
            SuggestionRow(
                suggestions = uiState.suggestions,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                onAppClick = { app -> viewModel.launchApp(app) },
            )

            Spacer(modifier = Modifier.weight(1f))

            // Hint text — disappears after first scribble
            if (!uiState.hasScribbledBefore) {
                ScribbleHint()
            }

            Spacer(modifier = Modifier.weight(1f))
        }

        // 3. Full-bleed scribble canvas (overlays the spacer region)
        ScribbleCanvas(
            modifier = Modifier.fillMaxSize(),
            onScribbleResult = { query -> viewModel.onScribbleQuery(query) },
            onDrawerGesture = onOpenAppDrawer,   // swipe-up from bottom triggers drawer
        )

        // 4. Search result card (slides up from bottom)
        if (uiState.scribbleResults.isNotEmpty()) {
            ScribbleResultCard(
                results = uiState.scribbleResults,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 88.dp),   // above the dock
                onAppClick = { app -> viewModel.launchApp(app) },
                onDismiss = { viewModel.clearScribbleResults() },
            )
        }

        // 5. App dock
        AppDock(
            pinnedApps = uiState.pinnedApps,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(bottom = 12.dp, start = 16.dp, end = 16.dp),
            onAppClick = { app -> viewModel.launchApp(app) },
            onAppLongPress = { app -> viewModel.unpinApp(app) },
            onSettingsClick = onOpenSettings,
        )
    }
}
