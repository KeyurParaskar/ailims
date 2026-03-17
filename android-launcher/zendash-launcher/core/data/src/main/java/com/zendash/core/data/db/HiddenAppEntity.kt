package com.zendash.core.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Apps the user has chosen to hide from the drawer and scribble results.
 * Persisted so the list survives reboots and reinstalls.
 */
@Entity(tableName = "hidden_apps")
data class HiddenAppEntity(
    @PrimaryKey val packageName: String,
)
