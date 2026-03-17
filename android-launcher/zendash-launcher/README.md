# ZenDash Launcher

> A gesture-first, AI-aware minimalist Android launcher — inspired by and improved over [ReZ Launcher](https://play.google.com/store/apps/details?id=com.perryoncrack.rez).

---

## Why ZenDash?

ReZ Launcher revived the beloved Nokia Z Launcher concept and earned a loyal following. But after analysing hundreds of user reviews and Play Store feedback, several clear gaps remain:

| Pain Point (ReZ) | ZenDash Solution |
|-----------------|-----------------|
| App crashes/freezes | Per-feature crash isolation — home screen never goes down |
| Broken on Xiaomi/Poco gesture nav | Full `WindowInsets` API implementation |
| No alphabet strip in drawer | A–Z quick-filter strip (tap letter → jump to section) |
| Basic usage suggestions only | Time-of-day + day-of-week contextual scoring |
| No web search gesture | Draw `?` → web search |
| No Google Discover panel | Left-swipe opens Discover in Custom Tab |
| Thin fixed-width scribble | Velocity-sensitive stroke width (fast=wide, slow=thin) |
| No focus/mindful mode | Mindful Delay before launching habit apps |
| Work profile bug | Full work profile + Private Space support |
| Closed source | MIT licensed, fully open source |

---

## Features

### Phase 1 (MVP — in progress)
- [x] Project scaffold (Hilt, Compose, Room, DataStore)
- [x] Launcher manifest (replaces default home screen)
- [x] Clock / date / calendar widget
- [x] Velocity-sensitive scribble canvas
- [x] Contextual app suggestions (time + day scoring)
- [x] Full app drawer with A–Z alphabet strip
- [x] App dock (up to 5 pinned apps)
- [x] Light / Dark / AMOLED themes
- [x] GitHub Actions CI (lint + tests + APK build)

### Phase 2 (Intelligence)
- [ ] ML Kit Digital Ink Recognition (full handwriting → app search)
- [ ] App alias system ("yt" → YouTube)
- [ ] Time-of-day contextual model refinement
- [ ] Scribble physics (velocity → stroke width) — canvas ready

### Phase 3 (Ecosystem)
- [ ] Web search gesture (`?` scribble)
- [ ] Google Discover left-swipe panel
- [ ] Quick-settings tiles (Wi-Fi, BT, Flashlight, DND)
- [ ] Full work profile + Private Space support

### Phase 4 (Polish)
- [ ] Icon pack support
- [ ] Custom font selector
- [ ] Mindful Delay focus mode
- [ ] Backup / restore

---

## Tech Stack

| Layer | Library |
|-------|---------|
| Language | Kotlin |
| UI | Jetpack Compose |
| Handwriting ML | Google ML Kit Digital Ink Recognition |
| DI | Hilt |
| DB | Room |
| Prefs | DataStore |
| Navigation | Compose Navigation |
| Image loading | Coil |
| CI/CD | GitHub Actions |

---

## Project Structure

```
app/                    — Entry point (MainActivity, ZenDashApp, NavGraph)
core/
  data/                 — Repositories, Room, DataStore
  domain/               — Models, use cases, repository interfaces
  ui/                   — Design system (theme, colors, typography, components)
feature/
  home/                 — Home screen, scribble canvas, clock widget, suggestion row
  appdrawer/            — Full app list, A–Z strip, sticky headers
  dock/                 — Pinned app shortcuts
  settings/             — Preferences, permissions, theme picker
  feed/                 — Google Discover panel (Phase 3)
  focus/                — Mindful Delay / screen-time tools (Phase 4)
  workprofile/          — Work Profile + Private Space (Phase 3)
```

---

## Getting Started

### Prerequisites
- Android Studio Ladybug (2024.2.1) or newer
- JDK 17
- Android SDK 35

### Build
```bash
git clone https://github.com/your-org/zendash-launcher.git
cd zendash-launcher
./gradlew assembleDebug
```

### Set as Default Launcher
1. Install the debug APK on your device
2. Press the Home button
3. Select "ZenDash Launcher" → "Always"

---

## Contributing

PRs are welcome. Please open an issue first for large changes.

- Branch from `develop`
- Follow the existing code style (Kotlin + Compose conventions)
- All new features need unit tests

---

## License

MIT © ZenDash Contributors
