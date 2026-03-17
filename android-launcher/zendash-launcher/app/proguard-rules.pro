# ZenDash Launcher ProGuard rules

# Keep ML Kit classes
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep Room entities and DAOs
-keep class com.zendash.core.data.db.** { *; }

# Keep Hilt-generated components
-keep class dagger.hilt.** { *; }
-keep @dagger.hilt.android.lifecycle.HiltViewModel class * { *; }

# Keep data classes used by DataStore
-keep class com.zendash.core.data.datastore.** { *; }

# Kotlin coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
