const path = require('path');
const OptimizeCssAssetsPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopywebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');

const PJSON_PATH = path.resolve(__dirname, '..', 'package.json');
const pjson = require(PJSON_PATH);

const cesiumSource = 'node_modules/cesium/Build/Cesium';

module.exports = {
  mode: 'production',
  // node: {
  //   fs: 'empty',
  // },
  entry: {
    [`${pjson.name}.cesium.min`]: path.resolve(__dirname, '..', 'src', 'index-cesium.js'),
    [`${pjson.name}-${pjson.version}.cesium.min`]: path.resolve(__dirname, '..', 'src', 'index-cesium.js'),
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: 'js/[name].js',
    chunkFilename: 'chunk.js',
  },
  resolve: {
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js',
      proj4: 'proj4/dist/proj4.js',
      cesium: path.resolve('node_modules/cesium/Source/Cesium'),
      templates: path.resolve(__dirname, '..', 'src', 'templates'),
      assets: path.resolve(__dirname, '..', 'src', 'facade', 'assets'),
      M: path.resolve(__dirname, '../src/facade/js'),
      IDEE: path.resolve(__dirname, '../src/facade/js'),
      impl: path.resolve(__dirname, '..', 'src', 'impl', 'cesium', 'js'),
      'impl-assets': path.resolve(__dirname, '..', 'src', 'impl', 'cesium', 'assets'),
    },
    extensions: ['.wasm', '.mjs', '.js', '.json', '.css', '.hbs', '.html', '.jpg'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      'buffer': require.resolve('buffer/'),
    },
  },
  module: {
    parser: {
      javascript: {
        dynamicImportMode: 'eager',
      },
    },
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules\/(?!(cesium|@cesium))|bower_components)/,
      },
      {
        test: [/\.hbs$/, /\.html$/],
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        loader: MiniCssExtractPlugin.loader,
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'css-loader',
        exclude: /node_modules\/(?!(cesium|@cesium))/,

      },
      {
        test: /\.(woff|woff2|eot|ttf|svg|jpg)$/,
        exclude: /node_modules/,
        type: 'asset/inline',
      },
      {
        test: /node_modules\/@geoblocks\/.*\.m?js/,
        type: 'javascript/auto',
      },
      {
        test: /node_modules\/@geoblocks\/.*\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  optimization: {
    emitOnErrors: false,
    minimizer: [
      new OptimizeCssAssetsPlugin(),
      new TerserPlugin({
        terserOptions: {
          sourceMap: true,
        },
      }),
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new MiniCssExtractPlugin({
      filename: 'assets/css/[name].css',
    }),
    new ESLintPlugin({
      extensions: ['js', 'jsx'],
      // files: 'src/**/*',
      exclude: ['**/node_modules/**', '/lib/', '/test/', '/dist/'],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'src/configuration.js',
          to: `filter/configuration-${pjson.version}.js`,
        },
      ],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'src/configuration.js',
          to: 'filter/configuration.js',
        },
      ],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'src/facade/assets/images',
          to: 'assets/images',
        },
      ],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'src/facade/assets/img',
          to: 'assets/img',
        },
      ],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'src/facade/assets/svg',
          to: 'assets/svg',
        },
      ],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'node_modules/sql.js/dist/sql-wasm.wasm',
          to: 'wasm/',
        },
      ],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: path.join(cesiumSource, 'Workers'),
          to: 'cesium/Workers',
        },
        {
          from: path.join(cesiumSource, 'ThirdParty'),
          to: 'cesium/ThirdParty',
        },
        {
          from: path.join(cesiumSource, 'Assets'),
          to: 'cesium/Assets',
        },
        {
          from: path.join(cesiumSource, 'Widgets'),
          to: 'cesium/Widgets',
        },
      ],
    }),
    new webpack.DefinePlugin({
      // Define relative base path in cesium for loading assets
      CESIUM_BASE_URL: JSON.stringify('./cesium'),
    }),
  ],
  devtool: 'source-map',
};
