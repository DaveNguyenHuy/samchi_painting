module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-adds the react-native-worklets plugin
    // (needed by react-native-reanimated 4) when the package is installed.
    presets: ['babel-preset-expo'],
  };
};
