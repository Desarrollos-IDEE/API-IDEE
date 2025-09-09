const path = require('path');
const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

let pathUrl = null;
const nameArgIndex = process.argv[process.argv.length - 1].indexOf('--name=CP-');

if (nameArgIndex === -1) {
  pathUrl = path.resolve(__dirname, '..', 'test', 'test.js');
} else {
  const valueArgv = process.argv[process.argv.length - 1];
  const name = valueArgv.replace('--name=', '');
  pathUrl = path.resolve(__dirname, '..', 'test', 'CP', name);
}

module.exports = {
  mode: 'development',
  entry: pathUrl,
  resolve: {
    alias: {
      templates: path.resolve(__dirname, '../src/templates'),
      assets: path.resolve(__dirname, '../src/facade/assets'),
      impl: path.resolve(__dirname, '../src/impl/ol/js'),
      facade: path.resolve(__dirname, '../src/facade/js'),
    },
    extensions: ['.wasm', '.mjs', '.js', '.json', '.css', '.hbs', '.html'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules\/(?!ol)|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: [/\.hbs$/, /\.html$/],
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: 'style-loader',
            options: {
              // insert: 'head',
              injectType: 'singletonStyleTag',
            },
          },
          'css-loader',
        ],
        exclude: [/node_modules/],
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        exclude: /node_modules/,
        type: 'asset/inline',
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ESLintPlugin({
      // extensions: ['js', 'jsx'],
      files: 'src/**/*.js',
      exclude: ['**/node_modules/**', '/lib/', '/test/', '/dist/'],
    }),
  ],
  devServer: {
    // https: true,
    hot: true,
    // open: true,
    port: 6123,
    open: 'test/dev.html',
    static: {
      directory: path.join(__dirname, '/../'),
    },
  },
  watchOptions: {
    poll: 1000,
  },
  devtool: 'eval-source-map',
};
