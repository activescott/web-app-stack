export function randomEmail(): string {
  return `${randomInt()}@foo.bar`
}

export function randomInt(max = Number.MAX_SAFE_INTEGER): number {
  return Math.floor(Math.random() * Math.floor(max))
}
