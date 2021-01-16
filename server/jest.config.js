module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "json", "js"],
  testEnvironment: "node",
  setupFiles: ["./test/support/setup.ts"],
  globalSetup: "./test/support/globalSetup.ts",
  globalTeardown: "./test/support/globalTeardown.ts",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.prod.json",
    },
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/react-app/**"],
  testPathIgnorePatterns: ["/node_modules/"],
}
