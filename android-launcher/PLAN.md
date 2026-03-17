# Android Launcher — Project Plan
> **Working Title:** ZenDash Launcher
> **Inspired by:** ReZ Launcher (Nokia Z Launcher revival)
> **Goal:** Build a polished, gesture-first, AI-aware minimalist Android launcher that fixes every known gap in ReZ

---

## 1. Research Summary — What ReZ Does Well

ReZ Launcher (by perryOnCrack) is a modern revival of Nokia's discontinued Z Launcher. It is the best gesture-based launcher available:

| Feature | Description |
|--------|-------------|
| Scribble search | Draw any letter to find apps/contacts using ML Kit handwriting recognition |
| Predictive suggestions | Usage-based app ordering on the home screen |
| Widget row | Swipeable time/date/calendar/media widget at the top |
| Quick-launch dock | Long-press to pin app shortcuts to bottom dock |
| Work profile support | (partial — has a security exception bug) |
| Private Space (Android 15+) | Separate hidden-app space |
| Clone Apps (Android 15+) | Dual-app instances |
| Notification dots | On app icons |
| Icon packs | Third-party icon pack support |

**ReZ Stats:** ~43K downloads, 4/5 stars, built with Kotlin + Jetpack Compose + ML Kit, solo developer.

---

## 2. ReZ Pain Points — What We Fix

### Stability
- [ ] Frequent freezes/crashes reported
- [ ] Contact search breaks intermittently
- [ ] App does not launch past welcome screen on some Motorola devices

### Device Compatibility
- [ ] Broken on Xiaomi/Poco full-screen gesture nav
- [ ] No OEM-specific adaptation layer

### Missing Features (User Requests)
- [ ] **Alphabet quick-filter** — tap any letter to instantly list all apps starting with it
- [ ] **Authentic scribble physics** — stroke width varies with drawing speed (thick=fast, thin=slow)
- [ ] **Time-of-day contextual suggestions** — learns "I use Spotify at 8am on weekdays"
- [ ] **Web/global search gesture** — draw `?` or `@` to trigger web search
- [ ] **Google Discover / Feed integration** — left-swipe panel
- [ ] **Richer visual customization** — font choice, icon size, color themes, blur intensity
- [ ] **Screen-time / focus mode** — Mindful Delay before launching addictive apps
- [ ] **Quick-settings tiles** — toggle Wi-Fi, Bluetooth, DND from home screen

### Work Profile
- [ ] Fix "security exception" preventing work app toggle/search

---

## 3. Feature Roadmap

### Phase 1 — MVP (Sprint 1–3)
Core launcher that can replace the default launcher with no crashes.

- Home screen with widget area (time, date, next calendar event)
- Full app drawer — alphabetical, scrollable
- Scribble search using ML Kit (on-device, offline)
- Alphabet quick-filter bar (A–Z strip on the side, like Android contacts)
- App dock (pinned shortcuts, 1–5 slots)
- Notification dots
- Basic theme: Light / Dark / AMOLED
- Settings screen (permissions, theme, default apps)

### Phase 2 — Intelligence (Sprint 4–5)
Make the launcher learn user habits.

- **Usage-based app ranking** — most-used apps surface first at home
- **Time-of-day contextual suggestions** — "Good morning" vs "Good night" app sets
- **Day-of-week patterns** — Monday = work apps first; Saturday = leisure apps first
- **Scribble physics** — stroke width proportional to drawing velocity
- **Alias system** — assign custom scribble shortcuts to any app ("yt" → YouTube)

### Phase 3 — Ecosystem (Sprint 6–7)
Connect the launcher to the wider Android ecosystem.

- **Web search gesture** — draw `?` → opens default browser with search
- **Feed panel** — left-swipe to Google Discover (via Chrome Custom Tabs)
- **Quick-settings tiles** — Wi-Fi, Bluetooth, Flashlight, DND, Airplane Mode
- **Media controls** — persistent playback control widget
- **Work Profile full support** — toggle badge, proper exception handling
- **Private Space support** (Android 15+)

### Phase 4 — Polish & Power Users (Sprint 8–9)
- Icon pack support (Adaptive Icons + legacy)
- Custom font selector (Google Fonts)
- Per-app color accent
- Blur / frosted glass backgrounds
- Screen-time focus mode with Mindful Delay
- Backup & restore settings (Google Drive or local JSON)
- Tasker / Shortcut plugin support
- Widgets from third-party apps (standard AppWidget host)

