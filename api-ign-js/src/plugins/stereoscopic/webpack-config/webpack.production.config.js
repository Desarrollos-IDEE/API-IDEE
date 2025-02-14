const path = require('path');
const OptimizeCssAssetsPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopywebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
// const GenerateVersionPlugin = require('./GenerateVersionPlugin');

const PJSON_PATH = path.resolve(__dirname, '..', 'package.json');
const pjson = require(PJSON_PATH);

module.exports = {
  mode: 'production',
  entry: {
    'stereoscopic.ol.min': path.resolve(__dirname, '..', 'src', 'index.js'),
    [`stereoscopic-${pjson.version}.ol.min`]: path.resolve(__dirname, '..', 'src', 'index.js'),
  },
  output: {
    path: path.resolve(__dirname, '..', 'dist'),
    filename: '[name].js',
  },
  resolve: {
    alias: {
      templates: path.resolve(__dirname, '../src/templates'),
      assets: path.resolve(__dirname, '../src/facade/assets'),
      impl: path.resolve(__dirname, '../src/impl/ol/js'),
      facade: path.resolve(__dirname, '../src/facade/js'),
    },
    extensions: ['.wasm', '.mjs', '.js', '.json', '.css', '.hbs', '.html'],
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
        test: /\.css$/,
        loader: MiniCssExtractPlugin.loader,
        exclude: /node_modules/,
      }, {
        test: /\.css$/,
        loader: 'css-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        exclude: /node_modules/,
        type: 'asset/inline',
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
    // new GenerateVersionPlugin({
    //   version: pjson.version,
    //   regex: /([A-Za-z]+)(\..*)/,
    // }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new ESLintPlugin({
      extensions: ['js', 'jsx'],
      // files: 'src/**/*.js',
      exclude: ['**/node_modules/**', '/lib/', '/test/', '/dist/'],
    }),
    new CopywebpackPlugin({
      patterns: [
        {
          from: 'src/api.json',
          to: 'api.json',
        }, {
          from: 'TR3-pack',
          to: 'TR3-pack',
        },
        {
          from: 'src/assets/docStereo.pdf',
          to: 'images',
        },
      ],
    }),
  ],
  devtool: 'source-map',
};
