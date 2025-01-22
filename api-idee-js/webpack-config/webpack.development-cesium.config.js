const path = require('path');
const fse = require('fs-extra');
const webpack = require('webpack');
const argv = require('yargs').argv;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const AllowMutateEsmExports = require('./AllowMutateEsmExportsPlugin');

const cesiumSource = 'node_modules/cesium/Build/Cesium';

const testName = argv.name;
// const coremin = argv['core-min']; // no-unused-vars
if (testName === undefined) {
  const error = new Error('Test name is undefined. Use: npm start -- --name=<test-name>');
  throw error;
}
const testPath = path.resolve(__dirname, '..', 'test', 'development', `${testName}.js`);
const testHTMLPath = path.resolve(__dirname, '..', 'test', 'development', `${testName}.html`);

try {
  fse.statSync(testPath).isFile();
} catch (e) {
  const error = new Error('Javascript test does not exist. Be sure to write the test name correctly.');
  throw error;
}

try {
  fse.statSync(testHTMLPath).isFile();
} catch (e) {
  const error = new Error('HTML test does not exist. Be sure to name the html test as the js test.');
  throw error;
}

const config = path.resolve(__dirname, '../test/configuration_filtered.js');
const entrypoint = {};
entrypoint[testName] = testPath;
entrypoint.config = config;

module.exports = {
  mode: 'development',
  // node: {
  //   fs: 'empty',
  // },
  entry: entrypoint,
  output: {
    filename: '[name].js',
  },
  resolve: {
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js',
      proj4: 'proj4/dist/proj4.js',
      templates: path.resolve(__dirname, '../src/templates'),
      assets: path.resolve(__dirname, '../src/facade/assets'),
      M: path.resolve(__dirname, '../src/facade/js'),
      IDEE: path.resolve(__dirname, '../src/facade/js'),
      impl: path.resolve(__dirname, '../src/impl/cesium/js'),
      configuration: path.resolve(__dirname, '../test/configuration_filtered'),
      'impl-assets': path.resolve(__dirname, '../src/impl/cesium/assets'),
      plugins: path.resolve(__dirname, '../src/plugins'),
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
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules\/(?!(cesium|@cesium))|bower_components)/,
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
        exclude: [/node_modules\/(?!(cesium|@cesium))/],
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
  plugins: [
    new AllowMutateEsmExports(),
    new webpack.HotModuleReplacementPlugin(),
    new ESLintPlugin({
      // extensions: ['js', 'jsx'],
      files: 'src/**/*.js',
      exclude: ['**/node_modules/**', '/lib/', '/test/', '/dist/'],
    }),
    new CopyWebpackPlugin({
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
      CESIUM_BASE_URL: JSON.stringify('/cesium'),
    }),
  ],
  devServer: {
    // https: true,
    // hot: true,
    // host: '0.0.0.0',
    // open: true,
    // port: 6123,
    open: `test/development/${testName}.html`,
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
  devtool: 'eval-source-map',
};
