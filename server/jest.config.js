module.exports = {
  preset: "ts-jest",
  moduleFileExtensions: ["ts", "tsx", "json", "js"],
  testEnvironment: "node",
  setupFiles: ["./test/support/setup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/react-app/**"],
  testPathIgnorePatterns: ["/node_modules/"],
}
