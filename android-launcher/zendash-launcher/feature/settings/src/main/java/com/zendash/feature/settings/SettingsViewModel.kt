package com.zendash.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.zendash.core.data.datastore.AppTheme
import com.zendash.core.data.datastore.ZenDashPreferences
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val theme: AppTheme = AppTheme.DARK,
    val scribbleLanguage: String = "en-US",
    val crashReportingEnabled: Boolean = false,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferences: ZenDashPreferences,
) : ViewModel() {

    val uiState: StateFlow<SettingsUiState> = combine(
        preferences.theme,
        preferences.scribbleLanguage,
        preferences.crashReportingEnabled,
    ) { theme, lang, crash ->
        SettingsUiState(
            theme = theme,
            scribbleLanguage = lang,
            crashReportingEnabled = crash,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = SettingsUiState(),
    )

    fun setTheme(theme: AppTheme) {
        viewModelScope.launch { preferences.setTheme(theme) }
    }

    fun setCrashReporting(enabled: Boolean) {
        viewModelScope.launch { preferences.setCrashReporting(enabled) }
    }
}
