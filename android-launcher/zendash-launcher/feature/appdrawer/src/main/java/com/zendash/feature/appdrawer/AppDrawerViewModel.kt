package com.zendash.feature.appdrawer

import android.content.Context
import android.content.Intent
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.zendash.core.data.datastore.ZenDashPreferences
import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.repository.AppUsageRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AppDrawerUiState(
    val groupedApps: Map<Char, List<AppInfo>> = emptyMap(),
    val isLoading: Boolean = true,
)

@HiltViewModel
class AppDrawerViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val appUsageRepository: AppUsageRepository,
    private val preferences: ZenDashPreferences,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AppDrawerUiState())
    val uiState: StateFlow<AppDrawerUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            appUsageRepository.observeInstalledApps()
                .catch { }
                .collect { apps ->
                    val grouped = apps
                        .filter { !it.isHidden }
                        .groupBy { app ->
                            app.label.firstOrNull()?.uppercaseChar()
                                ?.takeIf { it.isLetter() } ?: '#'
                        }
                        .toSortedMap(compareBy { if (it == '#') Char.MAX_VALUE else it })
                    _uiState.update { it.copy(groupedApps = grouped, isLoading = false) }
                }
        }
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
}
