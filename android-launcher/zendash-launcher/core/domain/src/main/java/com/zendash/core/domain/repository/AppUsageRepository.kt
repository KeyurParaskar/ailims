package com.zendash.core.domain.repository

import com.zendash.core.domain.model.AppInfo
import kotlinx.coroutines.flow.Flow
import java.time.DayOfWeek

/**
 * Repository interface for app usage tracking.
 * Implemented in :core:data using Room + Android UsageStatsManager.
 */
interface AppUsageRepository {

    /** Returns all installed (non-hidden) apps as a reactive Flow. */
    fun observeInstalledApps(): Flow<List<AppInfo>>

    /** Records a single app-open event (called by MainActivity on app launch). */
    suspend fun recordAppOpen(packageName: String)

    /**
     * Returns aggregated usage events for the last [days] days.
     * Each [UsageEvent] carries the hour slot and day-of-week for scoring.
     */
    suspend fun getUsageStats(days: Int): List<UsageEvent>

    /** Returns package names of apps opened in the last [withinMinutes] minutes. */
    suspend fun getRecentlyOpened(withinMinutes: Int): List<String>
}

data class UsageEvent(
    val packageName: String,
    val hourSlot: Int,         // 0–23
    val dayOfWeek: DayOfWeek,
    val timestamp: Long,
)
