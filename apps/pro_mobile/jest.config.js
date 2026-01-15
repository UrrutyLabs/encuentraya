module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@hooks/(.*)$": "<rootDir>/src/hooks/$1",
    "^@hooks$": "<rootDir>/src/hooks",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@components$": "<rootDir>/src/components",
    "^@screens/(.*)$": "<rootDir>/src/screens/$1",
    "^@screens$": "<rootDir>/src/screens",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@lib$": "<rootDir>/src/lib",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/*.stories.{ts,tsx}",
  ],
  transformIgnorePatterns: ["node_modules/(?!(@react-native|react-native|@tanstack|@trpc))"],
};
