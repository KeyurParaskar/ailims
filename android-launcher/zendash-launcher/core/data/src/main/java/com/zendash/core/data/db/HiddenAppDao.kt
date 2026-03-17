package com.zendash.core.data.db

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface HiddenAppDao {

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun hide(app: HiddenAppEntity)

    @Delete
    suspend fun unhide(app: HiddenAppEntity)

    @Query("SELECT packageName FROM hidden_apps")
    fun observeHiddenPackages(): Flow<List<String>>

    @Query("SELECT EXISTS(SELECT 1 FROM hidden_apps WHERE packageName = :packageName)")
    suspend fun isHidden(packageName: String): Boolean
}
