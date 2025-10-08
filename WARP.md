# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a **React Native mobile application** for tracking snowboarding sessions, built with **Expo**. The app is designed to record GPS tracking, session statistics, and performance analytics for snowboarders across iOS, Android, and web platforms.

## Architecture

### Core Stack
- **React Native 0.81.4** with **Expo ~54.0.12**
- **React 19.1.0** (latest version)
- **Expo managed workflow** with new architecture enabled
- Cross-platform targeting (iOS, Android, Web)

### Project Structure
```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # API services and external integrations
├── utils/          # Utility functions  
├── types/          # TypeScript type definitions
├── hooks/          # Custom React hooks
└── navigation/     # Navigation configuration
```

The project follows a feature-based architecture with clear separation of concerns. Each directory has an `index.ts` barrel export file for clean imports.

### Key Features (Planned)
- GPS tracking of snowboarding runs
- Session statistics (distance, speed, elevation, duration)
- Resort and slope tracking
- Cross-platform compatibility
- Personal performance analytics
- Progress tracking over time

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server (opens Expo Dev Tools)
npm start

# Run on specific platforms
npm run ios        # iOS Simulator
npm run android    # Android Emulator  
npm run web        # Web browser
```

### Platform-Specific Development
```bash
# Start with specific platform target
expo start --ios
expo start --android 
expo start --web

# Clear cache if needed
expo start --clear
```

## Development Workflow

### Current State
The app is in **early development stage** - the main `App.js` currently shows the default Expo template screen. The `src/` directory structure is established but components are not yet implemented.

### Key Considerations
- Uses **Expo managed workflow** - avoid ejecting unless absolutely necessary
- **New Architecture enabled** (`newArchEnabled: true` in app.json)
- **Edge-to-edge enabled** on Android for modern UI
- TypeScript should be added for the type definitions in `src/types/`

### Location Services
Since this is a GPS tracking app, location permissions and services will be critical:
- Use `expo-location` for GPS tracking
- Handle location permissions properly on both platforms
- Consider background location tracking for active sessions

### Navigation Structure
The app will likely need:
- Tab navigation for main sections (Sessions, Stats, Profile)
- Stack navigation for detailed views
- Modal stacks for session recording

### Testing Physical Devices
GPS functionality requires testing on physical devices since simulators have limited location capabilities:
```bash
# Use Expo Go app for quick testing
npm start
# Scan QR code with Expo Go (iOS) or Camera (Android)
```

## Platform-Specific Notes

### iOS Development
- Requires Xcode and iOS Simulator
- Location permissions: `NSLocationWhenInUseUsageDescription` needed
- Background location: Additional permissions required

### Android Development  
- Requires Android Studio and emulator/device
- Location permissions in `AndroidManifest.xml`
- Edge-to-edge UI enabled - consider status bar handling

### Web Development
- Limited GPS functionality compared to mobile
- Good for UI development and testing non-location features

## File Naming & Import Conventions
- Use barrel exports (`index.ts`) in each `src/` subdirectory
- Prefer named exports over default exports for consistency
- Follow React Native/Expo conventions for file naming

## Performance Considerations
- GPS tracking can be battery-intensive - implement efficient location updates
- Consider data storage strategy for session history (AsyncStorage vs external DB)
- Optimize for offline functionality during mountain trips