import { useEffect } from "react"

// https://stackoverflow.com/questions/34424845/adding-script-tag-to-react-jsx
export const useScriptUrl = (url: string, async: boolean = true): void => {
  useEffect(() => {
    const existing = document?.querySelectorAll(`script[url="${url}"]`)
    if (existing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("script URL already embedded, skipping")
      return
    }

    const script = document.createElement("script")

    script.src = url
    if (async) script.async = async

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [async, url])
}

export const useScriptInline = (inlineScript: string): void => {
  useEffect(() => {
    // first see if our script is already embedded
    const hash = hashCode(inlineScript)
    const existing = document?.querySelectorAll(`script[data-hash="${hash}"]`)
    if (existing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn("inline script already embedded, skipping")
      return
    }

    const script = document.createElement("script")
    script.setAttribute("data-hash", hash.toString())
    script.innerHTML = inlineScript
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [inlineScript])
}

// based on https://stackoverflow.com/a/7616484
const hashCode = (str: string): number => {
  let hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    // eslint-disable-next-line no-magic-numbers
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}
