// Jest config. Because even code written on a bus deserves tests.
const path = require('path');

module.exports = {
  preset: 'jest-expo/android',
  rootDir: __dirname,
  roots: ['<rootDir>'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop|@timetorelax/.*)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleDirectories: ['node_modules', path.resolve(__dirname, '../../node_modules')],
};
