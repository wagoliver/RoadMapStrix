import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx',
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^nanoid$': '<rootDir>/src/test/__mocks__/nanoid.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/store/**/*.{ts,tsx}',
    'src/types/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

export default config
