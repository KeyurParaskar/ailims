package com.zendash.launcher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.core.view.WindowCompat
import com.zendash.core.ui.theme.ZenDashTheme
import com.zendash.launcher.navigation.ZenDashNavGraph
import dagger.hilt.android.AndroidEntryPoint

/**
 * Single Activity — the entire launcher lives here.
 *
 * Android requires a launcher to declare ACTION_MAIN + CATEGORY_HOME in the manifest.
 * We set launchMode="singleTask" so the OS never creates duplicate instances.
 *
 * Edge-to-edge is enabled; each screen handles WindowInsets itself so we work
 * correctly with Xiaomi/Poco gesture navigation (a known ReZ Launcher failure point).
 */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Let content draw behind system bars (status bar + nav bar).
        // Each Composable handles its own WindowInsets padding — this is
        // the correct approach for OEM-agnostic gesture nav compatibility.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        enableEdgeToEdge()

        setContent {
            ZenDashTheme {
                ZenDashNavGraph()
            }
        }
    }
}
