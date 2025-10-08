# Snowboard Tracker App

A React Native mobile application for tracking snowboarding sessions, recording statistics, and analyzing performance on the slopes.

## Features

- 📍 GPS tracking of snowboarding runs
- 📊 Session statistics (distance, speed, elevation, duration)
- 🏔️ Resort and slope tracking
- 📱 Cross-platform (iOS and Android)
- 🎯 Personal performance analytics
- 📈 Progress tracking over time

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for navigation
- **GPS/Location Services** for tracking
- **AsyncStorage** for local data persistence

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd snowboard-tracker-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on specific platforms:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

## Project Structure

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

## Development

This project uses Expo for React Native development, which provides:
- Fast development workflow
- Easy testing on physical devices
- Built-in components and APIs
- Simplified build and deployment process

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.