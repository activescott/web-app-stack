import fetch from "isomorphic-unfetch"

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const resp = await fetch(url, init)
  if (resp.ok) {
    return (await resp.json()) as T
  } else {
    throw new Error(`Error fetching ${url}: ${resp.status}: ${resp.statusText}`)
  }
}
