package com.zendash.core.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * User-defined scribble alias for an app.
 *
 * Example: package="com.google.youtube", alias="yt"
 * Scribbling "yt" on the home screen will surface YouTube first.
 * Multiple aliases are stored as separate rows.
 */
@Entity(tableName = "app_aliases")
data class AppAliasEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val packageName: String,
    val alias: String,           // lowercased, trimmed
)
