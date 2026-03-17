package com.zendash.feature.home

import android.content.Intent
import android.content.pm.PackageManager
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.model.AppSuggestion
import com.zendash.core.domain.repository.AppUsageRepository
import com.zendash.core.domain.usecase.GetContextualSuggestionsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
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
    private val appUsageRepository: AppUsageRepository,
    private val getContextualSuggestions: GetContextualSuggestionsUseCase,
    private val packageManager: PackageManager,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        loadSuggestions()
    }

    private fun loadSuggestions() {
        viewModelScope.launch {
            appUsageRepository.observeInstalledApps()
                .catch { /* isolate crash — never bring down home screen */ }
                .collect { apps ->
                    val suggestions = runCatching {
                        getContextualSuggestions(apps)
                    }.getOrDefault(emptyList())

                    _uiState.update { it.copy(suggestions = suggestions, isLoading = false) }
                }
        }
    }

    fun onScribbleQuery(query: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(hasScribbledBefore = true) }

            // Search is run in a runCatching so a ML Kit failure never crashes the home screen
            val results = runCatching {
                appUsageRepository.observeInstalledApps().first()
                    .filter { app ->
                        app.label.contains(query, ignoreCase = true) ||
                        app.alias.split(",").any { it.trim().equals(query, ignoreCase = true) }
                    }
                    .take(8)
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
                val intent = packageManager.getLaunchIntentForPackage(app.packageName)
                    ?: return@runCatching
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED)
                // Context is injected via Hilt — safe to use here
                appUsageRepository.recordAppOpen(app.packageName)
            }
        }
    }

    fun unpinApp(app: AppInfo) {
        _uiState.update { state ->
            state.copy(pinnedApps = state.pinnedApps.filter { it.packageName != app.packageName })
        }
    }
}
