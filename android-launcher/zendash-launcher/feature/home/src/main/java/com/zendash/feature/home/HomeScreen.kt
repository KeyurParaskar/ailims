package com.zendash.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.zendash.feature.home.components.AppDock
import com.zendash.feature.home.components.ClockWidget
import com.zendash.feature.home.components.ScribbleCanvas
import com.zendash.feature.home.components.ScribbleHint
import com.zendash.feature.home.components.ScribbleResultCard
import com.zendash.feature.home.components.SuggestionRow

/**
 * The main home screen — the face of ZenDash Launcher.
 *
 * Layout (top to bottom):
 *  1. [ClockWidget]        — time, date, next calendar event, media controls
 *  2. [SuggestionRow]      — top 4–6 contextual app suggestions
 *  3. [ScribbleHint]       — ghost "scribble here" hint (hidden after first use)
 *  4. [ScribbleCanvas]     — full-bleed gesture drawing area (core interaction)
 *  5. [ScribbleResultCard] — slides up when ML Kit has results
 *  6. [AppDock]            — up to 5 pinned apps at the bottom
 *
 * WindowInsets are consumed here via [WindowInsets.safeDrawing] so the layout
 * works correctly with Xiaomi/Poco/Samsung gesture nav (the ReZ Launcher bug).
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
            .windowInsetsPadding(WindowInsets.safeDrawing),
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // 1. Clock / date / calendar / media
            ClockWidget(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
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

            // 3. Ghost scribble hint (disappears after first stroke)
            if (!uiState.hasScribbledBefore) {
                ScribbleHint(
                    modifier = Modifier.padding(bottom = 24.dp),
                )
            }

            Spacer(modifier = Modifier.weight(1f))
        }

        // 4. Full-bleed scribble canvas — overlays everything
        // InkRecognitionManager is a @Singleton injected into the ViewModel
        ScribbleCanvas(
            modifier = Modifier.fillMaxSize(),
            strokeColor = Color.White,
            inkManager = viewModel.inkRecognitionManager,
            onScribbleResult = { candidates -> viewModel.onScribbleCandidates(candidates) },
            onDrawerGesture = onOpenAppDrawer,
        )

        // 5. Search result card — slides up from just above the dock
        if (uiState.scribbleResults.isNotEmpty()) {
            ScribbleResultCard(
                results = uiState.scribbleResults,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 88.dp, start = 16.dp, end = 16.dp),
                onAppClick = { app -> viewModel.launchApp(app) },
                onDismiss = { viewModel.clearScribbleResults() },
            )
        }

        // 6. App dock
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
