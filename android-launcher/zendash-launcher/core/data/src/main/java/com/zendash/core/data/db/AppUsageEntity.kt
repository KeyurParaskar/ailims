package com.zendash.core.data.db

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Persisted record of a single app-open event.
 *
 * We store [hourSlot] (0–23) and [dayOfWeek] (1=MON…7=SUN, ISO-8601)
 * as integers so the contextual scoring query stays cheap — just
 * a COUNT(*) GROUP BY with a WHERE on these two columns.
 */
@Entity(
    tableName = "app_usage_events",
    indices = [
        Index(value = ["packageName"]),
        Index(value = ["hourSlot"]),
        Index(value = ["dayOfWeek"]),
        Index(value = ["timestamp"]),
    ]
)
data class AppUsageEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val packageName: String,
    val hourSlot: Int,           // 0–23
    val dayOfWeek: Int,          // 1 (Mon) – 7 (Sun), ISO-8601
    val timestamp: Long,         // System.currentTimeMillis()
)
