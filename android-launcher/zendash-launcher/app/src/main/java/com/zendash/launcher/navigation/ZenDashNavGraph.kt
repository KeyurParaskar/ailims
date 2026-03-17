package com.zendash.launcher.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.zendash.feature.home.HomeScreen
import com.zendash.feature.appdrawer.AppDrawerScreen
import com.zendash.feature.settings.SettingsScreen

/**
 * Root navigation graph.
 *
 * The launcher uses a single-activity / multi-composable pattern.
 * Screens are navigated modally — the home screen is always the start destination
 * and is never fully removed from the back stack (launchSingleTop).
 */
@Composable
fun ZenDashNavGraph() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(Routes.HOME) {
            HomeScreen(
                onOpenAppDrawer = { navController.navigate(Routes.APP_DRAWER) },
                onOpenSettings = { navController.navigate(Routes.SETTINGS) }
            )
        }

        composable(Routes.APP_DRAWER) {
            AppDrawerScreen(
                onBack = { navController.popBackStack() }
            )
        }

        composable(Routes.SETTINGS) {
            SettingsScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}

object Routes {
    const val HOME = "home"
    const val APP_DRAWER = "app_drawer"
    const val SETTINGS = "settings"
}
