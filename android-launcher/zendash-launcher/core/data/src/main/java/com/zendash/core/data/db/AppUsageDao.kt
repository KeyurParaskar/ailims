package com.zendash.core.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface AppUsageDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: AppUsageEntity)

    /**
     * All events within the last [days] days.
     * Used by [GetContextualSuggestionsUseCase] for scoring.
     */
    @Query(
        """
        SELECT * FROM app_usage_events
        WHERE timestamp >= :sinceTimestamp
        ORDER BY timestamp DESC
        """
    )
    suspend fun getEventsSince(sinceTimestamp: Long): List<AppUsageEntity>

    /**
     * Apps opened after [sinceTimestamp] — used for the "recently opened" signal.
     */
    @Query(
        """
        SELECT DISTINCT packageName FROM app_usage_events
        WHERE timestamp >= :sinceTimestamp
        """
    )
    suspend fun getPackagesOpenedSince(sinceTimestamp: Long): List<String>

    /** Prune old events to keep the DB lean (called nightly by WorkManager). */
    @Query("DELETE FROM app_usage_events WHERE timestamp < :cutoff")
    suspend fun deleteOlderThan(cutoff: Long)
}
