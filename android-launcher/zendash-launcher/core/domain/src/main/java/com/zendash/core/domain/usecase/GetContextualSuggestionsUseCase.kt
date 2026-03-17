package com.zendash.core.domain.usecase

import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.model.AppSuggestion
import com.zendash.core.domain.model.SuggestionReason
import com.zendash.core.domain.repository.AppUsageRepository
import java.time.DayOfWeek
import java.time.LocalDateTime
import javax.inject.Inject

/**
 * Produces a ranked list of app suggestions for the current moment.
 *
 * Scoring strategy (each reason contributes a weighted score):
 *  - TIME_OF_DAY   weight 0.40 — used at this hour ± 1h on ≥ 3 previous days
 *  - DAY_OF_WEEK   weight 0.25 — used on this weekday overall
 *  - MOST_USED     weight 0.20 — raw open count in the last 30 days
 *  - RECENTLY_OPENED weight 0.15 — opened in the last 30 minutes
 *
 * This addresses one of the top user requests missing from ReZ Launcher:
 * "learn when I use certain apps and surface them proactively".
 */
class GetContextualSuggestionsUseCase @Inject constructor(
    private val usageRepository: AppUsageRepository,
) {
    suspend operator fun invoke(
        installedApps: List<AppInfo>,
        now: LocalDateTime = LocalDateTime.now(),
        limit: Int = 6,
    ): List<AppSuggestion> {
        val hourSlot = now.hour
        val dayOfWeek: DayOfWeek = now.dayOfWeek

        val usageStats = usageRepository.getUsageStats(days = 30)
        val recentlyOpened = usageRepository.getRecentlyOpened(withinMinutes = 30)

        return installedApps
            .filter { !it.isHidden && !it.isSystemApp }
            .map { app ->
                val pkg = app.packageName

                val timeScore = usageStats
                    .filter { it.packageName == pkg && it.hourSlot in (hourSlot - 1)..(hourSlot + 1) }
                    .size.coerceAtMost(10) / 10f * 0.40f

                val dayScore = usageStats
                    .filter { it.packageName == pkg && it.dayOfWeek == dayOfWeek }
                    .size.coerceAtMost(10) / 10f * 0.25f

                val totalUses = usageStats.count { it.packageName == pkg }
                val usageScore = totalUses.coerceAtMost(50) / 50f * 0.20f

                val recentScore = if (recentlyOpened.any { it == pkg }) 0.15f else 0f

                val score = timeScore + dayScore + usageScore + recentScore

                val primaryReason = when {
                    timeScore >= 0.30f -> SuggestionReason.TIME_OF_DAY
                    recentScore > 0f   -> SuggestionReason.RECENTLY_OPENED
                    dayScore >= 0.20f  -> SuggestionReason.DAY_OF_WEEK
                    else               -> SuggestionReason.MOST_USED
                }

                AppSuggestion(app = app, score = score, reason = primaryReason)
            }
            .sortedByDescending { it.score }
            .take(limit)
    }
}
