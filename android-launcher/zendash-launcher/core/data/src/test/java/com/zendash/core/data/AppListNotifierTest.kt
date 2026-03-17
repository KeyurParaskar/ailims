package com.zendash.core.data

import app.cash.turbine.test
import com.zendash.core.data.repository.AppListNotifier
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class AppListNotifierTest {

    @Test
    fun `notifyChanged emits on the shared flow`() = runTest {
        val notifier = AppListNotifier()

        notifier.events.test {
            notifier.notifyChanged()
            awaitItem()   // should receive exactly one Unit emission
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `multiple notifications are all delivered`() = runTest {
        val notifier = AppListNotifier()

        notifier.events.test {
            repeat(3) { notifier.notifyChanged() }
            assertEquals(Unit, awaitItem())
            assertEquals(Unit, awaitItem())
            assertEquals(Unit, awaitItem())
            cancelAndIgnoreRemainingEvents()
        }
    }
}
