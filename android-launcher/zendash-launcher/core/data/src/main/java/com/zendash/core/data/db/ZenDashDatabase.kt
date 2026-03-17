package com.zendash.core.data.db

import androidx.room.Database
import androidx.room.RoomDatabase

/**
 * Single Room database for the launcher.
 *
 * Increment [version] and add a migration whenever a schema change is needed.
 * Never use [fallbackToDestructiveMigration] in production — user aliases and
 * usage history must survive app updates.
 */
@Database(
    entities = [
        AppUsageEntity::class,
        AppAliasEntity::class,
        HiddenAppEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class ZenDashDatabase : RoomDatabase() {
    abstract fun appUsageDao(): AppUsageDao
    abstract fun appAliasDao(): AppAliasDao
    abstract fun hiddenAppDao(): HiddenAppDao

    companion object {
        const val DATABASE_NAME = "zendash.db"
    }
}
