const path = require('path');
const webpack = require('webpack');

const pluginBanner = `/**
 * @name VerbaAi
 * @author syntex
 * @version 1.0.0
 * @description AI text enhancer using OpenAI.
 */
`;

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'VerbaAi.plugin.js',
    library: {
      type: 'commonjs2',   // This is key!
    },
  },
  mode: 'development',
  optimization: {
    minimize: false,
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: pluginBanner,
      raw: true,
      entryOnly: true
    })
  ]
};