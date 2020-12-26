/* eslint-env node */

module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFiles: [],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json"
    }
  },
  collectCoverageFrom: [
    "pages/**/*.ts",
    "components/**/*.ts",
    "lib/**/*.ts",
    "config/**/*.ts"
  ],
  testPathIgnorePatterns: ["/node_modules/", "/example", "/packages"],
  // https://jestjs.io/docs/en/configuration.html#modulefileextensions-array
  moduleFileExtensions: ["ts", "tsx", "js", "json", "jsx", "node"],
  // https://jestjs.io/docs/en/webpack#mocking-css-modules
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy"
  },
  transformIgnorePatterns: [
    "node_modules/(?!(\@activescott/cookieconsent)/)"
  ]
}
