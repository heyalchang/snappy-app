const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Simple alias-based fix for React Native web compatibility
config.resolver.alias = {
  'react-native': 'react-native-web',
};

module.exports = config;