type ClassName = string | undefined

/** Combines the specified `className` values for react and ensures each are space delimited. Handles provided as string or unspecified `className` values. */
export function combineClassNames(
  className: ClassName,
  ...moreClassNames: ClassName[]
): string {
  let combined = className || ""
  for (const cls of moreClassNames) {
    if (cls) combined += " " + cls
  }
  return combined
}
