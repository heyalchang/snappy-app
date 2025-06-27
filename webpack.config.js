const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve.alias['react-native$'] = 'react-native-web';

  config.module.rules.push({
    test: /\.m?js$|\.tsx?$|\.jsx?$/,
    include: /node_modules\/(@react-navigation|react-native-color-matrix-image-filters|expo-camera|expo-video|expo-media-library)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
      },
    },
  });

  return config;
};