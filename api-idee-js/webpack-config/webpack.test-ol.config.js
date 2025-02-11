const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  resolve: {
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js',
      proj4: 'proj4/dist/proj4.js',
      templates: path.resolve(__dirname, '../src/templates'),
      assets: path.resolve(__dirname, '../src/facade/assets'),
      M: path.resolve(__dirname, '../src/facade/js'),
      IDEE: path.resolve(__dirname, '../src/facade/js'),
      impl: path.resolve(__dirname, '../src/impl/ol/js'),
      configuration: path.resolve(__dirname, '../test/configuration_filtered'),
      'impl-assets': path.resolve(__dirname, '../src/impl/ol/assets'),
      plugins: path.resolve(__dirname, '../src/plugins'),
      patches: path.resolve(__dirname, '../src/impl/ol/js/patches_dev.js'),
    },
    extensions: ['.wasm', '.mjs', '.js', '.json', '.css', '.hbs', '.html', '.jpg'],
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '/../'),
      watch: {
        ignored: '**/node_modules',
        usePolling: false,
      },
    },
    compress: true,
    port: 8081,
    hot: true,
    historyApiFallback: true,
  },
};
