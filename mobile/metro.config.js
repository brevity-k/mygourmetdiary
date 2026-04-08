const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages from (hoisted node_modules)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Force react/react-native to resolve from mobile's node_modules
// to avoid version mismatch with web's hoisted versions
const mobileModules = path.resolve(projectRoot, 'node_modules');
config.resolver.extraNodeModules = {
  react: path.resolve(mobileModules, 'react'),
  'react-native': path.resolve(mobileModules, 'react-native'),
  'react-native-worklets': path.resolve(mobileModules, 'react-native-worklets'),
};

// Block root node_modules/react from being resolved
// (web uses React 19.2.4, mobile needs React 19.1.0)
const rootReact = path.resolve(monorepoRoot, 'node_modules', 'react');
const rootReactNative = path.resolve(monorepoRoot, 'node_modules', 'react-native');
config.resolver.blockList = [
  new RegExp(`^${rootReact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*$`),
  new RegExp(`^${rootReactNative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/.*$`),
];

module.exports = config;
