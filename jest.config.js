module.exports = {
  bail: 1,
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: ['./src/**/*.+(ts)', '!./src/index.ts'],
  errorOnDeprecated: true,
  maxConcurrency: 1,
  notify: true,
  preset: 'ts-jest',
  reporters: [
    'default',
    [
      './node_modules/jest-html-reporter',
      {
        outputPath: 'docs/test_report.html',
        pageTitle: 'Test Report',
      },
    ],
  ],
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/?(*.)+(test).+(ts|tsx|js)',
    '**/?(*.)+(test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
  },
  verbose: true,
};
