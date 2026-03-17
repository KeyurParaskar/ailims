package com.zendash.core.domain

import app.cash.turbine.test
import com.zendash.core.domain.model.AppInfo
import com.zendash.core.domain.model.SuggestionReason
import com.zendash.core.domain.repository.AppUsageRepository
import com.zendash.core.domain.repository.UsageEvent
import com.zendash.core.domain.usecase.GetContextualSuggestionsUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.DayOfWeek
import java.time.LocalDateTime

/**
 * Unit tests for [GetContextualSuggestionsUseCase].
 *
 * Verifies the scoring model surfaces the right apps at the right time.
 */
class GetContextualSuggestionsUseCaseTest {

    private val repository: AppUsageRepository = mockk()
    private val useCase = GetContextualSuggestionsUseCase(repository)

    private fun fakeApp(pkg: String, label: String) = AppInfo(
        packageName = pkg,
        activityName = "$pkg.MainActivity",
        label = label,
        icon = mockk(relaxed = true),
    )

    @Test
    fun `returns up to limit suggestions`() = runTest {
        val apps = (1..10).map { fakeApp("pkg$it", "App $it") }

        coEvery { repository.getUsageStats(any()) } returns emptyList()
        coEvery { repository.getRecentlyOpened(any()) } returns emptyList()

        val results = useCase(apps, limit = 6)
        assertEquals(6, results.size)
    }

    @Test
    fun `app used at current hour scores higher than others`() = runTest {
        val spotify = fakeApp("com.spotify", "Spotify")
        val chrome = fakeApp("com.chrome", "Chrome")
        val apps = listOf(spotify, chrome)

        val now = LocalDateTime.now()
        val hour = now.hour
        val day = now.dayOfWeek

        // Spotify has 8 opens at the current hour; Chrome has none
        val events = (1..8).map {
            UsageEvent("com.spotify", hour, day, System.currentTimeMillis() - it * 60_000L)
        }

        coEvery { repository.getUsageStats(any()) } returns events
        coEvery { repository.getRecentlyOpened(any()) } returns emptyList()

        val results = useCase(apps, now = now)
        assertEquals("com.spotify", results.first().app.packageName)
        assertEquals(SuggestionReason.TIME_OF_DAY, results.first().reason)
    }

    @Test
    fun `recently opened app gets boosted`() = runTest {
        val maps = fakeApp("com.maps", "Maps")
        val mail = fakeApp("com.mail", "Mail")
        val apps = listOf(maps, mail)

        coEvery { repository.getUsageStats(any()) } returns emptyList()
        coEvery { repository.getRecentlyOpened(any()) } returns listOf("com.maps")

        val results = useCase(apps)
        assertEquals("com.maps", results.first().app.packageName)
        assertEquals(SuggestionReason.RECENTLY_OPENED, results.first().reason)
    }

    @Test
    fun `hidden and system apps are excluded`() = runTest {
        val visible = fakeApp("com.visible", "Visible")
        val hidden = fakeApp("com.hidden", "Hidden").copy(isHidden = true)
        val system = fakeApp("com.system", "System").copy(isSystemApp = true)

        coEvery { repository.getUsageStats(any()) } returns emptyList()
        coEvery { repository.getRecentlyOpened(any()) } returns emptyList()

        val results = useCase(listOf(visible, hidden, system))
        assertTrue(results.all { it.app.packageName == "com.visible" })
    }

    @Test
    fun `scores are in descending order`() = runTest {
        val apps = (1..5).map { fakeApp("pkg$it", "App $it") }
        val events = listOf(
            UsageEvent("pkg3", 10, DayOfWeek.MONDAY, System.currentTimeMillis()),
            UsageEvent("pkg3", 10, DayOfWeek.MONDAY, System.currentTimeMillis() - 1000),
        )

        coEvery { repository.getUsageStats(any()) } returns events
        coEvery { repository.getRecentlyOpened(any()) } returns emptyList()

        val results = useCase(apps)
        val scores = results.map { it.score }
        assertEquals(scores, scores.sortedDescending())
    }
}
