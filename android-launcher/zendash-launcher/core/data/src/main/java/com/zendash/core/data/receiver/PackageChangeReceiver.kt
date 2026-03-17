package com.zendash.core.data.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.zendash.core.data.repository.AppListNotifier
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

/**
 * Listens for package install / uninstall / change broadcasts and notifies
 * the repository so [observeInstalledApps] emits a fresh list.
 *
 * Declared in the manifest with the PACKAGE_ADDED / PACKAGE_REMOVED /
 * PACKAGE_REPLACED / PACKAGE_CHANGED intent filters.
 *
 * This is the reactive backbone that ReZ Launcher lacked — ReZ re-queried
 * the package manager only on Activity.onResume(), which caused the app list
 * to be stale until the user left and returned to the launcher.
 */
@AndroidEntryPoint
class PackageChangeReceiver : BroadcastReceiver() {

    @Inject
    lateinit var notifier: AppListNotifier

    override fun onReceive(context: Context, intent: Intent) {
        val relevantActions = setOf(
            Intent.ACTION_PACKAGE_ADDED,
            Intent.ACTION_PACKAGE_REMOVED,
            Intent.ACTION_PACKAGE_REPLACED,
            Intent.ACTION_PACKAGE_CHANGED,
        )
        if (intent.action in relevantActions) {
            notifier.notifyChanged()
        }
    }
}