---

## 4. Architecture

### Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | Kotlin | Industry standard for Android |
| UI | Jetpack Compose | Declarative, animation-friendly, same as ReZ |
| ML / Handwriting | Google ML Kit — Digital Ink Recognition | On-device, offline, multi-language |
| State management | ViewModel + StateFlow | Lifecycle-safe, reactive |
| DI | Hilt | Official, zero boilerplate |
| Local DB | Room | App usage history, aliases, focus rules |
| Prefs | DataStore (Proto) | Type-safe, async — replaces SharedPreferences |
| Gestures | Compose `pointerInput` + custom `Path` tracker | Full control of stroke physics |
| Background work | WorkManager | Usage aggregation, daily model update |
| Navigation | Compose Navigation | Single-activity |
| Testing | JUnit5, Turbine, Espresso, Compose UI Test | CI-ready |
| CI/CD | GitHub Actions | Lint, unit tests, instrumented tests, release build |
| Crash reporting | Firebase Crashlytics (opt-in) | Track the stability issues that plagued ReZ |
| Analytics | Firebase Analytics (opt-in, anonymous) | Understand which features are used |

### Module Structure

```
app/
├── core/
│   ├── data/           # Repositories, DataStore, Room DAOs
│   ├── domain/         # Use cases, models
│   ├── ui/             # Design system (colors, typography, components)
│   └── utils/          # Extensions, helpers
├── feature/
│   ├── home/           # Home screen, scribble canvas, widget row
│   ├── appdrawer/      # Full app list, search, alphabet strip
│   ├── dock/           # Pinned shortcuts
│   ├── settings/       # Preferences, theme, permissions
│   ├── feed/           # Left-swipe Google Discover panel
│   ├── focus/          # Screen-time / mindful delay
│   └── workprofile/    # Work/Private Space handling
└── app/                # Entry point, DI setup, manifest
```

### Key Design Decisions

1. **Single Activity** — all screens are Composable destinations inside one Activity. This is mandatory for a launcher (Android requires `ACTION_MAIN` + `CATEGORY_HOME` in the manifest).

2. **Canvas-based scribble** — We own the entire drawing pipeline using `Canvas` in Compose. This lets us:
   - Vary stroke width based on pointer velocity (the feature ReZ users asked for)
   - Record raw `Path` data for ML Kit submission
   - Animate letter trails with fade-out effects

3. **On-device ML only** — No data ever leaves the device. ML Kit Digital Ink Recognition runs fully offline. This is a privacy guarantee we can advertise.

4. **Crash isolation** — Every feature module is wrapped in a `runCatching` guard at the ViewModel layer. A crash in the feed panel must never take down the home screen.

5. **Launcher restart resilience** — The launcher registers a `BroadcastReceiver` for `ACTION_PACKAGE_ADDED/REMOVED/CHANGED` and rebuilds its app list reactively via a `StateFlow`, not a one-time load.

---

## 5. UX / Design Language

**Design Principles:**
1. **Zero clutter** — If it is not needed right now, hide it.
2. **Gesture first** — Every action reachable by gesture; taps are fallbacks.
3. **Physics feel** — Scribble strokes, swipe-to-dismiss, and animations obey physics (spring, velocity).
4. **Readable at a glance** — Large clock, legible font, high contrast modes available.
5. **Dark by default** — AMOLED black saves battery; light mode for accessibility.

**Home Screen Anatomy:**
```
┌─────────────────────────────┐
│  🕐 8:42 AM                  │  ← Tap: full clock app
│  Tue, Mar 17 · 2 events     │  ← Tap: Calendar
│  [──────────────────────]   │  ← Media controls (if playing)
│                             │
│  [Frequently used apps]     │  ← Contextual, top 4–6
│                             │
│  ╔══ SCRIBBLE ANYWHERE ═══╗ │  ← Ghost text hint (fades on first use)
│  ║                        ║ │
│  ║    (stroke canvas)     ║ │
│  ║                        ║ │
│  ╚════════════════════════╝ │
│                             │
│  [App  ] [App  ] [App  ]   │  ← Dock (1–5 pinned apps)
└─────────────────────────────┘
```

**App Drawer:**
- Full-screen overlay, springs up from scribble
- Alphabetical list on left, alphabet strip on right
- Tap any letter in strip → jump to that section instantly
- Scribble continues to work even in the drawer

