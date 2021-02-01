const MS_PER_SECOND = 1000
const SECONDS_PER_HOUR = 60 * 60
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR

type Seconds = number
type Milliseconds = number
type Days = number

/** Converts specified value in seconds to milliseconds */
export function secondsToMilliseconds(seconds: Seconds): Milliseconds {
  return seconds * MS_PER_SECOND
}

/** Converts specified value in milliseconds to seconds */
export function millisecondsToSeconds(milliseconds: Milliseconds): Seconds {
  return milliseconds / MS_PER_SECOND
}
/** Converts specified value from days to seconds */
export function daysToSeconds(days: Days): Seconds {
  return SECONDS_PER_DAY * days
}
