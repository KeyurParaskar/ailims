package com.zendash.feature.home

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.zendash.core.data.datastore.ZenDashPreferences
import com.zendash.core.data.mlkit.InkRecognitionManager
import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.model.AppSuggestion
import com.zendash.core.domain.repository.AppUsageRepository
import com.zendash.core.domain.usecase.GetContextualSuggestionsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val suggestions: List<AppSuggestion> = emptyList(),
    val pinnedApps: List<AppInfo> = emptyList(),
    val scribbleResults: List<AppInfo> = emptyList(),
    val hasScribbledBefore: Boolean = false,
    val isLoading: Boolean = true,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val appUsageRepository: AppUsageRepository,
    private val getContextualSuggestions: GetContextualSuggestionsUseCase,
    private val preferences: ZenDashPreferences,
    val inkRecognitionManager: InkRecognitionManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    /** Full installed app list — kept in memory for fast scribble filtering. */
    private var allApps: List<AppInfo> = emptyList()

    init {
        observeInstalledApps()
        observePinnedApps()
        observeScribbleFlag()
    }

    private fun observeInstalledApps() {
        viewModelScope.launch {
            appUsageRepository.observeInstalledApps()
                .catch { /* crash isolation — home screen never goes down */ }
                .collect { apps ->
                    allApps = apps
                    val suggestions = runCatching {
                        getContextualSuggestions(apps)
                    }.getOrDefault(emptyList())
                    _uiState.update { it.copy(suggestions = suggestions, isLoading = false) }
                }
        }
    }

    private fun observePinnedApps() {
        viewModelScope.launch {
            preferences.pinnedPackages
                .catch { }
                .collect { pkgs ->
                    val pinned = pkgs.mapNotNull { pkg ->
                        allApps.firstOrNull { it.packageName == pkg }
                    }
                    _uiState.update { it.copy(pinnedApps = pinned) }
                }
        }
    }

    private fun observeScribbleFlag() {
        viewModelScope.launch {
            preferences.hasScribbledBefore
                .catch { }
                .collect { has -> _uiState.update { it.copy(hasScribbledBefore = has) } }
        }
    }

    /**
     * Called by [ScribbleCanvas] with the ordered ML Kit recognition candidates.
     *
     * Strategy:
     *  1. For each candidate, filter [allApps] by label prefix OR alias match.
     *  2. Merge results, de-duplicate, take top 8.
     *  3. If no apps found for any candidate, fall back to substring search on
     *     the first (best) candidate — handles partial / messy handwriting.
     */
    fun onScribbleCandidates(candidates: List<String>) {
        if (candidates.isEmpty()) return

        viewModelScope.launch {
            // Mark that the user has scribbled (hides the ghost hint)
            preferences.markHasScribbled()

            val results = runCatching {
                val seen = mutableSetOf<String>()
                val merged = mutableListOf<AppInfo>()

                for (candidate in candidates) {
                    val matches = allApps.filter { app ->
                        !app.isHidden && (
                            app.label.startsWith(candidate, ignoreCase = true) ||
                            app.alias.split(",").any { a ->
                                a.trim().equals(candidate, ignoreCase = true)
                            }
                        )
                    }
                    for (app in matches) {
                        if (seen.add(app.packageName)) merged.add(app)
                    }
                    if (merged.size >= 8) break
                }

                // Substring fallback using the top candidate
                if (merged.isEmpty()) {
                    val top = candidates.first()
                    allApps.filter { app ->
                        !app.isHidden && app.label.contains(top, ignoreCase = true)
                    }.take(8)
                } else {
                    merged.take(8)
                }
            }.getOrDefault(emptyList())

            _uiState.update { it.copy(scribbleResults = results) }
        }
    }

    fun clearScribbleResults() {
        _uiState.update { it.copy(scribbleResults = emptyList()) }
    }

    fun launchApp(app: AppInfo) {
        viewModelScope.launch {
            runCatching {
                val intent = context.packageManager
                    .getLaunchIntentForPackage(app.packageName) ?: return@runCatching
                intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                )
                context.startActivity(intent)
                appUsageRepository.recordAppOpen(app.packageName)
            }
        }
    }

    fun pinApp(app: AppInfo) {
        viewModelScope.launch {
            val current = preferences.pinnedPackages.first().toMutableList()
            if (app.packageName !in current) {
                current.add(app.packageName)
                preferences.setPinnedPackages(current)
            }
        }
    }

    fun unpinApp(app: AppInfo) {
        viewModelScope.launch {
            val current = preferences.pinnedPackages.first().toMutableList()
            current.remove(app.packageName)
            preferences.setPinnedPackages(current)
        }
    }
}
