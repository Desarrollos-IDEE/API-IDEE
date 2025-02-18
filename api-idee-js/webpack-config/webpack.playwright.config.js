const path = require('path');

module.exports = {
  mode: 'development',
  devServer: {
    host: 'localhost',
    port: 8081,
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
