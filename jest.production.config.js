const { jest } = require('./package.json');

// Runs the tests with the production build of mutative, while React keeps
// its development build, which `act()` needs.
module.exports = {
  ...jest,
  globals: {
    ...jest.globals,
    __MUTATIVE_BUILD__: 'production',
  },
  moduleNameMapper: {
    '^mutative$': 'mutative/dist/mutative.cjs.production.min.js',
  },
};
