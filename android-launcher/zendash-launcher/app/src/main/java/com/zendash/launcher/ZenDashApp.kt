package com.zendash.launcher

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Application entry point. Hilt generates the component graph from here.
 *
 * Firebase Crashlytics and Analytics are initialised lazily and only when
 * the user has explicitly opted in (privacy-first, unlike ReZ Launcher
 * which has no crash reporting at all).
 */
@HiltAndroidApp
class ZenDashApp : Application()
