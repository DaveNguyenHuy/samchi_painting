// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle the generated .wav sound effects as assets.
if (!config.resolver.assetExts.includes('wav')) {
  config.resolver.assetExts.push('wav');
}

// This project lives under a parent folder that also has a node_modules
// (~/node_modules holds an unrelated react copy). Anchor resolution and the
// watch scope to this project so Metro never reaches up into it.
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];
config.watchFolders = [__dirname];

module.exports = config;
