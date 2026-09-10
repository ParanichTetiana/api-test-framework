module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/specs/**/*.test.js'],
  testTimeout: 20000, // Oracle + network calls need more than the 5s default
  setupFiles: ['dotenv/config'],
  globalSetup: '<rootDir>/tests/hooks/globalSetup.js',
  verbose: true,
};
