package com.zendash.core.data.di

import android.content.Context
import android.content.pm.PackageManager
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.zendash.core.data.db.AppAliasDao
import com.zendash.core.data.db.AppUsageDao
import com.zendash.core.data.db.HiddenAppDao
import com.zendash.core.data.db.ZenDashDatabase
import com.zendash.core.data.repository.AppListNotifier
import com.zendash.core.data.repository.AppUsageRepositoryImpl
import com.zendash.core.domain.repository.AppUsageRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "zendash_prefs")

@Module
@InstallIn(SingletonComponent::class)
abstract class DataModule {

    @Binds
    @Singleton
    abstract fun bindAppUsageRepository(
        impl: AppUsageRepositoryImpl,
    ): AppUsageRepository

    companion object {

        @Provides
        @Singleton
        fun provideDatabase(@ApplicationContext context: Context): ZenDashDatabase =
            Room.databaseBuilder(context, ZenDashDatabase::class.java, ZenDashDatabase.DATABASE_NAME)
                // Add migrations here as the schema evolves — never use
                // fallbackToDestructiveMigration in production.
                .build()

        @Provides
        fun provideAppUsageDao(db: ZenDashDatabase): AppUsageDao = db.appUsageDao()

        @Provides
        fun provideAppAliasDao(db: ZenDashDatabase): AppAliasDao = db.appAliasDao()

        @Provides
        fun provideHiddenAppDao(db: ZenDashDatabase): HiddenAppDao = db.hiddenAppDao()

        @Provides
        @Singleton
        fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
            context.dataStore

        @Provides
        fun providePackageManager(@ApplicationContext context: Context): PackageManager =
            context.packageManager
    }
}