**Scribble Canvas (core differentiation):**
- Velocity-sensitive stroke: fast drag = wider stroke, slow = thin hairline
- Rainbow of ink colors (user-configurable, default: white on dark)
- Trail fades out after 800ms with a dissolve animation
- ML Kit runs as a debounced coroutine (200ms after last stroke point)
- Results appear in a card above the dock with app icon + name

---

## 6. Comparison Table — ZenDash vs ReZ

| Feature | ReZ Launcher | ZenDash Launcher |
|---------|-------------|-----------------|
| Scribble search | ✅ | ✅ (+ velocity physics) |
| Alphabet strip | ❌ | ✅ |
| Time-based suggestions | ❌ (basic usage) | ✅ (time + day patterns) |
| Web search gesture | ❌ | ✅ (`?` scribble) |
| Google Discover panel | ❌ | ✅ (left swipe) |
| Quick-settings tiles | ❌ | ✅ |
| Work Profile support | Partial (bug) | ✅ (full) |
| Mindful delay / Focus | ❌ | ✅ |
| Crash isolation | ❌ (entire app crashes) | ✅ (per-feature guards) |
| OEM gesture nav compat | ❌ (Xiaomi broken) | ✅ (WindowInsets API) |
| Icon packs | ✅ | ✅ |
| Open source | ❌ (closed source) | ✅ (MIT license) |
| CI/CD pipeline | ❌ | ✅ (GitHub Actions) |
| Backup/restore | ❌ | ✅ |

---

## 7. Directory Layout (Initial Scaffold)

```
zendash-launcher/
├── .github/
│   └── workflows/
│       ├── ci.yml            # Lint + unit tests on every PR
│       └── release.yml       # Build signed APK on tag push
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/com/zendash/launcher/
│   │   │   │   └── MainActivity.kt
│   │   │   └── res/
│   │   ├── test/
│   │   └── androidTest/
│   └── build.gradle.kts
├── core/
│   ├── data/
│   ├── domain/
│   └── ui/
├── feature/
│   ├── home/
│   ├── appdrawer/
│   ├── dock/
│   ├── settings/
│   ├── feed/
│   ├── focus/
│   └── workprofile/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradlew
├── gradlew.bat
└── README.md
```

---

## 8. Sprint 1 Deliverables (First 2 Weeks)

1. Android project scaffolded with Hilt, Compose, Room, DataStore
2. Manifest configured as a launcher (`ACTION_MAIN` + `CATEGORY_HOME`)
3. Home screen with clock widget + date
4. App list loaded via `PackageManager` + reactive updates on install/uninstall
5. Basic scribble canvas (no ML yet) — just renders strokes with velocity-based width
6. Simple text search fallback (filter app list by scribble characters)
7. App dock (bottom bar with up to 5 pinned apps, persist via DataStore)
8. Light/Dark theme toggle
9. CI pipeline: lint + unit tests pass on every PR

---

## 9. Open Questions / Decisions Needed

| # | Question | Default Decision |
|---|---------|-----------------|
| 1 | App name — "ZenDash" or other? | **Open for input** |
| 2 | Monetization? | Free + open source (MIT). Optional tip jar via Play Billing |
| 3 | ML Kit language pack download strategy | Download on first launch; offline after that |
| 4 | Google Discover integration approach | `WebView` with Discover URL vs `androidx.browser` Custom Tab |
| 5 | Minimum Android version | Android 9 (API 28) — matches ReZ |
| 6 | Target Android version | Android 15 (API 35) |
| 7 | Crash reporting opt-in default | Opt-out by default (privacy-first) |

---

## 10. References & Prior Art

- [ReZ Launcher — Google Play](https://play.google.com/store/apps/details?id=com.perryoncrack.rez)
- [ReZ Launcher — Developer Blog](https://www.perryoncrack.me/apps/rez)
- [focus_launcher — open source minimalist launcher](https://github.com/mslalith/focus_launcher)
- [Minute-Launcher — digital wellbeing launcher](https://github.com/simonalveteg/Minute-Launcher)
- [Niagara Launcher — best-in-class ergonomics](https://www.tomsguide.com/round-up/best-android-launchers)
- [ML Kit Digital Ink Recognition](https://developers.google.com/ml-kit/vision/digital-ink-recognition)
- [Jetpack Compose samples](https://github.com/android/compose-samples)
