package com.zendash.core.data.repository

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.os.Build
import com.zendash.core.data.db.AppUsageDao
import com.zendash.core.data.db.AppUsageEntity
import com.zendash.core.data.db.AppAliasDao
import com.zendash.core.data.db.HiddenAppDao
import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.repository.AppUsageRepository
import com.zendash.core.domain.repository.UsageEvent
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.merge
import java.time.DayOfWeek
import java.time.LocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppUsageRepositoryImpl @Inject constructor(
    @ApplicationContext private val context: Context,
    private val packageManager: PackageManager,
    private val usageDao: AppUsageDao,
    private val aliasDao: AppAliasDao,
    private val hiddenAppDao: HiddenAppDao,
    private val notifier: AppListNotifier,
) : AppUsageRepository {

    /**
     * Reactive stream of installed apps.
     *
     * We combine two sources:
     *  1. [AppListNotifier.events] — re-emits whenever a package broadcast fires
     *  2. The hidden-app list from Room (a Flow)
     *
     * Aliases are queried per-package inside the map.
     *
     * This fully replaces the one-shot load in ReZ Launcher and makes the
     * app list always consistent with the installed packages.
     */
    override fun observeInstalledApps(): Flow<List<AppInfo>> {
        // Seed with one Unit so we get an immediate first emission
        val packageFlow = kotlinx.coroutines.flow.merge(
            kotlinx.coroutines.flow.flowOf(Unit),
            notifier.events,
        )

        return combine(packageFlow, hiddenAppDao.observeHiddenPackages()) { _, hiddenPkgs ->
            val hidden = hiddenPkgs.toSet()
            queryInstalledApps(hidden)
        }.distinctUntilChanged()
    }

    private suspend fun queryInstalledApps(hiddenPackages: Set<String>): List<AppInfo> {
        val launchIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL.toLong())
        } else {
            @Suppress("DEPRECATION")
            PackageManager.GET_META_DATA.toLong()
        }

        val resolveInfoList: List<ResolveInfo> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.queryIntentActivities(launchIntent, PackageManager.ResolveInfoFlags.of(0L))
        } else {
            @Suppress("DEPRECATION")
            packageManager.queryIntentActivities(launchIntent, 0)
        }

        val nowMillis = System.currentTimeMillis()
        val newThresholdMillis = nowMillis - NEW_APP_WINDOW_MS

        return resolveInfoList.mapNotNull { info ->
            val pkg = info.activityInfo.packageName
            val activityName = info.activityInfo.name

            // Never show our own launcher in the drawer
            if (pkg == context.packageName) return@mapNotNull null

            val label = info.loadLabel(packageManager).toString()
            val icon = info.loadIcon(packageManager)

            val installedAt = runCatching {
                packageManager.getPackageInfo(pkg, 0).firstInstallTime
            }.getOrDefault(0L)

            // Load aliases from Room for this package
            val aliases = aliasDao.getAliasesForPackage(pkg).joinToString(",") { it.alias }

            AppInfo(
                packageName = pkg,
                activityName = activityName,
                label = label,
                icon = icon,
                isSystemApp = (info.activityInfo.applicationInfo.flags and
                    android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0,
                isHidden = pkg in hiddenPackages,
                isNew = installedAt > newThresholdMillis,
                installedAt = installedAt,
                alias = aliases,
            )
        }.sortedBy { it.label.lowercase() }
    }

    override suspend fun recordAppOpen(packageName: String) {
        val now = LocalDateTime.now()
        usageDao.insert(
            AppUsageEntity(
                packageName = packageName,
                hourSlot = now.hour,
                dayOfWeek = now.dayOfWeek.value,   // 1=Mon … 7=Sun (ISO-8601)
                timestamp = System.currentTimeMillis(),
            )
        )
    }

    override suspend fun getUsageStats(days: Int): List<UsageEvent> {
        val sinceMillis = System.currentTimeMillis() - days * MS_PER_DAY
        return usageDao.getEventsSince(sinceMillis).map { entity ->
            UsageEvent(
                packageName = entity.packageName,
                hourSlot = entity.hourSlot,
                dayOfWeek = DayOfWeek.of(entity.dayOfWeek),
                timestamp = entity.timestamp,
            )
        }
    }

    override suspend fun getRecentlyOpened(withinMinutes: Int): List<String> {
        val sinceMillis = System.currentTimeMillis() - withinMinutes * 60_000L
        return usageDao.getPackagesOpenedSince(sinceMillis)
    }

    companion object {
        private const val NEW_APP_WINDOW_MS = 48 * 60 * 60 * 1000L   // 48 hours
        private const val MS_PER_DAY = 24 * 60 * 60 * 1000L
    }
}
