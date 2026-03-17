package com.zendash.feature.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.zendash.core.data.datastore.AppTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel(),
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                        )
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            // ── Theme ────────────────────────────────────────────────
            item {
                SettingsSection(title = "Appearance") {
                    ThemeSelector(
                        current = uiState.theme,
                        onSelect = viewModel::setTheme,
                    )
                }
            }

            // ── Scribble ─────────────────────────────────────────────
            item {
                SettingsSection(title = "Scribble") {
                    SettingRow(
                        label = "Handwriting language",
                        value = uiState.scribbleLanguage,
                        onClick = { /* open language picker */ },
                    )
                }
            }

            // ── Privacy ──────────────────────────────────────────────
            item {
                SettingsSection(title = "Privacy") {
                    SwitchSettingRow(
                        label = "Send crash reports",
                        description = "Help fix bugs by sharing anonymous crash data",
                        checked = uiState.crashReportingEnabled,
                        onCheckedChange = viewModel::setCrashReporting,
                    )
                }
            }

            // ── About ────────────────────────────────────────────────
            item {
                SettingsSection(title = "About") {
                    SettingRow(label = "Version", value = "0.1.0")
                    SettingRow(label = "Source code", value = "github.com/your-org/zendash")
                    SettingRow(label = "License", value = "MIT")
                }
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 4.dp),
        )
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(vertical = 4.dp)) {
                content()
            }
        }
    }
}

@Composable
private fun ThemeSelector(
    current: AppTheme,
    onSelect: (AppTheme) -> Unit,
) {
    AppTheme.entries.forEach { theme ->
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onSelect(theme) }
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(theme.name.lowercase().replaceFirstChar { it.uppercase() })
            RadioButton(selected = theme == current, onClick = { onSelect(theme) })
        }
    }
}

@Composable
private fun SettingRow(
    label: String,
    value: String = "",
    onClick: () -> Unit = {},
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = onClick != {}, onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        if (value.isNotBlank()) {
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )
        }
    }
}

@Composable
private fun SwitchSettingRow(
    label: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.bodyMedium)
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            modifier = Modifier.padding(start = 8.dp),
        )
    }
}
