const { jest } = require('./package.json');

// Runs the tests with the built CommonJS file instead of the source.
module.exports = {
  ...jest,
  moduleNameMapper: {
    '^\\.\\./src$': '<rootDir>/dist/index.cjs.js',
  },
};
