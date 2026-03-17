package com.zendash.core.data.datastore

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Typed wrapper around DataStore<Preferences>.
 *
 * Covers all settings that need to survive process restarts without
 * the overhead of a full Room table:
 *  - Theme choice
 *  - Pinned dock apps
 *  - "Has scribbled before" flag (hides the ghost hint after first use)
 *  - Scribble ink color
 *  - Mindful Delay per-app set
 *  - Crashlytics / analytics opt-in
 */
@Singleton
class ZenDashPreferences @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {

    // ── Theme ──────────────────────────────────────────────────────────────

    val theme: Flow<AppTheme> = dataStore.data.map { prefs ->
        AppTheme.fromString(prefs[Keys.THEME] ?: AppTheme.DARK.name)
    }

    suspend fun setTheme(theme: AppTheme) {
        dataStore.edit { it[Keys.THEME] = theme.name }
    }

    // ── Dock ───────────────────────────────────────────────────────────────

    /** Ordered list of package names pinned to the dock (max 5). */
    val pinnedPackages: Flow<List<String>> = dataStore.data.map { prefs ->
        prefs[Keys.PINNED_PACKAGES]
            ?.split(",")
            ?.filter { it.isNotBlank() }
            ?: emptyList()
    }

    suspend fun setPinnedPackages(packages: List<String>) {
        dataStore.edit { it[Keys.PINNED_PACKAGES] = packages.take(5).joinToString(",") }
    }

    // ── Scribble ───────────────────────────────────────────────────────────

    val hasScribbledBefore: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.HAS_SCRIBBLED] ?: false
    }

    suspend fun markHasScribbled() {
        dataStore.edit { it[Keys.HAS_SCRIBBLED] = true }
    }

    /** Hex color string for the scribble ink, e.g. "#FFFFFF". */
    val scribbleColor: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.SCRIBBLE_COLOR] ?: "#FFFFFF"
    }

    suspend fun setScribbleColor(hex: String) {
        dataStore.edit { it[Keys.SCRIBBLE_COLOR] = hex }
    }

    /** ML Kit handwriting language tag, e.g. "en-US". */
    val scribbleLanguage: Flow<String> = dataStore.data.map { prefs ->
        prefs[Keys.SCRIBBLE_LANGUAGE] ?: "en-US"
    }

    suspend fun setScribbleLanguage(tag: String) {
        dataStore.edit { it[Keys.SCRIBBLE_LANGUAGE] = tag }
    }

    // ── Focus / Mindful Delay ──────────────────────────────────────────────

    /** Package names that have Mindful Delay enabled. */
    val mindfulDelayPackages: Flow<Set<String>> = dataStore.data.map { prefs ->
        prefs[Keys.MINDFUL_DELAY_PACKAGES] ?: emptySet()
    }

    suspend fun setMindfulDelayPackages(packages: Set<String>) {
        dataStore.edit { it[Keys.MINDFUL_DELAY_PACKAGES] = packages }
    }

    /** Delay in seconds before launching a mindful-delay app (default 5s). */
    val mindfulDelaySeconds: Flow<Int> = dataStore.data.map { prefs ->
        prefs[Keys.MINDFUL_DELAY_SECONDS]?.toIntOrNull() ?: 5
    }

    suspend fun setMindfulDelaySeconds(seconds: Int) {
        dataStore.edit { it[Keys.MINDFUL_DELAY_SECONDS] = seconds.toString() }
    }

    // ── Privacy / Telemetry ────────────────────────────────────────────────

    val crashReportingEnabled: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[Keys.CRASH_REPORTING] ?: false   // opt-OUT by default
    }

    suspend fun setCrashReporting(enabled: Boolean) {
        dataStore.edit { it[Keys.CRASH_REPORTING] = enabled }
    }

    // ── Keys ───────────────────────────────────────────────────────────────

    private object Keys {
        val THEME = stringPreferencesKey("theme")
        val PINNED_PACKAGES = stringPreferencesKey("pinned_packages")
        val HAS_SCRIBBLED = booleanPreferencesKey("has_scribbled")
        val SCRIBBLE_COLOR = stringPreferencesKey("scribble_color")
        val SCRIBBLE_LANGUAGE = stringPreferencesKey("scribble_language")
        val MINDFUL_DELAY_PACKAGES = stringSetPreferencesKey("mindful_delay_packages")
        val MINDFUL_DELAY_SECONDS = stringPreferencesKey("mindful_delay_seconds")
        val CRASH_REPORTING = booleanPreferencesKey("crash_reporting")
    }
}

enum class AppTheme {
    LIGHT, DARK, AMOLED;

    companion object {
        fun fromString(name: String) = entries.firstOrNull { it.name == name } ?: DARK
    }
}
