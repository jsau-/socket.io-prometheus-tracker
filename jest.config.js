module.exports = {
    bail: 1,
    clearMocks: true,
    collectCoverage: true,
    collectCoverageFrom: [
      './src/**/*.+(ts)',

    ],
    coverageThreshold: {
      global: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: -1,
      },
    },
    errorOnDeprecated: true,
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
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(test).+(ts|tsx|js)"
    ],
    transform: {
      '^.+\\.(ts)$': 'ts-jest',
    },
    verbose: true,
  };
