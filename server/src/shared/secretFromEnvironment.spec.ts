import sinon from "sinon"
import { randomInt } from "../../test/support"
import { secretFromEnvironment } from "./secretEnvironment"

// preserve environment
const OLD_ENV = process.env
afterAll(() => {
  process.env = OLD_ENV
})

afterEach(() => {
  process.env = OLD_ENV
  sinon.restore()
})

it("should return value if in environment", () => {
  const ENV_NAME = `TEST_ENV_${randomInt()}`
  const testPrimary = `test-primary${randomInt()}`
  const testFallback = `test-fallback-${randomInt()}`
  process.env[ENV_NAME] = testPrimary
  const result = secretFromEnvironment(ENV_NAME, testFallback)
  expect(result).toEqual(testPrimary)
})

it("should use fallback if not in env in non-production", () => {
  const ENV_NAME = `TEST_ENV_${randomInt()}`
  const testFallback = `test-fallback-${randomInt()}`
  sinon.stub(console, "warn")

  delete process.env[ENV_NAME]
  const result = secretFromEnvironment(ENV_NAME, testFallback)
  expect(result).toEqual(testFallback)
})

it("should fail if not in env in production", () => {
  const ENV_NAME = `TEST_ENV_${randomInt()}`
  const testFallback = `test-fallback-${randomInt()}`
  sinon.stub(console, "warn")

  process.env.NODE_ENV = "production"
  delete process.env[ENV_NAME]
  expect(() => secretFromEnvironment(ENV_NAME, testFallback)).toThrowError(
    new RegExp(ENV_NAME)
  )
})
