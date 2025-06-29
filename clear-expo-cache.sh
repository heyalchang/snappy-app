#!/bin/bash

echo "🧹 Clearing all Expo and Metro caches..."

# Kill any running Metro bundler processes
echo "Stopping Metro bundler processes..."
pkill -f "metro" 2>/dev/null || true
pkill -f "react-native" 2>/dev/null || true

# Clear Expo cache
echo "Clearing Expo cache..."
rm -rf .expo
rm -rf ~/.expo

# Clear Metro cache
echo "Clearing Metro cache..."
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -rf $TMPDIR/react-*

# Clear Watchman cache
echo "Clearing Watchman cache..."
watchman watch-del-all 2>/dev/null || true

# Clear React Native packager cache
echo "Clearing React Native packager cache..."
rm -rf $TMPDIR/react-native-packager-cache-*

# Clear yarn/npm cache (optional - uncomment if needed)
# echo "Clearing package manager cache..."
# npm cache clean --force 2>/dev/null || true
# yarn cache clean 2>/dev/null || true

echo "✅ All caches cleared!"
echo ""
echo "To run multiple Expo projects simultaneously:"
echo "  Project 1: npx expo start --port 19000"
echo "  Project 2: npx expo start --port 19001"
echo ""
echo "Or use different Metro ports:"
echo "  Project 1: npx expo start --port 8081"
echo "  Project 2: npx expo start --port 8082"