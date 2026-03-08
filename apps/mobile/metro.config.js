// Metro config for the monorepo.
// Teaching Metro that packages/shared exists was harder than expected.
// If you're reading this and it works: you're welcome.
// If it doesn't: check node_modules symlinks first.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// The monorepo root is two directories up from apps/mobile
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Watch the shared package so Metro picks up changes
config.watchFolders = [monorepoRoot];

// Ensure Metro resolves node_modules from both the app and the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = withNativeWind(config, { input: './global.css' });
