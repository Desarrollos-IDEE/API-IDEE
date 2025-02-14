const path = require('path');
const OptimizeCssAssetsPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopywebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const webpack = require('webpack');

const PJSON_PATH = path.resolve(__dirname, '..', 'package.json');
const pjson = require(PJSON_PATH);

module.exports = {
  mode: 'production',
  // node: {
  //   fs: 'empty',
  // },
  entry: {
    [`${pjson.name}.ol.min`]: path.resolve(__dirname, '..', 'src', 'index.js'),
    [`${pjson.name}-${pjson.version}.ol.min`]: path.resolve(__dirname, '..', 'src', 'index.js'),
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
      templates: path.resolve(__dirname, '..', 'src', 'templates'),
      assets: path.resolve(__dirname, '..', 'src', 'facade', 'assets'),
      M: path.resolve(__dirname, '../src/facade/js'),
      impl: path.resolve(__dirname, '..', 'src', 'impl', 'ol', 'js'),
      'impl-assets': path.resolve(__dirname, '..', 'src', 'impl', 'ol', 'assets'),
      patches: path.resolve(__dirname, '../src/impl/ol/js/patches.js'),
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
        test: /\.css$/,
        loader: MiniCssExtractPlugin.loader,
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'css-loader',
        exclude: /node_modules/,

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
  ],
  devtool: 'source-map',
};
