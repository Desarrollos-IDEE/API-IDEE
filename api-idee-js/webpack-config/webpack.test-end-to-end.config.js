const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const source = 'dist';

module.exports = {
  mode: 'development',
  output: {
    filename: '[name].js',
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: source,
          to: '',
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'test/configuration_filtered.js',
          to: 'filter',
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, '/../'),
      watch: {
        ignored: '**/node_modules',
        usePolling: false,
      },
    },
  },
  watchOptions: {
    poll: 1000,
  },
  devtool: 'source-map',
};
