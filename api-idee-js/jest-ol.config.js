module.exports = {
  silent: true,
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['./test/unit_tests/jest/jest-setup.js'],
  transformIgnorePatterns: [
    '/node_modules/(?!ol/|quick-lru|geotiff|@geoblocks|jsts)',
    //   '/node_modules/(?!(cesium|@cesium))',
  ],
  testPathIgnorePatterns: ['./playwright/', './src/plugins/'],
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css',
    '^.+\\.html$': '<rootDir>/transforms/htmlTransform.js',
  },
  moduleNameMapper: {
    '^assets/(.*)$': '<rootDir>/__mocks__/assetMock.js',
    '^impl-assets/(.*)$': '<rootDir>/__mocks__/assetMock.js',
    '^templates/(.*)$': '<rootDir>/src/templates/$1.html',
    '^handlebars$': '<rootDir>/node_modules/handlebars/dist/handlebars.min.js',
    '^proj4$': '<rootDir>/node_modules/proj4/dist/proj4.js',
    '^M/(.*)$': '<rootDir>/src/facade/js/$1',
    '^IDEE/(.*)$': '<rootDir>/src/facade/js/$1',
    '^impl/(.*)$': '<rootDir>/src/impl/ol/js/$1',
    '^plugins/(.*)$': '<rootDir>/src/plugins/$1',
    '^configuration/(.*)$': '<rootDir>/test/configuration_filtered/$1',
    '^patches$': '<rootDir>/src/impl/ol/js/patches_dev.js',
    '^@geoblocks/ol-maplibre-layer$': '<rootDir>/node_modules/@geoblocks/ol-maplibre-layer/lib/index.js',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
};
