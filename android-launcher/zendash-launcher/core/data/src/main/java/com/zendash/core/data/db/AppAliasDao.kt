package com.zendash.core.data.db

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface AppAliasDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(alias: AppAliasEntity)

    @Delete
    suspend fun delete(alias: AppAliasEntity)

    @Query("SELECT * FROM app_aliases WHERE packageName = :packageName")
    suspend fun getAliasesForPackage(packageName: String): List<AppAliasEntity>

    /** Returns all packages whose alias matches the query (case-insensitive prefix). */
    @Query(
        """
        SELECT DISTINCT packageName FROM app_aliases
        WHERE lower(alias) LIKE lower(:prefix) || '%'
        """
    )
    suspend fun findPackagesByAlias(prefix: String): List<String>

    @Query("DELETE FROM app_aliases WHERE packageName = :packageName")
    suspend fun deleteAllForPackage(packageName: String)
}
