package com.zendash.core.data.repository

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Singleton hot channel that bridges the BroadcastReceiver (which cannot
 * hold coroutine scope) to the repository's cold Flow.
 *
 * [PackageChangeReceiver] calls [notifyChanged].
 * [AppUsageRepositoryImpl.observeInstalledApps] collects [events].
 */
@Singleton
class AppListNotifier @Inject constructor() {

    private val _events = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val events: SharedFlow<Unit> = _events.asSharedFlow()

    fun notifyChanged() {
        _events.tryEmit(Unit)
    }
}
