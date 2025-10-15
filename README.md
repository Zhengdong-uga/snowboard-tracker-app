# Snowboard Tracker App

A cross‑platform React Native app (Expo) for tracking snowboarding sessions with live GPS, rich stats, and a clean, Nike Run–inspired UI.

## What’s new (this update)
- Redesigned Snowboarding tab with Nike Run–style layout: quick stats, actions row, and a large “LET’S DO IT” CTA.
- Live GPS follow on map with user marker when running a Development Build.
- Live Tracking screen improved: robust error handling, better altitude logic, and session save flow.
- Fixed multiple TypeScript/runtime issues and added @expo/vector-icons and gesture-handler.

## Features
- 📍 Live GPS tracking of snowboarding runs
- 📊 Session stats: distance, duration, current/avg/max speed, elevation gain/loss, vertical, runs
- 🏔️ Per‑session route saved locally for details view
- 📱 iOS and Android via Expo

## Screens
- Snowboarding (Start): map preview, quick stats from last session, Settings/Open Goal row, big start CTA
- Live Tracking: real‑time stats, pause/resume, stop and save
- Session Details: summary and route info (visualization placeholder)

## Tech Stack
- Expo (React Native 0.81 / Expo SDK 54)
- TypeScript
- React Navigation
- expo-location, expo-maps, AsyncStorage

## Getting Started
### Install
```bash
npm install
```

### Run (Expo Go)
```bash
npm start
```
Note: Expo Go cannot load native expo-maps. The Snowboarding tab shows a safe placeholder.

### Full map (Development Build)
To enable the live Apple/Google Maps view:
```bash
npx expo install expo-dev-client
# iOS	npx expo run:ios
# Android	npx expo run:android
# then
expo start --dev-client
```

### Platform shortcuts
```bash
npm run ios
npm run android
npm run web
```

## Project Structure
```
src/
├── components/
├── screens/
├── services/
├── utils/
├── types/
└── navigation/
```

## Roadmap
- Background tracking and auto‑pause
- Route map on Session Details with speed heatmap
- Goals/workouts and gear management
- Sync/export sessions

## Contributing
1. Create a feature branch from main
2. Make changes and add tests if applicable
3. Open a PR with a clear description and screenshots

## License
MIT
