package com.zendash.core.domain.model

import android.graphics.drawable.Drawable

/**
 * Lightweight domain model for an installed app.
 *
 * [isNew] is true for 48 hours after installation — shows "New!" badge
 * in the app drawer (mirrors ReZ 1.13 behavior).
 *
 * [alias] is a user-defined scribble shortcut, e.g. "yt" → YouTube.
 * Multiple aliases separated by comma are supported.
 */
data class AppInfo(
    val packageName: String,
    val activityName: String,
    val label: String,
    val icon: Drawable,
    val isSystemApp: Boolean = false,
    val isHidden: Boolean = false,
    val isNew: Boolean = false,
    val installedAt: Long = 0L,
    val alias: String = "",
    val isWorkProfileApp: Boolean = false,
    val workProfileId: Int? = null,
)

/**
 * Contextual suggestion for the home screen.
 * Contains the [AppInfo] plus a predicted relevance [score] for the current time slot.
 */
data class AppSuggestion(
    val app: AppInfo,
    val score: Float,        // 0.0–1.0 — higher = more relevant right now
    val reason: SuggestionReason,
)

enum class SuggestionReason {
    MOST_USED,           // Simply used most often overall
    TIME_OF_DAY,         // Used at this hour on previous days
    DAY_OF_WEEK,         // Used on this weekday
    RECENTLY_OPENED,     // Opened in the last 30 minutes
}
